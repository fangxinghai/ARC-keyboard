import React, {
  SetStateAction, useCallback, useContext, useEffect, useMemo, useState,
} from "react";
import { call_rpc } from "../rpc/logging";
import {
  PhysicalLayout, Keymap, SetLayerBindingResponse, SetLayerPropsResponse, BehaviorBinding, Layer,
} from "@zmkfirmware/zmk-studio-ts-client/keymap";
import type { GetBehaviorDetailsResponse } from "@zmkfirmware/zmk-studio-ts-client/behaviors";
import { LayerPicker } from "./LayerPicker";
import { PhysicalLayoutPicker } from "./PhysicalLayoutPicker";
import { Keymap as KeymapComp } from "./Keymap";
import { useConnectedDeviceData } from "../rpc/useConnectedDeviceData";
import { ConnectionContext } from "../rpc/ConnectionContext";
import { UndoRedoContext } from "../undoRedo";
import { BehaviorBindingPicker } from "../behaviors/BehaviorBindingPicker";
import { produce } from "immer";
import { LockStateContext } from "../rpc/LockStateContext";
import { LockState } from "@zmkfirmware/zmk-studio-ts-client/core";
import { deserializeLayoutZoom, LayoutZoom, PhysicalLayout as PhysicalLayoutComp } from "./PhysicalLayout";
import { useLocalStorageState } from "../misc/useLocalStorageState";
import { Key } from "./Key";

type BehaviorMap = Record<number, GetBehaviorDetailsResponse>;

function useBehaviors(): BehaviorMap {
  let connection = useContext(ConnectionContext);
  let lockState = useContext(LockStateContext);
  const [behaviors, setBehaviors] = useState<BehaviorMap>({});
  useEffect(() => {
    if (!connection.conn || lockState != LockState.ZMK_STUDIO_CORE_LOCK_STATE_UNLOCKED) { setBehaviors({}); return; }
    async function startRequest() {
      setBehaviors({});
      if (!connection.conn) return;
      let behavior_list = await call_rpc(connection.conn, { behaviors: { listAllBehaviors: true } });
      if (!ignore) {
        let behavior_map: BehaviorMap = {};
        for (let behaviorId of behavior_list.behaviors?.listAllBehaviors?.behaviors || []) {
          if (ignore) break;
          let behavior_details = await call_rpc(connection.conn, { behaviors: { getBehaviorDetails: { behaviorId } } });
          let dets = behavior_details?.behaviors?.getBehaviorDetails;
          if (dets) behavior_map[dets.id] = dets;
        }
        if (!ignore) setBehaviors(behavior_map);
      }
    }
    let ignore = false; startRequest();
    return () => { ignore = true; };
  }, [connection, lockState]);
  return behaviors;
}

function useLayouts(): [PhysicalLayout[] | undefined, React.Dispatch<SetStateAction<PhysicalLayout[] | undefined>>, number, React.Dispatch<SetStateAction<number>>] {
  let connection = useContext(ConnectionContext);
  let lockState = useContext(LockStateContext);
  const [layouts, setLayouts] = useState<PhysicalLayout[] | undefined>(undefined);
  const [idx, setIdx] = useState<number>(0);
  useEffect(() => {
    if (!connection.conn || lockState != LockState.ZMK_STUDIO_CORE_LOCK_STATE_UNLOCKED) { setLayouts(undefined); return; }
    async function startRequest() {
      setLayouts(undefined);
      if (!connection.conn) return;
      let r = await call_rpc(connection.conn, { keymap: { getPhysicalLayouts: true } });
      if (!ignore) { setLayouts(r?.keymap?.getPhysicalLayouts?.layouts); setIdx(r?.keymap?.getPhysicalLayouts?.activeLayoutIndex || 0); }
    }
    let ignore = false; startRequest();
    return () => { ignore = true; };
  }, [connection, lockState]);
  return [layouts, setLayouts, idx, setIdx];
}

