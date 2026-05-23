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

interface BehaviorShortName { short?: string; }
const MAX_HEADER_LENGTH = 9;
const shortNames: Record<string, BehaviorShortName> = BehaviorShortNames;

const shortenHeader = (header: string | undefined) => {
  if (typeof header === "undefined") return "";
  if (typeof shortNames[header]?.short !== "undefined") return shortNames[header].short;
  for (const [key, value] of Object.entries(shortNames)) {
    if (header.toLowerCase().includes(key.toLowerCase()) && typeof value.short !== "undefined") return value.short;
  }
  if (header.length > MAX_HEADER_LENGTH) {
    const words = header.split(/[\s,-]+/);
    const lp = Math.trunc(MAX_HEADER_LENGTH / words.length);
    return words.map((w) => w.substring(0, lp)).join("");
  }
  return header;
};

export const Key = ({ selected = false, width, height, oneU, header, onClick, children }: PropsWithChildren<KeyProps>) => {
  const pw = width * oneU - 2;
  const ph = height * oneU - 2;
  const sh = shortenHeader(header);

  return (
    <button
      className={`
        group relative flex flex-col justify-center items-center cursor-pointer
        rounded-xl overflow-hidden font-keycap
        transition-all duration-150 ease-out
        ${selected
          ? "bg-primary text-primary-content shadow-[0_2px_8px_rgba(0,122,255,0.3)] ring-1 ring-primary/30"
          : "glass-light text-base-content shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:translate-y-[-1px]"
        }
      `}
      style={{ width: `${pw}px`, height: `${ph}px` }}
      onClick={onClick}
    >
      {selected && <div className="absolute inset-0 bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />}
      {sh && (
        <div className={`absolute text-[8px] ${selected ? "text-primary-content/60" : "text-base-content/30"} top-[2px] left-1 right-1 font-medium text-center truncate leading-tight`}>
          {sh}
        </div>
      )}
      <div className={`truncate max-w-full px-0.5 text-center font-medium text-[12px] ${selected ? "text-primary-content" : "text-base-content/70"}`}>
        {children}
      </div>
    </button>
  );
};
