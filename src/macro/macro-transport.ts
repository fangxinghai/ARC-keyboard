import { MACRO_PROTOCOL_MARKER } from "./macro-types";
import { decodeResponse, MacroResponse } from "./macro-protocol";

// ══════════════════════════════════════════════════════════
//  帧编解码（复制自 framing.js，避免 import 兼容问题）
// ══════════════════════════════════════════════════════════

const FRAMING_SOF = 0xab;
const FRAMING_ESC = 0xac;
const FRAMING_EOF = 0xad;

function frameEncode(payload: Uint8Array): Uint8Array {
  const parts: number[] = [FRAMING_SOF];
  for (const b of payload) {
    if (b === FRAMING_SOF || b === FRAMING_ESC || b === FRAMING_EOF) {
      parts.push(FRAMING_ESC);
    }
    parts.push(b);
  }
  parts.push(FRAMING_EOF);
  return new Uint8Array(parts);
}

enum DecodeState {
  IDLE,
  AWAITING_DATA,
  ESCAPED,
}

function createFrameDecoder(): TransformStream<Uint8Array, Uint8Array> {
  let state = DecodeState.IDLE;
  let data: number[] = [];

  return new TransformStream({
    transform(chunk, controller) {
      for (let i = 0; i < chunk.length; i++) {
        const b = chunk[i];
        switch (state) {
          case DecodeState.IDLE:
            if (b === FRAMING_SOF) {
              state = DecodeState.AWAITING_DATA;
              data = [];
            }
            break;
          case DecodeState.AWAITING_DATA:
            if (b === FRAMING_SOF) {
              // 异常：帧中间收到 SOF，丢弃当前帧，重新开始
              data = [];
            } else if (b === FRAMING_ESC) {
              state = DecodeState.ESCAPED;
            } else if (b === FRAMING_EOF) {
              controller.enqueue(new Uint8Array(data));
              data = [];
              state = DecodeState.IDLE;
            } else {
              data.push(b);
            }
            break;
          case DecodeState.ESCAPED:
            data.push(b);
            state = DecodeState.AWAITING_DATA;
            break;
        }
      }
    },
  });
}

function createFrameEncoder(): TransformStream<Uint8Array, Uint8Array> {
  return new TransformStream({
    transform(chunk, controller) {
      controller.enqueue(frameEncode(chunk));
    },
  });
}

// ══════════════════════════════════════════════════════════
//  Mutex：防止 RPC 和宏同时写串口
// ══════════════════════════════════════════════════════════

class SimpleMutex {
  private _queue: Array<() => void> = [];
  private _locked = false;

  async acquire(): Promise<void> {
    if (!this._locked) {
      this._locked = true;
      return;
    }
    return new Promise<void>((resolve) => {
      this._queue.push(resolve);
    });
  }

  release(): void {
    if (this._queue.length > 0) {
      const next = this._queue.shift()!;
      next();
    } else {
      this._locked = false;
    }
  }

  async runExclusive<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }
}

// ══════════════════════════════════════════════════════════
//  MacroTransport：Transport 层旁路
// ══════════════════════════════════════════════════════════

export interface MacroTransportHandle {
  /** 发送宏命令 payload（自动帧编码+mutex） */
  send: (payload: Uint8Array) => Promise<void>;
  /** 注册宏响应回调 */
  onResponse: (cb: (resp: MacroResponse) => void) => void;
  /** 移除宏响应回调 */
  offResponse: () => void;
  /** 包装后的 transport，传给 create_rpc_connection */
  wrappedTransport: {
    label: string;
    abortController: AbortController;
    readable: ReadableStream<Uint8Array>;
    writable: WritableStream<Uint8Array>;
  };
}

export function createMacroTransport(originalTransport: {
  label: string;
  abortController: AbortController;
  readable: ReadableStream<Uint8Array>;
  writable: WritableStream<Uint8Array>;
}): MacroTransportHandle {
  let responseCallback: ((resp: MacroResponse) => void) | null = null;
  const writeMutex = new SimpleMutex();

  // ── 1. 帧解码原始字节流 ───────────────────────
  const frameDecoder = createFrameDecoder();
  const decodedStream = originalTransport.readable.pipeThrough(frameDecoder);

  // ── 2. 分流：宏帧 vs ZMK Studio 帧 ───────────
  let macroController: ReadableStreamDefaultController<Uint8Array>;
  let studioController: ReadableStreamDefaultController<Uint8Array>;

  const macroReadable = new ReadableStream<Uint8Array>({
    start(c) {
      macroController = c;
    },
  });

  const studioReadable = new ReadableStream<Uint8Array>({
    start(c) {
      studioController = c;
    },
  });

  // 消费解码后的帧流，做分流
  const reader = decodedStream.getReader();
  (async () => {
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          macroController.close();
          studioController.close();
          break;
        }
        if (value.length > 0 && value[0] === MACRO_PROTOCOL_MARKER) {
          macroController.enqueue(value);
        } else {
          studioController.enqueue(value);
        }
      }
    } catch (e) {
      try { macroController.close(); } catch {}
      try { studioController.close(); } catch {}
    }
  })();

  // ── 3. 宏帧流 → 解码 → 回调 ──────────────────
  const macroReader = macroReadable.getReader();
  (async () => {
    try {
      while (true) {
        const { done, value } = await macroReader.read();
        if (done) break;
        const resp = decodeResponse(value);
        if (resp && responseCallback) {
          try {
            responseCallback(resp);
          } catch (e) {
            console.error("Macro response callback error:", e);
          }
        }
      }
    } catch (e) {
      console.log("Macro reader ended:", e);
    }
  })();

  // ── 4. Studio 帧流 → 重新帧编码 → 喂给 RPC ──
  // create_rpc_connection 内部会再做帧解码，
  // 所以需要把解码后的帧重新编码回字节流
  const reEncodedStream = studioReadable.pipeThrough(createFrameEncoder());

  // ── 5. 包装 writable，所有写入自动走 mutex ────
  const wrappedWritable = new WritableStream<Uint8Array>({
    async write(chunk) {
      await writeMutex.runExclusive(async () => {
        const w = originalTransport.writable.getWriter();
        await w.write(chunk);
        w.releaseLock();
      });
    },
    async close() {
      await originalTransport.writable.close();
    },
    async abort(reason) {
      await originalTransport.writable.abort(reason);
    },
  });

  // ── 6. 宏命令发送函数 ─────────────────────────
  const sendMacro = async (payload: Uint8Array) => {
    const encoded = frameEncode(payload);
    await writeMutex.runExclusive(async () => {
      const w = originalTransport.writable.getWriter();
      await w.write(encoded);
      w.releaseLock();
    });
  };

  return {
    send: sendMacro,
    onResponse: (cb) => {
      responseCallback = cb;
    },
    offResponse: () => {
      responseCallback = null;
    },
    wrappedTransport: {
      label: originalTransport.label,
      abortController: originalTransport.abortController,
      readable: reEncodedStream,
      writable: wrappedWritable,
    },
  };
}
