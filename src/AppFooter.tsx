import { ExternalLink } from "./misc/ExternalLink";

export interface AppFooterProps {
  onShowAbout?: () => void;
  onShowLicenseNotice?: () => void;
}

export const AppFooter = ({
  onShowAbout,
  onShowLicenseNotice,
}: AppFooterProps) => {
  return (
    <footer className="glass-light flex items-center justify-between px-5 py-2 text-xs text-base-content/30 rounded-t-2xl">
      <span>
        ARC 改键器 · 基于{" "}
        <span className="hover:text-base-content/60 transition-colors duration-200 underline underline-offset-2">
          <ExternalLink href="https://zmk.dev">ZMK</ExternalLink>
        </span>{" "}
        固件
      </span>
      <div className="flex gap-4">
        <button
          className="hover:text-base-content/60 transition-all duration-200 active:scale-95"
          onClick={onShowAbout}
        >
          关于
        </button>
        <div className="w-px h-3 bg-base-content/10 self-center" />
        <button
          className="hover:text-base-content/60 transition-all duration-200 active:scale-95"
          onClick={onShowLicenseNotice}
        >
          许可证
        </button>
      </div>
    </footer>
  );
};
