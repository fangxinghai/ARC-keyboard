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

  // Try partial match for headers containing known names
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

  // Calculate font size based on key size and text length
  const headerLen = shortHeader?.length || 0;
  const headerFontClass = headerLen > 7 ? "text-[8px]" : headerLen > 5 ? "text-[9px]" : "text-xs";

  return (
    <button
      className={`group rounded relative flex justify-center items-center cursor-pointer transition-all hover:shadow-xl hover:ring-1 hover:ring-gray-300 hover:scale-110 overflow-hidden ${
        selected
          ? "bg-primary text-primary-content"
          : "bg-base-100 text-base-content"
      }`}
      style={{
        width: `${pixelWidth}px`,
        height: `${pixelHeight}px`,
      }}
      onClick={onClick}
    >
      <div
        className={`absolute ${headerFontClass} ${
          selected ? "text-primary-content" : "text-base-content"
        } opacity-70 top-0.5 left-0.5 right-0.5 font-light text-center truncate leading-tight`}
      >
        {shortHeader}
      </div>
      <div className="truncate max-w-full px-0.5 text-center" style={{ fontSize: pixelWidth < 50 ? '11px' : '14px' }}>
        {children}
      </div>
    </button>
  );
};
