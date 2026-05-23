import {
  Button,
  Menu,
  MenuItem,
  MenuTrigger,
  Popover,
} from "react-aria-components";
import { useConnectedDeviceData } from "./rpc/useConnectedDeviceData";
import { useSub } from "./usePubSub";
import { useContext, useEffect, useState } from "react";
import { useModalRef } from "./misc/useModalRef";
import { LockStateContext } from "./rpc/LockStateContext";
import { LockState } from "@zmkfirmware/zmk-studio-ts-client/core";
import { ConnectionContext } from "./rpc/ConnectionContext";
import { ChevronDown, Undo2, Redo2, Save, Trash2, Sun, Moon } from "lucide-react";
import { Tooltip } from "./misc/Tooltip";
import { GenericModal } from "./GenericModal";

export interface AppHeaderProps {
  connectedDeviceLabel?: string;
  onSave?: () => void | Promise<void>;
  onDiscard?: () => void | Promise<void>;
  onUndo?: () => Promise<void>;
  onRedo?: () => Promise<void>;
  onResetSettings?: () => void | Promise<void>;
  onDisconnect?: () => void | Promise<void>;
  canUndo?: boolean;
  canRedo?: boolean;
}

export const AppHeader = ({
  connectedDeviceLabel,
  canRedo, canUndo,
  onRedo, onUndo, onSave, onDiscard, onDisconnect, onResetSettings,
}: AppHeaderProps) => {
  const [showSettingsReset, setShowSettingsReset] = useState(false);
  const lockState = useContext(LockStateContext);
  const connectionState = useContext(ConnectionContext);

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("arc-theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    root.style.colorScheme = darkMode ? "dark" : "light";
    root.classList.toggle("dark", darkMode);
    localStorage.setItem("arc-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    if ((!connectionState.conn || lockState != LockState.ZMK_STUDIO_CORE_LOCK_STATE_UNLOCKED) && showSettingsReset)
      setShowSettingsReset(false);
  }, [lockState, showSettingsReset]);

  const showSettingsRef = useModalRef(showSettingsReset);
  const [unsaved, setUnsaved] = useConnectedDeviceData<boolean>(
    { keymap: { checkUnsavedChanges: true } },
    (r) => r.keymap?.checkUnsavedChanges
  );
  useSub("rpc_notification.keymap.unsavedChangesStatusChanged", (unsaved) => setUnsaved(unsaved));

  const iconBtn = "flex items-center justify-center p-2 rounded-xl transition-all duration-200";

  return (
    <header className="glass-heavy sticky top-0 left-0 right-0 z-50 grid grid-cols-[1fr_auto_1fr] items-center h-12 max-w-full rounded-b-2xl">
      <div className="flex px-4 items-center gap-2.5">
        <span className="text-lg font-bold tracking-wider bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">ARC</span>
        <div className="w-px h-4 bg-base-content/10" />
        <span className="text-xs text-base-content/35 font-medium">改键器</span>
      </div>

      <GenericModal ref={showSettingsRef} className="max-w-[50vw]">
        <div className="flex flex-col gap-4 py-1">
          <h2 className="text-lg font-semibold">⚠️ 恢复出厂设置</h2>
          <div className="glass rounded-xl p-4 text-sm">
            <p className="text-base-content/50 leading-relaxed">此操作将清除所有自定义键位设置，恢复为默认键位映射。</p>
          </div>
          <p className="text-sm font-medium">确定要继续吗？</p>
          <div className="flex justify-end gap-3">
            <Button className="btn-apple rounded-xl bg-base-200 hover:bg-base-300 px-5 py-2.5 text-sm" onPress={() => setShowSettingsReset(false)}>取消</Button>
            <Button className="btn-apple rounded-xl bg-error text-error-content px-5 py-2.5 text-sm font-medium" onPress={() => { setShowSettingsReset(false); onResetSettings?.(); }}>确认恢复</Button>
          </div>
        </div>
      </GenericModal>

      <MenuTrigger>
        <Button className="text-center rac-disabled:opacity-0 hover:bg-base-content/5 transition-all duration-200 p-2 pl-3.5 rounded-xl text-sm font-medium" isDisabled={!connectedDeviceLabel}>
          <span className="inline-flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-75" style={{ animation: "ping 1.5s cubic-bezier(0,0,0.2,1) infinite" }}></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
            </span>
            {connectedDeviceLabel}
          </span>
          <ChevronDown className="inline-block w-3.5 ml-1.5 text-base-content/30" />
        </Button>
        <Popover>
          <Menu className="glass-heavy shadow-apple-lg rounded-xl text-base-content cursor-pointer overflow-hidden min-w-[160px]">
            <MenuItem className="px-4 py-2.5 hover:bg-base-content/5 text-sm outline-none" onAction={onDisconnect}>断开连接</MenuItem>
            <div className="h-px bg-base-content/5 mx-2" />
            <MenuItem className="px-4 py-2.5 hover:bg-error/10 text-sm text-error outline-none" onAction={() => setShowSettingsReset(true)}>恢复出厂设置</MenuItem>
          </Menu>
        </Popover>
      </MenuTrigger>

      <div className="flex justify-end gap-0.5 px-3 items-center">
        {onUndo && (
          <Tooltip label="撤销"><Button className={`${iconBtn} enabled:hover:bg-base-content/5 disabled:opacity-20 enabled:active:scale-90`} isDisabled={!canUndo} onPress={onUndo}><Undo2 className="w-4 h-4" /></Button></Tooltip>
        )}
        {onRedo && (
          <Tooltip label="重做"><Button className={`${iconBtn} enabled:hover:bg-base-content/5 disabled:opacity-20 enabled:active:scale-90`} isDisabled={!canRedo} onPress={onRedo}><Redo2 className="w-4 h-4" /></Button></Tooltip>
        )}
        <div className="w-px h-5 bg-base-content/8 mx-1" />
        <Tooltip label="保存"><Button className={`${iconBtn} enabled:hover:bg-success/15 enabled:hover:text-success disabled:opacity-20 enabled:active:scale-90`} isDisabled={!unsaved} onPress={onSave}><Save className="w-4 h-4" /></Button></Tooltip>
        <Tooltip label="撤销更改"><Button className={`${iconBtn} enabled:hover:bg-error/15 enabled:hover:text-error disabled:opacity-20 enabled:active:scale-90`} onPress={onDiscard} isDisabled={!unsaved}><Trash2 className="w-4 h-4" /></Button></Tooltip>
        <div className="w-px h-5 bg-base-content/8 mx-1" />
        <Tooltip label={darkMode ? "亮色模式" : "暗色模式"}>
          <button onClick={() => setDarkMode(!darkMode)} className="relative flex items-center justify-center w-8 h-8 rounded-xl hover:bg-base-content/5 transition-all duration-300 active:scale-90 overflow-hidden">
            <Sun className={`w-4 h-4 absolute transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${darkMode ? "rotate-0 scale-100 opacity-100 text-amber-400" : "-rotate-90 scale-0 opacity-0"}`} />
            <Moon className={`w-4 h-4 absolute transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${darkMode ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100 text-base-content/40"}`} />
          </button>
        </Tooltip>
      </div>
    </header>
  );
};
