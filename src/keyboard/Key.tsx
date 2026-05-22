import { PropsWithChildren } from "react";
import BehaviorShortNames from "./behavior-short-names.json";

interface KeyProps {
  selected?: boolean;
  width: number;
  height: number;
  oneU: number;
  header?: string;
  onClick?: () => void;
}

interface BehaviorShortName {
  short?: string;
}

const MAX_HEADER_LENGTH = 9;

const shortNames: Record<string, BehaviorShortName> = BehaviorShortNames;

const shortenHeader = (header: string | undefined) => {
  if (typeof header === "undefined") {
    return "";
  }

  if (typeof shortNames[header]?.short !== "undefined") {
    return shortNames[header].short;
  }

  for (const [key, value] of Object.entries(shortNames)) {
    if (header.toLowerCase().includes(key.toLowerCase()) && typeof value.short !== "undefined") {
      return value.short;
    }
  }

  if (header.length > MAX_HEADER_LENGTH) {
    const words = header.split(/[\s,-]+/);
    const lettersPerWord = Math.trunc(MAX_HEADER_LENGTH / words.length);
    return words.map((word) => word.substring(0, lettersPerWord)).join("");
  }

  return header;
};

export const Key = ({
  selected = false,
  width,
  height,
  oneU,
  header,
  onClick,
  children,
}: PropsWithChildren<KeyProps>) => {
  const pixelWidth = width * oneU - 2;
  const pixelHeight = height * oneU - 2;
  const shortHeader = shortenHeader(header);

  const headerLen = shortHeader?.length || 0;
  const headerFontClass = headerLen > 7 ? "text-[8px]" : headerLen > 5 ? "text-[9px]" : "text-xs";

  return (
    <button
      className={`
        group relative flex flex-col justify-center items-center cursor-pointer
        rounded-xl overflow-hidden font-keycap
        key-press-feedback
        ${
          selected
            ? "bg-primary text-primary-content shadow-key-active ring-1 ring-primary/30"
            : "glass-light text-base-content shadow-key hover:shadow-key-hover"
        }
      `}
      style={{
        width: `${pixelWidth}px`,
        height: `${pixelHeight}px`,
      }}
      onClick={onClick}
    >
      {/* 选中时的光晕效果 */}
      {selected && (
        <div className="absolute inset-0 bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />
      )}

      {/* Header 标签 */}
      <div
        className={`absolute ${headerFontClass} ${
          selected ? "text-primary-content/70" : "text-base-content/40"
        } top-0.5 left-0.5 right-0.5 font-medium text-center truncate leading-tight`}
      >
        {shortHeader}
      </div>

      {/* 按键内容 */}
      <div
        className={`truncate max-w-full px-0.5 text-center font-medium ${
          selected ? "text-primary-content" : "text-base-content/80"
        }`}
        style={{ fontSize: pixelWidth < 50 ? "11px" : "13px" }}
      >
        {children}
      </div>

      {/* 底部光泽线 */}
      <div
        className={`absolute bottom-0 left-[10%] right-[10%] h-px ${
          selected ? "bg-white/20" : "bg-base-content/5"
        }`}
      />
    </button>
  );
};
