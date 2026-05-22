import { useContext, useMemo } from "react";
import { LockStateContext } from "./rpc/LockStateContext";
import { LockState } from "@zmkfirmware/zmk-studio-ts-client/core";
import { ConnectionContext } from "./rpc/ConnectionContext";
import { useModalRef } from "./misc/useModalRef";
import { GenericModal } from "./GenericModal";
import { ExternalLink } from "./misc/ExternalLink";

export interface UnlockModalProps {}

export const UnlockModal = ({}: UnlockModalProps) => {
  let conn = useContext(ConnectionContext);
  let lockState = useContext(LockStateContext);

  let open = useMemo(
    () =>
      !!conn.conn &&
      lockState != LockState.ZMK_STUDIO_CORE_LOCK_STATE_UNLOCKED,
    [conn, lockState]
  );

  const dialog = useModalRef(open, false, false);

  return (
    <GenericModal ref={dialog}>
      <div className="flex flex-col items-center gap-4 py-3 max-w-sm mx-auto">
        {/* 图标 */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-4xl">
          🔐
        </div>

        {/* 标题 */}
        <h1 className="text-xl font-semibold text-base-content">请解锁键盘</h1>

        {/* 描述 */}
        <p className="text-sm text-base-content/50 text-center leading-relaxed">
          出于安全考虑，使用改键功能前需要先解锁键盘。
          <br />
          请按下键盘上的 <strong className="text-base-content/80">Studio 解锁键</strong>。
        </p>

        {/* 提示卡片 */}
        <div className="w-full glass rounded-xl p-4 text-sm">
          <p className="text-base-content/50 leading-relaxed">
            💡 如果你的键位映射中没有解锁键，请参阅{" "}
            <ExternalLink
              href="https://zmk.dev/docs/keymaps/behaviors/studio-unlock"
              className="text-primary hover:underline underline-offset-2"
            >
              Studio 解锁文档
            </ExternalLink>
          </p>
        </div>

        {/* 等待指示 */}
        <div className="flex items-center gap-2 text-xs text-base-content/30">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-soft" />
          等待键盘解锁中…
        </div>
      </div>
    </GenericModal>
  );
};
