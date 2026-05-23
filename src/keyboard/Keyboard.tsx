import React, {
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { call_rpc } from "../rpc/logging";
import {
  PhysicalLayout,
  Keymap,
  SetLayerBindingResponse,
  SetLayerPropsResponse,
  BehaviorBinding,
  Layer,
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
import { deserializeLayoutZoom, LayoutZoom } from "./PhysicalLayout";
import { useLocalStorageState } from "../misc/useLocalStorageState";

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
    let ignore = false;
    startRequest();
    return () => { ignore = true; };
  }, [connection, lockState]);

  return behaviors;
}

function useLayouts(): [PhysicalLayout[] | undefined, React.Dispatch<SetStateAction<PhysicalLayout[] | undefined>>, number, React.Dispatch<SetStateAction<number>>] {
  let connection = useContext(ConnectionContext);
  let lockState = useContext(LockStateContext);
  const [layouts, setLayouts] = useState<PhysicalLayout[] | undefined>(undefined);
  const [selectedPhysicalLayoutIndex, setSelectedPhysicalLayoutIndex] = useState<number>(0);

  useEffect(() => {
    if (!connection.conn || lockState != LockState.ZMK_STUDIO_CORE_LOCK_STATE_UNLOCKED) { setLayouts(undefined); return; }
    async function startRequest() {
      setLayouts(undefined);
      if (!connection.conn) return;
      let response = await call_rpc(connection.conn, { keymap: { getPhysicalLayouts: true } });
      if (!ignore) {
        setLayouts(response?.keymap?.getPhysicalLayouts?.layouts);
        setSelectedPhysicalLayoutIndex(response?.keymap?.getPhysicalLayouts?.activeLayoutIndex || 0);
      }
    }
    let ignore = false;
    startRequest();
    return () => { ignore = true; };
  }, [connection, lockState]);

  return [layouts, setLayouts, selectedPhysicalLayoutIndex, setSelectedPhysicalLayoutIndex];
}

