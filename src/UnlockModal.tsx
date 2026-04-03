import { useContext, useMemo } from "react";
import type { RpcTransport } from "@zmkfirmware/zmk-studio-ts-client/transport/index";
import type { AvailableDevice } from "./tauri/index";
import { LockStateContext } from "./rpc/LockStateContext";
import { LockState } from "@zmkfirmware/zmk-studio-ts-client/core";
import { ConnectionContext } from "./rpc/ConnectionContext";
import { useModalRef } from "./misc/useModalRef";
import { GenericModal } from "./GenericModal";
import { ExternalLink } from "./misc/ExternalLink";

export type TransportFactory = {
  label: string;
  connect?: () => Promise<RpcTransport>;
  pick_and_connect?: {
    list: () => Promise<Array<AvailableDevice>>;
    connect: (dev: AvailableDevice) => Promise<RpcTransport>;
  };
};

export interface UnlockModalProps {}

export const UnlockModal = ({}: UnlockModalProps) => {
  let conn = useContext(ConnectionContext);
  let lockState = useContext(LockStateContext);

  let open = useMemo(
    () =>
      !!conn.conn && lockState != LockState.ZMK_STUDIO_CORE_LOCK_STATE_UNLOCKED,
    [conn, lockState]
  );

  const dialog = useModalRef(open, false, false);

  return (
    <GenericModal ref={dialog}>
      <div className="flex flex-col items-center gap-3 py-2">
        <div className="text-4xl">🔐</div>
        <h1 className="text-xl font-bold">请解锁键盘</h1>
        <p className="text-sm opacity-70 text-center">
          出于安全考虑，使用改键功能前需要先解锁键盘。
          请按下键盘上的 <strong>Studio 解锁键</strong>。
        </p>
        <div className="bg-base-200 rounded-lg p-3 text-sm mt-1">
          <p className="opacity-60">
            💡 如果你的键位映射中没有解锁键，请参阅{" "}
            <ExternalLink href="https://zmk.dev/docs/keymaps/behaviors/studio-unlock">
              Studio 解锁文档
            </ExternalLink>
          </p>
        </div>
      </div>
    </GenericModal>
  );
};
