import { useEffect, useMemo, useState } from "react";
import {
  GetBehaviorDetailsResponse,
  BehaviorBindingParametersSet,
} from "@zmkfirmware/zmk-studio-ts-client/behaviors";
import { BehaviorBinding } from "@zmkfirmware/zmk-studio-ts-client/keymap";
import { BehaviorParametersPicker } from "./BehaviorParametersPicker";
import { validateValue } from "./parameters";
import { hid_usage_from_page_and_id } from "../hid-usages";

export interface BehaviorBindingPickerProps {
  binding: BehaviorBinding;
  behaviors: GetBehaviorDetailsResponse[];
  layers: { id: number; name: string }[];
  onBindingChanged: (binding: BehaviorBinding) => void;
}

function validateBinding(
  metadata: BehaviorBindingParametersSet[],
  layerIds: number[],
  param1?: number,
  param2?: number
): boolean {
  if ((param1 === undefined || param1 === 0) && metadata.every((s) => !s.param1 || s.param1.length === 0)) return true;
  let matchingSet = metadata.find((s) => validateValue(layerIds, param1, s.param1));
  if (!matchingSet) return false;
  return validateValue(layerIds, param2, matchingSet.param2);
}

interface QuickKey { label: string; page: number; id: number; w?: number; }

const ROW_ESC: QuickKey[] = [
  { label: "Esc", page: 7, id: 0x29 },
  { label: "F1", page: 7, id: 0x3a }, { label: "F2", page: 7, id: 0x3b },
  { label: "F3", page: 7, id: 0x3c }, { label: "F4", page: 7, id: 0x3d },
  { label: "F5", page: 7, id: 0x3e }, { label: "F6", page: 7, id: 0x3f },
  { label: "F7", page: 7, id: 0x40 }, { label: "F8", page: 7, id: 0x41 },
  { label: "F9", page: 7, id: 0x42 }, { label: "F10", page: 7, id: 0x43 },
  { label: "F11", page: 7, id: 0x44 }, { label: "F12", page: 7, id: 0x45 },
  { label: "PrtSc", page: 7, id: 0x46 }, { label: "ScrLk", page: 7, id: 0x47 },
  { label: "Pause", page: 7, id: 0x48 },
];
const ROW_NUM: QuickKey[] = [
  { label: "`", page: 7, id: 0x35 },
  { label: "1", page: 7, id: 0x1e }, { label: "2", page: 7, id: 0x1f },
  { label: "3", page: 7, id: 0x20 }, { label: "4", page: 7, id: 0x21 },
  { label: "5", page: 7, id: 0x22 }, { label: "6", page: 7, id: 0x23 },
  { label: "7", page: 7, id: 0x24 }, { label: "8", page: 7, id: 0x25 },
  { label: "9", page: 7, id: 0x26 }, { label: "0", page: 7, id: 0x27 },
  { label: "-", page: 7, id: 0x2d }, { label: "=", page: 7, id: 0x2e },
  { label: "Bksp", page: 7, id: 0x2a, w: 2 },
  { label: "Ins", page: 7, id: 0x49 }, { label: "Home", page: 7, id: 0x4a },
  { label: "PgUp", page: 7, id: 0x4b },
];
const ROW_TAB: QuickKey[] = [
  { label: "Tab", page: 7, id: 0x2b, w: 1.5 },
  { label: "Q", page: 7, id: 0x14 }, { label: "W", page: 7, id: 0x1a },
  { label: "E", page: 7, id: 0x08 }, { label: "R", page: 7, id: 0x15 },
  { label: "T", page: 7, id: 0x17 }, { label: "Y", page: 7, id: 0x1c },
  { label: "U", page: 7, id: 0x18 }, { label: "I", page: 7, id: 0x0c },
  { label: "O", page: 7, id: 0x12 }, { label: "P", page: 7, id: 0x13 },
  { label: "[", page: 7, id: 0x2f }, { label: "]", page: 7, id: 0x30 },
  { label: "\\", page: 7, id: 0x31, w: 1.5 },
  { label: "Del", page: 7, id: 0x4c }, { label: "End", page: 7, id: 0x4d },
  { label: "PgDn", page: 7, id: 0x4e },
];
const ROW_CAPS: QuickKey[] = [
  { label: "Caps", page: 7, id: 0x39, w: 1.75 },
  { label: "A", page: 7, id: 0x04 }, { label: "S", page: 7, id: 0x16 },
  { label: "D", page: 7, id: 0x07 }, { label: "F", page: 7, id: 0x09 },
  { label: "G", page: 7, id: 0x0a }, { label: "H", page: 7, id: 0x0b },
  { label: "J", page: 7, id: 0x0d }, { label: "K", page: 7, id: 0x0e },
  { label: "L", page: 7, id: 0x0f }, { label: ";", page: 7, id: 0x33 },
  { label: "'", page: 7, id: 0x34 },
  { label: "Enter", page: 7, id: 0x28, w: 2.25 },
];
const ROW_SHIFT: QuickKey[] = [
  { label: "LShift", page: 7, id: 0xe1, w: 2.25 },
  { label: "Z", page: 7, id: 0x1d }, { label: "X", page: 7, id: 0x1b },
  { label: "C", page: 7, id: 0x06 }, { label: "V", page: 7, id: 0x19 },
  { label: "B", page: 7, id: 0x05 }, { label: "N", page: 7, id: 0x11 },
  { label: "M", page: 7, id: 0x10 }, { label: ",", page: 7, id: 0x36 },
  { label: ".", page: 7, id: 0x37 }, { label: "/", page: 7, id: 0x38 },
  { label: "RShift", page: 7, id: 0xe5, w: 2.75 },
  { label: "Up", page: 7, id: 0x52 },
];
const ROW_CTRL: QuickKey[] = [
  { label: "LCtrl", page: 7, id: 0xe0, w: 1.25 },
  { label: "LGUI", page: 7, id: 0xe3, w: 1.25 },
  { label: "LAlt", page: 7, id: 0xe2, w: 1.25 },
  { label: "Space", page: 7, id: 0x2c, w: 6.25 },
  { label: "RAlt", page: 7, id: 0xe6, w: 1.25 },
  { label: "RGUI", page: 7, id: 0xe7, w: 1.25 },
  { label: "Menu", page: 7, id: 0x65, w: 1.25 },
  { label: "RCtrl", page: 7, id: 0xe4, w: 1.25 },
  { label: "Left", page: 7, id: 0x50 },
  { label: "Down", page: 7, id: 0x51 },
  { label: "Right", page: 7, id: 0x4f },
];
const KEYBOARD_ROWS = [ROW_ESC, ROW_NUM, ROW_TAB, ROW_CAPS, ROW_SHIFT, ROW_CTRL];