export default function Keyboard() {
  const [layouts, _setLayouts, selectedPhysicalLayoutIndex, setSelectedPhysicalLayoutIndex] = useLayouts();
  const [keymap, setKeymap] = useConnectedDeviceData<Keymap>(
    { keymap: { getKeymap: true } },
    (keymap) => keymap?.keymap?.getKeymap,
    true
  );
  const [keymapScale, setKeymapScale] = useLocalStorageState<LayoutZoom>("keymapScale", "auto", { deserialize: deserializeLayoutZoom });
  const [selectedLayerIndex, setSelectedLayerIndex] = useState<number>(0);
  const [selectedKeyPosition, setSelectedKeyPosition] = useState<number | undefined>(undefined);
  const behaviors = useBehaviors();
  const conn = useContext(ConnectionContext);
  const undoRedo = useContext(UndoRedoContext);

  useEffect(() => { setSelectedLayerIndex(0); setSelectedKeyPosition(undefined); }, [conn]);

  useEffect(() => {
    async function performSetRequest() {
      if (!conn.conn || !layouts) return;
      let resp = await call_rpc(conn.conn, { keymap: { setActivePhysicalLayout: selectedPhysicalLayoutIndex } });
      let new_keymap = resp?.keymap?.setActivePhysicalLayout?.ok;
      if (new_keymap) setKeymap(new_keymap);
    }
    performSetRequest();
  }, [selectedPhysicalLayoutIndex]);

  let doSelectPhysicalLayout = useCallback((i: number) => {
    let oldLayout = selectedPhysicalLayoutIndex;
    undoRedo?.(async () => { setSelectedPhysicalLayoutIndex(i); return async () => { setSelectedPhysicalLayoutIndex(oldLayout); }; });
  }, [undoRedo, selectedPhysicalLayoutIndex]);

  let doUpdateBinding = useCallback((binding: BehaviorBinding) => {
    if (!keymap || selectedKeyPosition === undefined) return;
    const layer = selectedLayerIndex;
    const layerId = keymap.layers[layer].id;
    const keyPosition = selectedKeyPosition;
    const oldBinding = keymap.layers[layer].bindings[keyPosition];
    undoRedo?.(async () => {
      if (!conn.conn) throw new Error("Not connected");
      let resp = await call_rpc(conn.conn, { keymap: { setLayerBinding: { layerId, keyPosition, binding } } });
      if (resp.keymap?.setLayerBinding === SetLayerBindingResponse.SET_LAYER_BINDING_RESP_OK)
        setKeymap(produce((draft: any) => { draft.layers[layer].bindings[keyPosition] = binding; }));
      return async () => {
        if (!conn.conn) return;
        let resp = await call_rpc(conn.conn, { keymap: { setLayerBinding: { layerId, keyPosition, binding: oldBinding } } });
        if (resp.keymap?.setLayerBinding === SetLayerBindingResponse.SET_LAYER_BINDING_RESP_OK)
          setKeymap(produce((draft: any) => { draft.layers[layer].bindings[keyPosition] = oldBinding; }));
      };
    });
  }, [conn, keymap, undoRedo, selectedLayerIndex, selectedKeyPosition]);

  let selectedBinding = useMemo(() => {
    if (keymap == null || selectedKeyPosition == null || !keymap.layers[selectedLayerIndex]) return null;
    return keymap.layers[selectedLayerIndex].bindings[selectedKeyPosition];
  }, [keymap, selectedLayerIndex, selectedKeyPosition]);

  const moveLayer = useCallback((start: number, end: number) => {
    const doMove = async (s: number, d: number) => {
      if (!conn.conn) return;
      let resp = await call_rpc(conn.conn, { keymap: { moveLayer: { startIndex: s, destIndex: d } } });
      if (resp.keymap?.moveLayer?.ok) { setKeymap(resp.keymap.moveLayer.ok); setSelectedLayerIndex(d); }
    };
    undoRedo?.(async () => { await doMove(start, end); return () => doMove(end, start); });
  }, [undoRedo]);

  const addLayer = useCallback(() => {
    async function doAdd(): Promise<number> {
      if (!conn.conn || !keymap) throw new Error("Not connected");
      const resp = await call_rpc(conn.conn, { keymap: { addLayer: {} } });
      if (resp.keymap?.addLayer?.ok) {
        const newSelection = keymap.layers.length;
        setKeymap(produce((draft: any) => { draft.layers.push(resp.keymap!.addLayer!.ok!.layer); draft.availableLayers--; }));
        setSelectedLayerIndex(newSelection);
        return resp.keymap.addLayer.ok.index;
      }
      throw new Error("Failed to add layer:" + resp.keymap?.addLayer?.err);
    }
    async function doRemove(layerIndex: number) {
      if (!conn.conn) throw new Error("Not connected");
      const resp = await call_rpc(conn.conn, { keymap: { removeLayer: { layerIndex } } });
      if (resp.keymap?.removeLayer?.ok) setKeymap(produce((draft: any) => { draft.layers.splice(layerIndex, 1); draft.availableLayers++; }));
    }
    undoRedo?.(async () => { let index = await doAdd(); return () => doRemove(index); });
  }, [conn, undoRedo, keymap]);

  const removeLayer = useCallback(() => {
    async function doRemove(layerIndex: number) {
      if (!conn.conn || !keymap) throw new Error("Not connected");
      const resp = await call_rpc(conn.conn, { keymap: { removeLayer: { layerIndex } } });
      if (resp.keymap?.removeLayer?.ok) {
        if (layerIndex == keymap.layers.length - 1) setSelectedLayerIndex(layerIndex - 1);
        setKeymap(produce((draft: any) => { draft.layers.splice(layerIndex, 1); draft.availableLayers++; }));
      }
    }
    async function doRestore(layerId: number, atIndex: number) {
      if (!conn.conn) throw new Error("Not connected");
      const resp = await call_rpc(conn.conn, { keymap: { restoreLayer: { layerId, atIndex } } });
      if (resp.keymap?.restoreLayer?.ok) {
        setKeymap(produce((draft: any) => { draft.layers.splice(atIndex, 0, resp!.keymap!.restoreLayer!.ok); draft.availableLayers--; }));
        setSelectedLayerIndex(atIndex);
      }
    }
    if (!keymap) throw new Error("No keymap loaded");
    let index = selectedLayerIndex;
    let layerId = keymap.layers[index].id;
    undoRedo?.(async () => { await doRemove(index); return () => doRestore(layerId, index); });
  }, [conn, undoRedo, selectedLayerIndex]);

  const changeLayerName = useCallback((id: number, oldName: string, newName: string) => {
    async function changeName(layerId: number, name: string) {
      if (!conn.conn) throw new Error("Not connected");
      const resp = await call_rpc(conn.conn, { keymap: { setLayerProps: { layerId, name } } });
      if (resp.keymap?.setLayerProps == SetLayerPropsResponse.SET_LAYER_PROPS_RESP_OK)
        setKeymap(produce((draft: any) => { const li = draft.layers.findIndex((l: Layer) => l.id == layerId); draft.layers[li].name = name; }));
    }
    undoRedo?.(async () => { await changeName(id, newName); return async () => { await changeName(id, oldName); }; });
  }, [conn, undoRedo, keymap]);

  useEffect(() => {
    if (!keymap?.layers) return;
    if (selectedLayerIndex > keymap.layers.length - 1) setSelectedLayerIndex(keymap.layers.length - 1);
  }, [keymap, selectedLayerIndex]);

  return (
    <div className="grid grid-cols-[auto_1fr] grid-rows-[1fr_auto] max-w-full min-w-0 min-h-0 overflow-hidden">
      {/* 左侧面板 */}
      <div className="p-3 flex flex-col gap-3 glass-light row-span-2 rounded-r-2xl m-1 ml-0">
        {layouts && <PhysicalLayoutPicker layouts={layouts} selectedPhysicalLayoutIndex={selectedPhysicalLayoutIndex} onPhysicalLayoutClicked={doSelectPhysicalLayout} />}
        {keymap && <LayerPicker layers={keymap.layers} selectedLayerIndex={selectedLayerIndex} onLayerClicked={setSelectedLayerIndex} onLayerMoved={moveLayer} canAdd={(keymap.availableLayers || 0) > 0} canRemove={(keymap.layers?.length || 0) > 1} onAddClicked={addLayer} onRemoveClicked={removeLayer} onLayerNameChanged={changeLayerName} />}
      </div>

      {/* 中间键盘 */}
      {layouts && keymap && behaviors && (
        <div className="p-3 col-start-2 row-start-1 grid items-center justify-center relative min-w-0">
          <KeymapComp keymap={keymap} layout={layouts[selectedPhysicalLayoutIndex]} behaviors={behaviors} scale={keymapScale} selectedLayerIndex={selectedLayerIndex} selectedKeyPosition={selectedKeyPosition} onKeyPositionClicked={setSelectedKeyPosition} />
          <select className="absolute top-3 right-3 h-8 rounded-xl px-3 text-xs glass border-0 outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer font-medium text-base-content/40" value={keymapScale}
            onChange={(e) => setKeymapScale(deserializeLayoutZoom(e.target.value))}>
            <option value="auto">自动</option>
            <option value={0.25}>25%</option><option value={0.5}>50%</option><option value={0.75}>75%</option>
            <option value={1}>100%</option><option value={1.25}>125%</option><option value={1.5}>150%</option><option value={2}>200%</option>
          </select>
        </div>
      )}

      {/* ═══ 底部改键面板 — 悬浮卡片 ═══ */}
      {keymap && selectedBinding && (
        <div className="col-start-2 row-start-2 px-3 pb-3">
          <div className="glass-heavy rounded-2xl shadow-apple-lg p-4">
            <BehaviorBindingPicker
              binding={selectedBinding}
              behaviors={Object.values(behaviors)}
              layers={keymap.layers.map(({ id, name }, li) => ({ id, name: name || li.toLocaleString() }))}
              onBindingChanged={doUpdateBinding}
            />
          </div>
        </div>
      )}
    </div>
  );
}
