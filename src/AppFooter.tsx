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
    <footer className="flex items-center justify-between px-4 py-1.5 text-xs opacity-50 border-t border-base-300">
      <span>
        ARC 改键器 · 基于{" "}
        <ExternalLink href="https://zmk.dev">ZMK</ExternalLink> 固件
      </span>
      <div className="flex gap-3">
        <button
          className="hover:opacity-100 opacity-60 transition-opacity"
          onClick={onShowAbout}
        >
          关于
        </button>
        <button
          className="hover:opacity-100 opacity-60 transition-opacity"
          onClick={onShowLicenseNotice}
        >
          许可证
        </button>
      </div>
    </footer>
  );
};
