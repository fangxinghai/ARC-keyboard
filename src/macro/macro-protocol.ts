import {
  MacroSlot,
  MacroStep,
  MACRO_CMD_GET_SLOTS,
  MACRO_CMD_SET_SLOT,
  MACRO_CMD_CLEAR_SLOT,
  MACRO_CMD_EXEC_SLOT,
  MACRO_RESP_SLOTS_DATA,
  MACRO_RESP_OK,
  MACRO_RESP_ERROR,
  MACRO_PROTOCOL_MARKER,
} from "./macro-types";

// ══════════════════════════════════════════════════════════
//  编码：构建命令 payload（不含 SOF/EOF，不含转义）
// ══════════════════════════════════════════════════════════

export function encodeGetSlots(): Uint8Array {
  return new Uint8Array([MACRO_PROTOCOL_MARKER, MACRO_CMD_GET_SLOTS]);
}

export function encodeSetSlot(slot: MacroSlot): Uint8Array {
  const nameBytes = new TextEncoder().encode(slot.name.slice(0, 32));
  const len = 2 + 1 + 1 + nameBytes.length + 2 + slot.steps.length * 11;
  const buf = new ArrayBuffer(len);
  const u8 = new Uint8Array(buf);
  const view = new DataView(buf);
  let offset = 0;

  u8[offset++] = MACRO_PROTOCOL_MARKER;
  u8[offset++] = MACRO_CMD_SET_SLOT;
  u8[offset++] = slot.id;
  u8[offset++] = nameBytes.length;
  u8.set(nameBytes, offset);
  offset += nameBytes.length;

  view.setUint16(offset, slot.steps.length, true);
  offset += 2;

  for (const step of slot.steps) {
    u8[offset++] = step.type;
    view.setUint32(offset, step.param1, true);
    offset += 4;
    view.setUint32(offset, step.param2, true);
    offset += 4;
    view.setUint16(offset, step.delayMs, true);
    offset += 2;
  }

  return u8.slice(0, offset);
}

export function encodeClearSlot(slotId: number): Uint8Array {
  return new Uint8Array([MACRO_PROTOCOL_MARKER, MACRO_CMD_CLEAR_SLOT, slotId]);
}

export function encodeExecSlot(slotId: number): Uint8Array {
  return new Uint8Array([MACRO_PROTOCOL_MARKER, MACRO_CMD_EXEC_SLOT, slotId]);
}

// ══════════════════════════════════════════════════════════
//  解码：解析响应 payload
// ══════════════════════════════════════════════════════════

export interface MacroResponse {
  type: "slots_data" | "ok" | "error";
  slots?: MacroSlot[];
  errorCode?: number;
}

export function decodeResponse(data: Uint8Array): MacroResponse | null {
  if (data.length < 2 || data[0] !== MACRO_PROTOCOL_MARKER) return null;

  const cmd = data[1];

  if (cmd === MACRO_RESP_OK) {
    return { type: "ok" };
  }

  if (cmd === MACRO_RESP_ERROR) {
    return { type: "error", errorCode: data.length > 2 ? data[2] : 0 };
  }

  if (cmd === MACRO_RESP_SLOTS_DATA) {
    return { type: "slots_data", slots: decodeSlotsData(data, 2) };
  }

  console.warn("Unknown macro response cmd:", cmd);
  return null;
}

function decodeSlotsData(
  data: Uint8Array,
  startOffset: number
): MacroSlot[] {
  const view = new DataView(
    data.buffer,
    data.byteOffset,
    data.byteLength
  );
  let offset = startOffset;

  if (offset >= data.length) return [];
  const slotCount = data[offset++];
  const slots: MacroSlot[] = [];

  for (let i = 0; i < slotCount && offset < data.length; i++) {
    const slotId = data[offset++];
    const nameLen = data[offset++];
    const name = new TextDecoder().decode(
      data.slice(offset, offset + nameLen)
    );
    offset += nameLen;

    if (offset + 2 > data.length) break;
    const stepCount = view.getUint16(offset, true);
    offset += 2;

    const steps: MacroStep[] = [];
    for (let j = 0; j < stepCount && offset + 11 <= data.length; j++) {
      const type = data[offset++];
      const param1 = view.getUint32(offset, true);
      offset += 4;
      const param2 = view.getUint32(offset, true);
      offset += 4;
      const delayMs = view.getUint16(offset, true);
      offset += 2;
      steps.push({ type, param1, param2, delayMs });
    }

    slots.push({ id: slotId, name, steps });
  }

  return slots;
}