interface MediaKey { label: string; zh: string; page: number; id: number; }
const MEDIA_KEYS: MediaKey[] = [
  { label: "Vol+", zh: "音量+", page: 12, id: 0xe9 },
  { label: "Vol-", zh: "音量-", page: 12, id: 0xea },
  { label: "Mute", zh: "静音", page: 12, id: 0xe2 },
  { label: "Next", zh: "下一曲", page: 12, id: 0xb5 },
  { label: "Prev", zh: "上一曲", page: 12, id: 0xb6 },
  { label: "Play", zh: "播放/暂停", page: 12, id: 0xcd },
  { label: "Stop", zh: "停止", page: 12, id: 0xb7 },
  { label: "Bri+", zh: "亮度+", page: 12, id: 0x6f },
  { label: "Bri-", zh: "亮度-", page: 12, id: 0x70 },
  { label: "Calc", zh: "计算器", page: 12, id: 0x192 },
  { label: "Web", zh: "浏览器", page: 12, id: 0x196 },
  { label: "Mail", zh: "邮件", page: 12, id: 0x18a },
];

const SPECIAL_KEYS: QuickKey[] = [
  { label: "NumLk", page: 7, id: 0x53 }, { label: "KP /", page: 7, id: 0x54 },
  { label: "KP *", page: 7, id: 0x55 }, { label: "KP -", page: 7, id: 0x56 },
  { label: "KP +", page: 7, id: 0x57 }, { label: "KP Ent", page: 7, id: 0x58 },
  { label: "KP 1", page: 7, id: 0x59 }, { label: "KP 2", page: 7, id: 0x5a },
  { label: "KP 3", page: 7, id: 0x5b }, { label: "KP 4", page: 7, id: 0x5c },
  { label: "KP 5", page: 7, id: 0x5d }, { label: "KP 6", page: 7, id: 0x5e },
  { label: "KP 7", page: 7, id: 0x5f }, { label: "KP 8", page: 7, id: 0x60 },
  { label: "KP 9", page: 7, id: 0x61 }, { label: "KP 0", page: 7, id: 0x62 },
  { label: "KP .", page: 7, id: 0x63 },
];