// ─── 未连接时的占位键盘 ───
function PlaceholderKeyboard({ onKeyClicked }: { onKeyClicked?: (i: number) => void }) {
  // 模拟一个 4x2 + 2旋钮 的布局
  const rows = [
    [0, 1, 2],
    [3, 4, 5],
  ];
  const oneU = 80;
  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <div className="flex gap-8 items-start">
        {/* 按键区 */}
        <div className="relative">
          <div className="rounded-2xl border border-base-content/8 p-2">
            <div className="flex flex-col gap-1">
              {rows.map((row, ri) => (
                <div key={ri} className="flex gap-1">
                  {row.map((idx) => (
                    <div key={idx} onClick={() => onKeyClicked?.(idx)}>
                      <Key oneU={oneU} width={1} height={1} selected={false}>
                        <span className="text-base-content/15 text-[10px]"></span>
                      </Key>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <span className="block text-center text-[10px] text-base-content/25 font-medium mt-1.5">按键</span>
        </div>

        {/* 旋钮区 */}
        <div className="relative">
          <div className="rounded-2xl border border-base-content/8 p-2">
            <div className="flex flex-col gap-1">
              {[6, 7].map((idx) => (
                <div key={idx} onClick={() => onKeyClicked?.(idx)}>
                  <Key oneU={oneU} width={1} height={1} selected={false}>
                    <span className="text-base-content/15 text-[10px]"></span>
                  </Key>
                </div>
              ))}
            </div>
          </div>
          <span className="block text-center text-[10px] text-base-content/25 font-medium mt-1.5">旋钮</span>
        </div>
      </div>
      <p className="text-xs text-base-content/25">连接键盘后显示真实布局</p>
    </div>
  );
}

export default function Keyboard() {
  const [layouts, _sl, selPhysIdx, setSelPhysIdx] = useLayouts();
  const [keymap, setKeymap] = useConnectedDeviceData<Keymap>({ keymap: { getKeymap: true } }, (k) => k?.keymap?.getKeymap, true);
  const [keymapScale, setKeymapScale] = useLocalStorageState<LayoutZoom>("keymapScale", "auto", { deserialize: deserializeLayoutZoom });
  const [selLayer, setSelLayer] = useState(0);
  const [selKey, setSelKey] = useState<number | undefined>(undefined);
  const behaviors = useBehaviors();
  const conn = useContext(ConnectionContext);
  const undoRedo = useContext(UndoRedoContext);
  const isConnected = !!conn.conn;

  useEffect(() => { setSelLayer(0); setSelKey(undefined); }, [conn]);
  useEffect(() => {
    async function go() {
      if (!conn.conn || !layouts) return;
      let r = await call_rpc(conn.conn, { keymap: { setActivePhysicalLayout: selPhysIdx } });
      if (r?.keymap?.setActivePhysicalLayout?.ok) setKeymap(r.keymap.setActivePhysicalLayout.ok);
    }
    go();
  }, [selPhysIdx]);

  let doSelectPhysicalLayout = useCallback((i: number) => {
    let old = selPhysIdx;
    undoRedo?.(async () => { setSelPhysIdx(i); return async () => { setSelPhysIdx(old); }; });
  }, [undoRedo, selPhysIdx]);

  let doUpdateBinding = useCallback((binding: BehaviorBinding) => {
    if (!keymap || selKey === undefined) return;
    const layer = selLayer, layerId = keymap.layers[layer].id, keyPosition = selKey;
    const oldBinding = keymap.layers[layer].bindings[keyPosition];
    undoRedo?.(async () => {
      if (!conn.conn) throw new Error("Not connected");
      let r = await call_rpc(conn.conn, { keymap: { setLayerBinding: { layerId, keyPosition, binding } } });
      if (r.keymap?.setLayerBinding === SetLayerBindingResponse.SET_LAYER_BINDING_RESP_OK)
        setKeymap(produce((d: any) => { d.layers[layer].bindings[keyPosition] = binding; }));
      return async () => {
        if (!conn.conn) return;
        let r2 = await call_rpc(conn.conn, { keymap: { setLayerBinding: { layerId, keyPosition, binding: oldBinding } } });
        if (r2.keymap?.setLayerBinding === SetLayerBindingResponse.SET_LAYER_BINDING_RESP_OK)
          setKeymap(produce((d: any) => { d.layers[layer].bindings[keyPosition] = oldBinding; }));
      };
    });
  }, [conn, keymap, undoRedo, selLayer, selKey]);

  let selectedBinding = useMemo(() => {
    if (!keymap || selKey == null || !keymap.layers[selLayer]) return null;
    return keymap.layers[selLayer].bindings[selKey];
  }, [keymap, selLayer, selKey]);

  const moveLayer = useCallback((s: number, e: number) => {
    const doMove = async (a: number, b: number) => {
      if (!conn.conn) return;
      let r = await call_rpc(conn.conn, { keymap: { moveLayer: { startIndex: a, destIndex: b } } });
      if (r.keymap?.moveLayer?.ok) { setKeymap(r.keymap.moveLayer.ok); setSelLayer(b); }
    };
    undoRedo?.(async () => { await doMove(s, e); return () => doMove(e, s); });
  }, [undoRedo]);

  const addLayer = useCallback(() => {
    async function doAdd(): Promise<number> {
      if (!conn.conn || !keymap) throw new Error("Not connected");
      const r = await call_rpc(conn.conn, { keymap: { addLayer: {} } });
      if (r.keymap?.addLayer?.ok) {
        setKeymap(produce((d: any) => { d.layers.push(r.keymap!.addLayer!.ok!.layer); d.availableLayers--; }));
        setSelLayer(keymap.layers.length);
        return r.keymap.addLayer.ok.index;
      }
      throw new Error("Failed");
    }
    async function doRemove(i: number) {
      if (!conn.conn) throw new Error("Not connected");
      const r = await call_rpc(conn.conn, { keymap: { removeLayer: { layerIndex: i } } });
      if (r.keymap?.removeLayer?.ok) setKeymap(produce((d: any) => { d.layers.splice(i, 1); d.availableLayers++; }));
    }
    undoRedo?.(async () => { let i = await doAdd(); return () => doRemove(i); });
  }, [conn, undoRedo, keymap]);

  const removeLayer = useCallback(() => {
    async function doRemove(i: number) {
      if (!conn.conn || !keymap) throw new Error("Not connected");
      const r = await call_rpc(conn.conn, { keymap: { removeLayer: { layerIndex: i } } });
      if (r.keymap?.removeLayer?.ok) {
        if (i == keymap.layers.length - 1) setSelLayer(i - 1);
        setKeymap(produce((d: any) => { d.layers.splice(i, 1); d.availableLayers++; }));
      }
    }
    async function doRestore(lid: number, at: number) {
      if (!conn.conn) throw new Error("Not connected");
      const r = await call_rpc(conn.conn, { keymap: { restoreLayer: { layerId: lid, atIndex: at } } });
      if (r.keymap?.restoreLayer?.ok) {
        setKeymap(produce((d: any) => { d.layers.splice(at, 0, r!.keymap!.restoreLayer!.ok); d.availableLayers--; }));
        setSelLayer(at);
      }
    }
    if (!keymap) throw new Error("No keymap");
    let i = selLayer, lid = keymap.layers[i].id;
    undoRedo?.(async () => { await doRemove(i); return () => doRestore(lid, i); });
  }, [conn, undoRedo, selLayer]);

  const changeLayerName = useCallback((id: number, oldName: string, newName: string) => {
    async function go(layerId: number, name: string) {
      if (!conn.conn) throw new Error("Not connected");
      const r = await call_rpc(conn.conn, { keymap: { setLayerProps: { layerId, name } } });
      if (r.keymap?.setLayerProps == SetLayerPropsResponse.SET_LAYER_PROPS_RESP_OK)
        setKeymap(produce((d: any) => { const li = d.layers.findIndex((l: Layer) => l.id == layerId); d.layers[li].name = name; }));
    }
    undoRedo?.(async () => { await go(id, newName); return async () => { await go(id, oldName); }; });
  }, [conn, undoRedo, keymap]);

  useEffect(() => {
    if (!keymap?.layers) return;
    if (selLayer > keymap.layers.length - 1) setSelLayer(keymap.layers.length - 1);
  }, [keymap, selLayer]);

  // ─── 是否有真实数据 ───
  const hasRealData = !!(layouts && keymap && Object.keys(behaviors).length > 0);

  return (
    <div className="grid grid-cols-[auto_1fr] grid-rows-[1fr_auto] max-w-full min-w-0 min-h-0 overflow-hidden p-2 pt-2 gap-2">
      {/* 左侧面板 */}
      <div className="glass-heavy rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] p-3 flex flex-col gap-3 row-span-2 min-w-[130px]">
        {layouts ? (
          <PhysicalLayoutPicker layouts={layouts} selectedPhysicalLayoutIndex={selPhysIdx} onPhysicalLayoutClicked={doSelectPhysicalLayout} />
        ) : (
          <div className="text-xs text-base-content/25">
            <p className="font-medium mb-1">Layout:</p>
            <p className="text-base-content/15">未连接</p>
          </div>
        )}
        {keymap ? (
          <LayerPicker layers={keymap.layers} selectedLayerIndex={selLayer} onLayerClicked={setSelLayer} onLayerMoved={moveLayer} canAdd={(keymap.availableLayers || 0) > 0} canRemove={(keymap.layers?.length || 0) > 1} onAddClicked={addLayer} onRemoveClicked={removeLayer} onLayerNameChanged={changeLayerName} />
        ) : (
          <div className="text-xs text-base-content/25">
            <p className="font-medium uppercase tracking-wider mb-1">Layers</p>
            <div className="glass-light rounded-xl p-2 text-center text-base-content/15">Layer 0</div>
          </div>
        )}
      </div>

      {/* 中间键盘 */}
      <div className="col-start-2 row-start-1 grid items-center justify-center relative min-w-0">
        {hasRealData ? (
          <>
            <KeymapComp keymap={keymap!} layout={layouts![selPhysIdx]} behaviors={behaviors} scale={keymapScale} selectedLayerIndex={selLayer} selectedKeyPosition={selKey} onKeyPositionClicked={setSelKey} />
            <select className="absolute top-1 right-1 h-7 rounded-lg px-2 text-xs glass border-0 outline-none cursor-pointer font-medium text-base-content/40"
              value={keymapScale} onChange={(e) => setKeymapScale(deserializeLayoutZoom(e.target.value))}>
              <option value="auto">自动</option>
              <option value={0.5}>50%</option><option value={0.75}>75%</option>
              <option value={1}>100%</option><option value={1.25}>125%</option><option value={1.5}>150%</option>
            </select>
          </>
        ) : (
          <PlaceholderKeyboard onKeyClicked={(i) => setSelKey(i)} />
        )}
      </div>

      {/* 底部面板 — 居中 + 宽度自适应 */}
      {selKey !== undefined && (
        <div className="col-start-2 row-start-2 flex justify-center">
          <div className="glass-heavy rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] p-4 w-full max-w-4xl transition-all duration-400 ease-out">
            {hasRealData && selectedBinding ? (
              <BehaviorBindingPicker
                binding={selectedBinding}
                behaviors={Object.values(behaviors)}
                layers={keymap!.layers.map(({ id, name }, li) => ({ id, name: name || li.toLocaleString() }))}
                onBindingChanged={doUpdateBinding}
              />
            ) : (
              <BehaviorBindingPicker
                binding={{ behaviorId: 0, param1: 0, param2: 0 }}
                behaviors={[]}
                layers={[{ id: 0, name: "Layer 0" }]}
                onBindingChanged={() => {
                  if (!isConnected) {
                    // 提示用户连接
                  }
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
