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

const BEHAVIOR_ZH: Record<string, string> = {
  "Key Press": "按键", "Momentary Layer": "瞬时层", "Layer Tap": "层/按键",
  "To Layer": "切换层", "Toggle Layer": "切换层", "Default Layer": "默认层",
  "Conditional Layer": "条件层", "Bluetooth": "蓝牙", "Output Selection": "输出切换",
  "None": "无", "Transparent": "透明", "Reset": "重启", "Bootloader": "引导模式",
  "Caps Word": "大写词", "Key Toggle": "按键锁定", "Sticky Key": "粘滞键",
  "Sticky Layer": "粘滞层", "Mod-Tap": "修饰/按键", "Hold-Tap": "长按/点按",
  "Tap Dance": "多次点击", "Studio Unlock": "解锁", "Soft Off": "软关机",
  "Key Repeat": "按键重复", "Grave/Escape": "~/Esc", "External Power": "外部电源",
  "Underglow": "灯效", "Backlight": "背光", "Unknown": "未知",
};

function translateHeader(header: string | undefined): string {
  if (!header) return "";
  if (BEHAVIOR_ZH[header]) return BEHAVIOR_ZH[header];
  for (const [en, zh] of Object.entries(BEHAVIOR_ZH)) {
    if (header.toLowerCase().includes(en.toLowerCase())) return zh;
  }
  if (typeof shortNames[header]?.short !== "undefined") return shortNames[header].short!;
  for (const [key, value] of Object.entries(shortNames)) {
    if (header.toLowerCase().includes(key.toLowerCase()) && typeof value.short !== "undefined") return value.short!;
  }
  if (header.length > MAX_HEADER_LENGTH) {
    const words = header.split(/[\s,-]+/);
    const lp = Math.trunc(MAX_HEADER_LENGTH / words.length);
    return words.map((w) => w.substring(0, lp)).join("");
  }
  return header;
}

export const Key = ({ selected = false, width, height, oneU, header, onClick, children }: PropsWithChildren<KeyProps>) => {
  const pw = width * oneU - 2;
  const ph = height * oneU - 2;
  const zh = translateHeader(header);
  const isSmall = pw < 55;

  return (
    <button
      className={`
        group relative flex flex-col justify-center items-center cursor-pointer
        rounded-xl overflow-hidden text-center
        ${selected
          ? "bg-primary text-primary-content shadow-[0_2px_8px_rgba(0,122,255,0.3)] ring-1 ring-primary/30"
          : "glass-light text-base-content shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
        }
      `}
      style={{ width: `${pw}px`, height: `${ph}px`, fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
      onClick={onClick}
    >
      {selected && <div className="absolute inset-0 bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />}
      {/* Header: 行为类型 — 上方固定小字 */}
      {zh && (
        <div
          className={`absolute top-[2px] left-0 right-0 text-center truncate leading-tight px-0.5 font-medium ${
            selected ? "text-primary-content/50" : "text-base-content/20"
          }`}
          style={{ fontSize: isSmall ? "6px" : "8px" }}
        >
          {zh}
        </div>
      )}
      {/* Children: 具体内容 — 居中，小字淡色，不截断 */}
      <div
        className={`w-full px-0.5 text-center font-medium leading-tight overflow-hidden ${
          selected ? "text-primary-content" : "text-base-content/40"
        }`}
        style={{ fontSize: isSmall ? "8px" : "10px", wordBreak: "break-all", lineHeight: "1.2" }}
      >
        {children}
      </div>
    </button>
  );
};