// Lighting: static buttons that map to underglow behavior + specific param
interface LightButton { zh: string; en: string; paramValue: number; }
const RGB_BUTTONS: LightButton[] = [
  { zh: "RGB 开/关", en: "Toggle", paramValue: 0 },
  { zh: "RGB 开启", en: "On", paramValue: 1 },
  { zh: "RGB 关闭", en: "Off", paramValue: 2 },
  { zh: "色相 +", en: "Hue Up", paramValue: 3 },
  { zh: "色相 -", en: "Hue Down", paramValue: 4 },
  { zh: "饱和度 +", en: "Sat Up", paramValue: 5 },
  { zh: "饱和度 -", en: "Sat Down", paramValue: 6 },
  { zh: "亮度 +", en: "Bri Up", paramValue: 7 },
  { zh: "亮度 -", en: "Bri Down", paramValue: 8 },
  { zh: "速度 +", en: "Spd Up", paramValue: 9 },
  { zh: "速度 -", en: "Spd Down", paramValue: 10 },
  { zh: "下一灯效", en: "Next Eff", paramValue: 11 },
  { zh: "上一灯效", en: "Prev Eff", paramValue: 12 },
];

const LAYER_NAMES: Record<string, string> = {
  "Momentary Layer": "瞬时层 (MO)",
  "Layer Tap": "层/按键 (LT)",
  "To Layer": "切换到层 (TO)",
  "Toggle Layer": "切换层 (TG)",
  "Default Layer": "默认层 (DF)",
  "Conditional Layer": "条件层",
};

const OTHER_NAMES: Record<string, string> = {
  "Bluetooth": "蓝牙",
  "Output Selection": "输出切换",
  "None": "无",
  "Transparent": "透明",
  "Reset": "重启",
  "Bootloader": "引导模式",
  "Caps Word": "大写词",
  "Key Toggle": "按键锁定",
  "Sticky Key": "粘滞键",
  "Sticky Layer": "粘滞层",
  "Mod-Tap": "修饰/按键 (MT)",
  "Hold-Tap": "长按/点按 (HT)",
  "Tap Dance": "多次点击 (TD)",
  "Studio Unlock": "Studio 解锁",
  "Soft Off": "软关机",
  "Key Repeat": "按键重复",
  "Grave/Escape": "~/Esc",
  "External Power": "外部电源",
};

type CategoryId = "keyboard" | "media" | "special" | "other" | "lighting" | "macro" | "advanced";
const CATEGORIES: { id: CategoryId; label: string }[] = [
  { id: "keyboard", label: "按键" },
  { id: "media", label: "媒体" },
  { id: "special", label: "特色键" },
  { id: "other", label: "其他" },
  { id: "lighting", label: "灯光" },
  { id: "macro", label: "宏按键" },
  { id: "advanced", label: "高级" },
];

function matchName(name: string, map: Record<string, string>): string {
  if (map[name]) return map[name];
  for (const [en, zh] of Object.entries(map)) {
    if (name.toLowerCase().includes(en.toLowerCase())) return zh;
  }
  return name;
}

