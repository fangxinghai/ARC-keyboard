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
import { ChevronDown, Undo2, Redo2, Save, Trash2 } from "lucide-react";
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
  canRedo,
  canUndo,
  onRedo,
  onUndo,
  onSave,
  onDiscard,
  onDisconnect,
  onResetSettings,
}: AppHeaderProps) => {
  const [showSettingsReset, setShowSettingsReset] = useState(false);

  const lockState = useContext(LockStateContext);
  const connectionState = useContext(ConnectionContext);

  useEffect(() => {
    if (
      (!connectionState.conn ||
        lockState != LockState.ZMK_STUDIO_CORE_LOCK_STATE_UNLOCKED) &&
      showSettingsReset
    ) {
      setShowSettingsReset(false);
    }
  }, [lockState, showSettingsReset]);

  const showSettingsRef = useModalRef(showSettingsReset);
  const [unsaved, setUnsaved] = useConnectedDeviceData<boolean>(
    { keymap: { checkUnsavedChanges: true } },
    (r) => r.keymap?.checkUnsavedChanges
  );

  useSub("rpc_notification.keymap.unsavedChangesStatusChanged", (unsaved) =>
    setUnsaved(unsaved)
  );

  return (
    <header className="top-0 left-0 right-0 grid grid-cols-[1fr_auto_1fr] items-center justify-between h-12 max-w-full border-b border-base-300">
      <div className="flex px-3 items-center gap-2">
        <span className="text-lg font-bold tracking-wider bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          ARC
        </span>
        <span className="text-xs opacity-40">改键器</span>
      </div>
      <GenericModal ref={showSettingsRef} className="max-w-[50vw]">
        <div className="flex flex-col gap-3 py-1">
          <h2 className="text-lg font-bold">⚠️ 恢复出厂设置</h2>
          <div className="bg-base-200 rounded-lg p-3 text-sm">
            <p className="opacity-70">
              此操作将清除所有自定义键位设置，恢复为默认键位映射。
            </p>
          </div>
          <p className="text-sm font-medium">确定要继续吗？</p>
          <div className="flex justify-end gap-2">
            <Button
              className="rounded-lg bg-base-200 hover:bg-base-300 px-4 py-2 text-sm transition-colors"
              onPress={() => setShowSettingsReset(false)}
            >
              取消
            </Button>
            <Button
              className="rounded-lg bg-error text-error-content hover:opacity-80 px-4 py-2 text-sm transition-colors"
              onPress={() => {
                setShowSettingsReset(false);
                onResetSettings?.();
              }}
            >
              确认恢复
            </Button>
          </div>
        </div>
      </GenericModal>
      <MenuTrigger>
        <Button
          className="text-center rac-disabled:opacity-0 hover:bg-base-300 transition-all duration-100 p-1.5 pl-3 rounded-lg text-sm"
          isDisabled={!connectedDeviceLabel}
        >
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
            {connectedDeviceLabel}
          </span>
          <ChevronDown className="inline-block w-4 ml-1" />
        </Button>
        <Popover>
          <Menu className="shadow-lg rounded-lg bg-base-100 text-base-content cursor-pointer overflow-hidden border border-base-300 min-w-[140px]">
            <MenuItem
              className="px-3 py-2 hover:bg-base-200 text-sm transition-colors"
              onAction={onDisconnect}
            >
              断开连接
            </MenuItem>
            <MenuItem
              className="px-3 py-2 hover:bg-base-200 text-sm transition-colors text-error"
              onAction={() => setShowSettingsReset(true)}
            >
              恢复出厂设置
            </MenuItem>
          </Menu>
        </Popover>
      </MenuTrigger>
      <div className="flex justify-end gap-1 px-3">
        {onUndo && (
          <Tooltip label="撤销">
            <Button
              className="flex items-center justify-center p-2 rounded-lg enabled:hover:bg-base-300 disabled:opacity-30 transition-colors"
              isDisabled={!canUndo}
              onPress={onUndo}
            >
              <Undo2 className="inline-block w-4" aria-label="撤销" />
            </Button>
          </Tooltip>
        )}

        {onRedo && (
          <Tooltip label="重做">
            <Button
              className="flex items-center justify-center p-2 rounded-lg enabled:hover:bg-base-300 disabled:opacity-30 transition-colors"
              isDisabled={!canRedo}
              onPress={onRedo}
            >
              <Redo2 className="inline-block w-4" aria-label="重做" />
            </Button>
          </Tooltip>
        )}
        <Tooltip label="保存">
          <Button
            className="flex items-center justify-center p-2 rounded-lg enabled:hover:bg-success enabled:hover:text-success-content disabled:opacity-30 transition-colors"
            isDisabled={!unsaved}
            onPress={onSave}
          >
            <Save className="inline-block w-4" aria-label="保存" />
          </Button>
        </Tooltip>
        <Tooltip label="撤销更改">
          <Button
            className="flex items-center justify-center p-2 rounded-lg enabled:hover:bg-error enabled:hover:text-error-content disabled:opacity-30 transition-colors"
            onPress={onDiscard}
            isDisabled={!unsaved}
          >
            <Trash2 className="inline-block w-4" aria-label="撤销更改" />
          </Button>
        </Tooltip>
      </div>
    </header>
  );
};
