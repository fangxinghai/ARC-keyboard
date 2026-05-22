import React from "react";

export interface GenericModalProps {
  open?: boolean;
  onClose?: () => void;
  className?: string;
  children: React.ReactNode;
}

export const GenericModal = React.forwardRef(
  (
    { open, onClose, children, className }: GenericModalProps,
    ref: React.Ref<HTMLDialogElement>
  ) => {
    return (
      <dialog
        ref={ref}
        open={open}
        onClose={onClose}
        className={`
          p-6 rounded-2xl
          text-base-content
          shadow-apple-xl
          max-h-[85vh] overflow-auto
          border-0 outline-none

          /* 毛玻璃背景 */
          bg-[light-dark(rgba(255,255,255,0.88),rgba(28,28,30,0.88))]
          [backdrop-filter:blur(40px)_saturate(200%)]
          [-webkit-backdrop-filter:blur(40px)_saturate(200%)]

          /* 边框 */
          ring-1 ring-[light-dark(rgba(0,0,0,0.06),rgba(255,255,255,0.1))]

          /* 弹窗进入动画 */
          animate-scale-in

          /* 遮罩层 */
          backdrop:bg-black/30
          backdrop:backdrop-blur-sm
          backdrop:animate-fade-in

          ${className || ""}
        `}
      >
        {children}
      </dialog>
    );
  }
);