export const BehaviorBindingPicker = ({
  binding, layers, behaviors, onBindingChanged,
}: BehaviorBindingPickerProps) => {
  const [behaviorId, setBehaviorId] = useState(binding.behaviorId);
  const [param1, setParam1] = useState<number | undefined>(binding.param1);
  const [param2, setParam2] = useState<number | undefined>(binding.param2);
  const [activeCategory, setActiveCategory] = useState<CategoryId>("keyboard");

  const metadata = useMemo(() => behaviors.find((b) => b.id == behaviorId)?.metadata, [behaviorId, behaviors]);
  const sortedBehaviors = useMemo(() => [...behaviors].sort((a, b) => a.displayName.localeCompare(b.displayName)), [behaviors]);

  const keyPressBehavior = useMemo(() => behaviors.find((b) => b.displayName.toLowerCase().includes("key") && b.displayName.toLowerCase().includes("press")), [behaviors]);

  // Find the underglow/backlight behavior
  const underglowBehavior = useMemo(() => behaviors.find((b) => {
    const n = b.displayName.toLowerCase();
    return n.includes("underglow") || n.includes("rgb");
  }), [behaviors]);

  const backlightBehavior = useMemo(() => behaviors.find((b) => b.displayName.toLowerCase().includes("backlight")), [behaviors]);

  const extPowerBehavior = useMemo(() => behaviors.find((b) => {
    const n = b.displayName.toLowerCase();
    return n.includes("ext") && n.includes("power");
  }), [behaviors]);

  const layerBehaviors = useMemo(() => behaviors.filter((b) => {
    const n = b.displayName.toLowerCase();
    return n.includes("layer") || n.includes("momentary") || n.includes("conditional");
  }), [behaviors]);

  const otherBehaviors = useMemo(() => behaviors.filter((b) => {
    const n = b.displayName.toLowerCase();
    const skip = (n.includes("key") && n.includes("press")) || n.includes("rgb") || n.includes("underglow") || n.includes("backlight") || (n.includes("ext") && n.includes("power")) || n.includes("layer") || n.includes("momentary") || n.includes("conditional") || n.includes("macro");
    return !skip;
  }), [behaviors]);

  const macroBehaviors = useMemo(() => behaviors.filter((b) => b.displayName.toLowerCase().includes("macro")), [behaviors]);

  useEffect(() => {
    if (binding.behaviorId === behaviorId && binding.param1 === param1 && binding.param2 === param2) return;
    if (!metadata) return;
    if (validateBinding(metadata, layers.map(({ id }) => id), param1, param2)) {
      onBindingChanged({ behaviorId, param1: param1 || 0, param2: param2 || 0 });
    }
  }, [behaviorId, param1, param2]);

  useEffect(() => {
    setBehaviorId(binding.behaviorId);
    setParam1(binding.param1);
    setParam2(binding.param2);
  }, [binding]);

  const handleQuickKey = (page: number, id: number) => {
    if (!keyPressBehavior) return;
    setBehaviorId(keyPressBehavior.id);
    setParam1(hid_usage_from_page_and_id(page, id));
    setParam2(0);
  };

  const handleLightButton = (beh: GetBehaviorDetailsResponse | undefined, pv: number) => {
    if (!beh) return;
    setBehaviorId(beh.id);
    setParam1(pv);
    setParam2(0);
  };

  const handleSelectBehavior = (bid: number) => {
    setBehaviorId(bid);
    setParam1(0);
    setParam2(0);
  };

  const currentUsage = useMemo(() => {
    if (!keyPressBehavior || behaviorId !== keyPressBehavior.id) return -1;
    return param1 || 0;
  }, [behaviorId, param1, keyPressBehavior]);

  const btnClass = (active: boolean, extra?: string) =>
    `flex items-center justify-center rounded text-[11px] border transition-all duration-75 ${extra || ""} ${active ? "bg-primary text-primary-content border-primary font-bold" : "bg-base-100 hover:bg-base-200 text-base-content border-base-300 hover:border-primary/50 active:scale-95"}`;

  const cardBtn = (active: boolean) =>
    `flex flex-col items-center justify-center rounded-lg text-xs border min-h-[42px] px-2 py-1 transition-all duration-75 ${active ? "bg-primary text-primary-content border-primary font-bold shadow-sm" : "bg-base-100 hover:bg-base-200 text-base-content border-base-300 hover:border-primary/50 active:scale-95"}`;

  return (
    <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto">
      <div className="flex gap-1 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
            className={`px-3 py-1.5 text-xs rounded-lg transition-all border ${activeCategory === cat.id ? "bg-primary text-primary-content border-primary font-semibold shadow-sm" : "bg-base-100 hover:bg-base-200 text-base-content/70 border-base-300"}`}>
            {cat.label}
          </button>
        ))}
      </div>

      {/* 1. Keyboard */}
      {activeCategory === "keyboard" && (
        <div className="flex flex-col gap-0.5 overflow-x-auto pb-1">
          {KEYBOARD_ROWS.map((row, ri) => (
            <div key={ri} className="flex gap-px" style={{ minWidth: "580px" }}>
              {row.map((key) => {
                const usage = hid_usage_from_page_and_id(key.page, key.id);
                return (
                  <button key={`${key.page}-${key.id}`} onClick={() => handleQuickKey(key.page, key.id)}
                    style={key.w && key.w > 1 ? { flex: `${key.w} 0 0%` } : { flex: "1 0 0%" }}
                    className={btnClass(currentUsage === usage, "min-h-[28px] py-0.5 whitespace-nowrap")}>
                    {key.label}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* 2. Media */}
      {activeCategory === "media" && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(90px,1fr))] gap-1.5">
          {MEDIA_KEYS.map((key) => {
            const usage = hid_usage_from_page_and_id(key.page, key.id);
            return (
              <button key={usage} onClick={() => handleQuickKey(key.page, key.id)} className={cardBtn(currentUsage === usage)}>
                <span className="font-medium">{key.zh}</span>
                <span className={`text-[9px] mt-0.5 ${currentUsage === usage ? "opacity-60" : "opacity-30"}`}>{key.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* 3. Special */}
      {activeCategory === "special" && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(60px,1fr))] gap-1.5">
          {SPECIAL_KEYS.map((key) => {
            const usage = hid_usage_from_page_and_id(key.page, key.id);
            return (
              <button key={usage} onClick={() => handleQuickKey(key.page, key.id)} className={btnClass(currentUsage === usage, "min-h-[38px] rounded-lg")}>
                {key.label}
              </button>
            );
          })}
        </div>
      )}

      {/* 4. Other */}
      {activeCategory === "other" && (
        <div className="flex flex-col gap-3">
          {layerBehaviors.length > 0 && (
            <div>
              <p className="text-xs text-base-content/50 mb-1.5">{"层切换"}</p>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(110px,1fr))] gap-1.5">
                {layerBehaviors.map((b) => {
                  const zh = matchName(b.displayName, LAYER_NAMES);
                  return (
                    <button key={b.id} onClick={() => handleSelectBehavior(b.id)} className={cardBtn(behaviorId === b.id)}>
                      <span className="font-medium leading-tight">{zh}</span>
                      {zh !== b.displayName && <span className={`text-[9px] mt-0.5 ${behaviorId === b.id ? "opacity-60" : "opacity-30"}`}>{b.displayName}</span>}
                    </button>
                  );
                })}
              </div>
              {metadata && layerBehaviors.some((b) => b.id === behaviorId) && (
                <div className="mt-2"><BehaviorParametersPicker metadata={metadata} param1={param1} param2={param2} layers={layers} onParam1Changed={setParam1} onParam2Changed={setParam2} /></div>
              )}
            </div>
          )}
          <div>
            <p className="text-xs text-base-content/50 mb-1.5">{"其他功能"}</p>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(110px,1fr))] gap-1.5">
              {otherBehaviors.map((b) => {
                const zh = matchName(b.displayName, OTHER_NAMES);
                return (
                  <button key={b.id} onClick={() => handleSelectBehavior(b.id)} className={cardBtn(behaviorId === b.id)}>
                    <span className="font-medium leading-tight">{zh}</span>
                    {zh !== b.displayName && <span className={`text-[9px] mt-0.5 ${behaviorId === b.id ? "opacity-60" : "opacity-30"}`}>{b.displayName}</span>}
                  </button>
                );
              })}
            </div>
            {metadata && otherBehaviors.some((b) => b.id === behaviorId) && (
              <div className="mt-2"><BehaviorParametersPicker metadata={metadata} param1={param1} param2={param2} layers={layers} onParam1Changed={setParam1} onParam2Changed={setParam2} /></div>
            )}
          </div>
        </div>
      )}

      {/* 5. Lighting - FLAT buttons, no sub-menu */}
      {activeCategory === "lighting" && (
        <div className="flex flex-col gap-3">
          {underglowBehavior ? (
            <>
              <p className="text-xs text-base-content/50">{"RGB 灯光控制"}</p>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-1.5">
                {RGB_BUTTONS.map((btn) => {
                  const isActive = behaviorId === underglowBehavior.id && param1 === btn.paramValue;
                  return (
                    <button key={btn.paramValue} onClick={() => handleLightButton(underglowBehavior, btn.paramValue)} className={cardBtn(isActive)}>
                      <span className="font-medium">{btn.zh}</span>
                      <span className={`text-[9px] mt-0.5 ${isActive ? "opacity-60" : "opacity-30"}`}>{btn.en}</span>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-sm text-base-content/40 text-center py-4">{"固件中未启用 RGB 灯光功能"}</div>
          )}

          {backlightBehavior && (
            <>
              <p className="text-xs text-base-content/50 mt-1">{"背光控制"}</p>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-1.5">
                {[
                  { zh: "背光 开/关", en: "Toggle", pv: 0 },
                  { zh: "背光 开", en: "On", pv: 1 },
                  { zh: "背光 关", en: "Off", pv: 2 },
                  { zh: "背光 亮度+", en: "Bri Up", pv: 3 },
                  { zh: "背光 亮度-", en: "Bri Down", pv: 4 },
                  { zh: "背光 循环", en: "Cycle", pv: 5 },
                ].map((btn) => {
                  const isActive = behaviorId === backlightBehavior.id && param1 === btn.pv;
                  return (
                    <button key={btn.pv} onClick={() => handleLightButton(backlightBehavior, btn.pv)} className={cardBtn(isActive)}>
                      <span className="font-medium">{btn.zh}</span>
                      <span className={`text-[9px] mt-0.5 ${isActive ? "opacity-60" : "opacity-30"}`}>{btn.en}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {extPowerBehavior && (
            <>
              <p className="text-xs text-base-content/50 mt-1">{"外部电源"}</p>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-1.5">
                {[
                  { zh: "电源 开/关", en: "Toggle", pv: 0 },
                  { zh: "电源 开", en: "On", pv: 1 },
                  { zh: "电源 关", en: "Off", pv: 2 },
                ].map((btn) => {
                  const isActive = behaviorId === extPowerBehavior.id && param1 === btn.pv;
                  return (
                    <button key={btn.pv} onClick={() => handleLightButton(extPowerBehavior, btn.pv)} className={cardBtn(isActive)}>
                      <span className="font-medium">{btn.zh}</span>
                      <span className={`text-[9px] mt-0.5 ${isActive ? "opacity-60" : "opacity-30"}`}>{btn.en}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* 6. Macro */}
      {activeCategory === "macro" && (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-base-content/50">{"宏可以按顺序执行多个按键操作。需在固件 .keymap 中预先定义。"}</p>
          {macroBehaviors.length > 0 ? (
            <>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-1.5">
                {macroBehaviors.map((b) => (
                  <button key={b.id} onClick={() => handleSelectBehavior(b.id)} className={cardBtn(behaviorId === b.id)}>{b.displayName}</button>
                ))}
              </div>
              {metadata && macroBehaviors.some((b) => b.id === behaviorId) && (
                <BehaviorParametersPicker metadata={metadata} param1={param1} param2={param2} layers={layers} onParam1Changed={setParam1} onParam2Changed={setParam2} />
              )}
            </>
          ) : (
            <div className="bg-base-100 border border-base-300 rounded-lg p-4 text-center">
              <p className="text-sm text-base-content/70 mb-2">{"当前固件中没有定义宏"}</p>
              <p className="text-xs text-base-content/40 mb-3">{"在 .keymap 文件中添加宏定义后重新编译固件即可使用"}</p>
              <div className="bg-base-200 rounded-md p-3 text-left text-[11px] font-mono text-base-content/60 leading-relaxed">
                <div>{"/ {"}</div>
                <div className="pl-4">{"macros {"}</div>
                <div className="pl-8">{"copy_paste: copy_paste {"}</div>
                <div className="pl-12">{'compatible = "zmk,behavior-macro";'}</div>
                <div className="pl-12">{"#binding-cells = <0>;"}</div>
                <div className="pl-12">{"wait-ms = <30>; tap-ms = <40>;"}</div>
                <div className="pl-12">{"bindings = <&kp LC(C)>, <&kp LC(V)>;"}</div>
                <div className="pl-8">{"};"}</div>
                <div className="pl-4">{"};"}</div>
                <div>{"};"}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 7. Advanced */}
      {activeCategory === "advanced" && (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-base-content/50">{"高级模式支持所有 ZMK 行为，包括 Mod-Tap、Hold-Tap、宏等"}</p>
          <div>
            <label className="text-xs text-base-content/50 block mb-1">{"行为类型"}</label>
            <select value={behaviorId} className="h-9 rounded-lg w-full text-sm bg-base-100 border border-base-300 px-2"
              onChange={(e) => { setBehaviorId(parseInt(e.target.value)); setParam1(0); setParam2(0); }}>
              {sortedBehaviors.map((b) => (<option key={b.id} value={b.id}>{b.displayName}</option>))}
            </select>
          </div>
          {metadata && <BehaviorParametersPicker metadata={metadata} param1={param1} param2={param2} layers={layers} onParam1Changed={setParam1} onParam2Changed={setParam2} />}
        </div>
      )}
    </div>
  );
};
