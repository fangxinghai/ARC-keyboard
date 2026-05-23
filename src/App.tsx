import { AppHeader } from "./AppHeader";
import { WatercolorBackground } from "./WatercolorBackground";

import { create_rpc_connection } from "@zmkfirmware/zmk-studio-ts-client";
import { call_rpc } from "./rpc/logging";

import type { Notification } from "@zmkfirmware/zmk-studio-ts-client/studio";
import { ConnectionState, ConnectionContext } from "./rpc/ConnectionContext";
import { Dispatch, useCallback, useEffect, useState } from "react";
import { TransportFactory } from "./ConnectModal";

import type { RpcTransport } from "@zmkfirmware/zmk-studio-ts-client/transport/index";
import { connect as gatt_connect } from "@zmkfirmware/zmk-studio-ts-client/transport/gatt";
import { connect as serial_connect } from "@zmkfirmware/zmk-studio-ts-client/transport/serial";
import {
  connect as tauri_ble_connect,
  list_devices as ble_list_devices,
} from "./tauri/ble";
import {
  connect as tauri_serial_connect,
  list_devices as serial_list_devices,
} from "./tauri/serial";
import Keyboard from "./keyboard/Keyboard";
import { UndoRedoContext, useUndoRedo } from "./undoRedo";
import { usePub, useSub } from "./usePubSub";
import { LockState } from "@zmkfirmware/zmk-studio-ts-client/core";
import { LockStateContext } from "./rpc/LockStateContext";
import { UnlockModal } from "./UnlockModal";
import { valueAfter } from "./misc/async";

declare global {
  interface Window {
    __TAURI_INTERNALS__?: object;
  }
}

export const TRANSPORTS: TransportFactory[] = [
  navigator.serial && { label: "USB", connect: serial_connect },
  ...(navigator.bluetooth && navigator.userAgent.indexOf("Linux") >= 0
    ? [{ label: "BLE", connect: gatt_connect }]
    : []),
  ...(window.__TAURI_INTERNALS__
    ? [{ label: "BLE", isWireless: true, pick_and_connect: { connect: tauri_ble_connect, list: ble_list_devices } }]
    : []),
  ...(window.__TAURI_INTERNALS__
    ? [{ label: "USB", pick_and_connect: { connect: tauri_serial_connect, list: serial_list_devices } }]
    : []),
].filter((t) => t !== undefined);

async function listen_for_notifications(
  notification_stream: ReadableStream<Notification>,
  signal: AbortSignal
): Promise<void> {
  let reader = notification_stream.getReader();
  const onAbort = () => { reader.cancel(); reader.releaseLock(); };
  signal.addEventListener("abort", onAbort, { once: true });
  do {
    let pub = usePub();
    try {
      let { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      pub("rpc_notification", value);
      const subsystem = Object.entries(value).find(([_k, v]) => v !== undefined);
      if (!subsystem) continue;
      const [subId, subData] = subsystem;
      const event = Object.entries(subData).find(([_k, v]) => v !== undefined);
      if (!event) continue;
      const [eventName, eventData] = event;
      pub(["rpc_notification", subId, eventName].join("."), eventData);
    } catch (e) {
      signal.removeEventListener("abort", onAbort);
      reader.releaseLock();
      throw e;
    }
  } while (true);
  signal.removeEventListener("abort", onAbort);
  reader.releaseLock();
  notification_stream.cancel();
}

async function connect(
  transport: RpcTransport,
  setConn: Dispatch<ConnectionState>,
  setConnectedDeviceName: Dispatch<string | undefined>,
  signal: AbortSignal
) {
  let conn = await create_rpc_connection(transport, { signal });
  let details = await Promise.race([
    call_rpc(conn, { core: { getDeviceInfo: true } })
      .then((r) => r?.core?.getDeviceInfo)
      .catch(() => undefined),
    valueAfter(undefined, 1000),
  ]);
  if (!details) { window.alert("连接设备失败，请检查连接后重试"); return; }
  listen_for_notifications(conn.notification_readable, signal)
    .then(() => { setConnectedDeviceName(undefined); setConn({ conn: null }); })
    .catch(() => { setConnectedDeviceName(undefined); setConn({ conn: null }); });
  setConnectedDeviceName(details.name);
  setConn({ conn });
}

function App() {
  const [conn, setConn] = useState<ConnectionState>({ conn: null });
  const [connectedDeviceName, setConnectedDeviceName] = useState<string | undefined>(undefined);
  const [doIt, undo, redo, canUndo, canRedo, reset] = useUndoRedo();
  const [connectionAbort, setConnectionAbort] = useState(new AbortController());
  const [lockState, setLockState] = useState<LockState>(LockState.ZMK_STUDIO_CORE_LOCK_STATE_LOCKED);

  useSub("rpc_notification.core.lockStateChanged", (ls) => setLockState(ls));

  useEffect(() => {
    if (!conn) { reset(); setLockState(LockState.ZMK_STUDIO_CORE_LOCK_STATE_LOCKED); }
    async function updateLockState() {
      if (!conn.conn) return;
      let locked_resp = await call_rpc(conn.conn, { core: { getLockState: true } });
      setLockState(locked_resp.core?.getLockState || LockState.ZMK_STUDIO_CORE_LOCK_STATE_LOCKED);
    }
    updateLockState();
  }, [conn, setLockState]);

  const save = useCallback(() => {
    async function doSave() {
      if (!conn.conn) return;
      let resp = await call_rpc(conn.conn, { keymap: { saveChanges: true } });
      if (!resp.keymap?.saveChanges || resp.keymap?.saveChanges.err)
        console.error("Failed to save changes", resp.keymap?.saveChanges);
    }
    doSave();
  }, [conn]);

  const discard = useCallback(() => {
    async function doDiscard() {
      if (!conn.conn) return;
      let resp = await call_rpc(conn.conn, { keymap: { discardChanges: true } });
      if (!resp.keymap?.discardChanges) console.error("Failed to discard changes", resp);
      reset(); setConn({ conn: conn.conn });
    }
    doDiscard();
  }, [conn]);

  const resetSettings = useCallback(() => {
    async function doReset() {
      if (!conn.conn) return;
      let resp = await call_rpc(conn.conn, { core: { resetSettings: true } });
      if (!resp.core?.resetSettings) console.error("Failed to settings reset", resp);
      reset(); setConn({ conn: conn.conn });
    }
    doReset();
  }, [conn]);

  const disconnect = useCallback(() => {
    async function doDisconnect() {
      if (!conn.conn) return;
      await conn.conn.request_writable.close();
      connectionAbort.abort("User disconnected");
      setConnectionAbort(new AbortController());
    }
    doDisconnect();
  }, [conn]);

  const onConnect = useCallback(
    (t: RpcTransport) => {
      const ac = new AbortController();
      setConnectionAbort(ac);
      connect(t, setConn, setConnectedDeviceName, ac.signal);
    },
    [setConn, setConnectedDeviceName]
  );

  return (
    <ConnectionContext.Provider value={conn}>
      <LockStateContext.Provider value={lockState}>
        <UndoRedoContext.Provider value={doIt}>
          <UnlockModal />

          {/* ═══ 水彩背景 ═══ */}
          <WatercolorBackground />
          <div className="white-wash" />
          <svg className="noise-overlay" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
            <defs>
              <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/></filter>
            </defs>
            <rect width="100%" height="100%" filter="url(#grain)"/>
          </svg>

          {/* ═══ 主内容 — 始终显示 ═══ */}
          <div className="relative z-10 text-base-content h-full max-h-[100vh] w-full max-w-[100vw] inline-grid grid-cols-[auto] grid-rows-[auto_1fr] overflow-hidden">
            <AppHeader
              connectedDeviceLabel={connectedDeviceName}
              canUndo={canUndo} canRedo={canRedo}
              onUndo={undo} onRedo={redo}
              onSave={save} onDiscard={discard}
              onDisconnect={disconnect} onResetSettings={resetSettings}
              transports={TRANSPORTS}
              onTransportCreated={onConnect}
            />
            <Keyboard />
          </div>
        </UndoRedoContext.Provider>
      </LockStateContext.Provider>
    </ConnectionContext.Provider>
  );
}

export default App;
