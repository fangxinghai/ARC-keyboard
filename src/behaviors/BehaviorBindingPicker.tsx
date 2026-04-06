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

// 108 keyboard rows
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

const MEDIA_KEYS: { label: string; zh: string; page: number; id: number }[] = [
  { label: "Vol+", zh: "\u97F3\u91CF+", page: 12, id: 0xe9 },
  { label: "Vol-", zh: "\u97F3\u91CF-", page: 12, id: 0xea },
  { label: "Mute", zh: "\u9759\u97F3", page: 12, id: 0xe2 },
  { label: "Next", zh: "\u4E0B\u4E00\u66F2", page: 12, id: 0xb5 },
  { label: "Prev", zh: "\u4E0A\u4E00\u66F2", page: 12, id: 0xb6 },
  { label: "Play", zh: "\u64AD\u653E/\u6682\u505C", page: 12, id: 0xcd },
  { label: "Stop", zh: "\u505C\u6B62", page: 12, id: 0xb7 },
  { label: "Bri+", zh: "\u4EAE\u5EA6+", page: 12, id: 0x6f },
  { label: "Bri-", zh: "\u4EAE\u5EA6-", page: 12, id: 0x70 },
  { label: "Calc", zh: "\u8BA1\u7B97\u5668", page: 12, id: 0x192 },
  { label: "Web", zh: "\u6D4F\u89C8\u5668", page: 12, id: 0x196 },
  { label: "Mail", zh: "\u90AE\u4EF6", page: 12, id: 0x18a },
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

// Complete lighting names map
const LIGHT_NAMES: Record<string, string> = {
  "Toggle On/Off": "RGB \u5F00/\u5173",
  "Turn On": "RGB \u5F00\u542F",
  "Turn OFF": "RGB \u5173\u95ED",
  "Hue Up": "\u8272\u76F8 +",
  "Hue Down": "\u8272\u76F8 -",
  "Saturation Up": "\u997E\u548C\u5EA6 +",
  "Saturation Down": "\u997E\u548C\u5EA6 -",
  "Brightness Up": "\u4EAE\u5EA6 +",
  "Brightness Down": "\u4EAE\u5EA6 -",
  "Speed Up": "\u901F\u5EA6 +",
  "Speed Down": "\u901F\u5EA6 -",
  "Next Effect": "\u4E0B\u4E00\u706F\u6548",
  "Previous Effect": "\u4E0A\u4E00\u706F\u6548",
  "Color": "\u989C\u8272\u8BBE\u7F6E",
  "RGB Underglow": "RGB \u7075\u706F",
  "Underglow": "RGB \u7075\u706F",
  "Backlight Toggle": "\u80CC\u5149 \u5F00/\u5173",
  "Backlight On": "\u80CC\u5149 \u5F00",
  "Backlight Off": "\u80CC\u5149 \u5173",
  "Backlight Brightness Up": "\u80CC\u5149 \u4EAE\u5EA6+",
  "Backlight Brightness Down": "\u80CC\u5149 \u4EAE\u5EA6-",
  "Backlight Cycle": "\u80CC\u5149 \u5FAA\u73AF",
  "Backlight": "\u80CC\u5149",
  "External Power": "\u5916\u90E8\u7535\u6E90",
};

const LAYER_NAMES: Record<string, string> = {
  "Momentary Layer": "\u77AC\u65F6\u5C42 (MO)",
  "Layer Tap": "\u5C42/\u6309\u952E (LT)",
  "To Layer": "\u5207\u6362\u5230\u5C42 (TO)",
  "Toggle Layer": "\u5207\u6362\u5C42 (TG)",
  "Default Layer": "\u9ED8\u8BA4\u5C42 (DF)",
  "Conditional Layer": "\u6761\u4EF6\u5C42",
};

const OTHER_NAMES: Record<string, string> = {
  "Bluetooth": "\u84DD\u7259",
  "Output Selection": "\u8F93\u51FA\u5207\u6362",
  "None": "\u65E0",
  "Transparent": "\u900F\u660E",
  "Reset": "\u91CD\u542F",
  "Bootloader": "\u5F15\u5BFC\u6A21\u5F0F",
  "Caps Word": "\u5927\u5199\u8BCD",
  "Key Toggle": "\u6309\u952E\u9501\u5B9A",
  "Sticky Key": "\u7C98\u6ED3\u952E",
  "Sticky Layer": "\u7C98\u6ED3\u5C42",
  "Mod-Tap": "\u4FEE\u9970/\u6309\u952E (MT)",
  "Hold-Tap": "\u957F\u6309/\u70B9\u6309 (HT)",
  "Tap Dance": "\u591A\u6B21\u70B9\u51FB (TD)",
  "Studio Unlock": "Studio \u89E3\u9501",
  "Soft Off": "\u8F6F\u5173\u673A",
  "Key Repeat": "\u6309\u952E\u91CD\u590D",
  "Grave/Escape": "~/Esc",
};

type CategoryId = "keyboard" | "media" | "special" | "other" | "lighting" | "macro" | "advanced";

const CATEGORIES: { id: CategoryId; label: string }[] = [
  { id: "keyboard", label: "\u6309\u952E" },
  { id: "media", label: "\u5A92\u4F53" },
  { id: "special", label: "\u7279\u8272\u952E" },
  { id: "other", label: "\u5176\u4ED6" },
  { id: "lighting", label: "\u706F\u5149" },
  { id: "macro", label: "\u5B8F\u6309\u952E" },
  { id: "advanced", label: "\u9AD8\u7EA7" },
];

function matchBehavior(name: string, map: Record<string, string>): string {
  // Exact match first
  if (map[name]) return map[name];
  // Partial match
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

  const keyPressBehavior = useMemo(() => {
    return behaviors.find((b) => b.displayName.toLowerCase().includes("key") && b.displayName.toLowerCase().includes("press"));
  }, [behaviors]);

  const lightBehaviors = useMemo(() => behaviors.filter((b) => {
    const n = b.displayName.toLowerCase();
    return n.includes("rgb") || n.includes("underglow") || n.includes("backlight") || n.includes("ext_power") || n.includes("external power");
  }), [behaviors]);

  const layerBehaviors = useMemo(() => behaviors.filter((b) => {
    const n = b.displayName.toLowerCase();
    return n.includes("layer") || n.includes("momentary") || n.includes("conditional");
  }), [behaviors]);

  const otherBehaviors = useMemo(() => behaviors.filter((b) => {
    const n = b.displayName.toLowerCase();
    const skip = (n.includes("key") && n.includes("press")) || n.includes("rgb") || n.includes("underglow") || n.includes("backlight") || n.includes("ext_power") || n.includes("external power") || n.includes("layer") || n.includes("momentary") || n.includes("conditional") || n.includes("macro");
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

  const handleSelectBehavior = (bid: number) => {
    setBehaviorId(bid);
    setParam1(0);
    setParam2(0);
  };

  const currentUsage = useMemo(() => {
    if (!keyPressBehavior || behaviorId !== keyPressBehavior.id) return -1;
    return param1 || 0;
  }, [behaviorId, param1, keyPressBehavior]);

  // Shared button style
  const keyBtnClass = (isActive: boolean, extra?: string) =>
    `flex items-center justify-center rounded text-[11px] border transition-all duration-75 ${extra || ""} ${
      isActive
        ? "bg-primary text-primary-content border-primary font-bold"
        : "bg-base-100 hover:bg-base-200 text-base-content border-base-300 hover:border-primary/50 active:scale-95"
    }`;

  const behaviorBtnClass = (isActive: boolean) =>
    `flex flex-col items-center justify-center rounded-lg text-xs border min-h-[42px] px-2 py-1 transition-all duration-75 ${
      isActive
        ? "bg-primary text-primary-content border-primary font-bold shadow-sm"
        : "bg-base-100 hover:bg-base-200 text-base-content border-base-300 hover:border-primary/50 active:scale-95"
    }`;

  const renderBehaviorBtn = (b: GetBehaviorDetailsResponse, nameMap: Record<string, string>) => {
    const isActive = behaviorId === b.id;
    const zh = matchBehavior(b.displayName, nameMap);
    return (
      <button key={b.id} onClick={() => handleSelectBehavior(b.id)} className={behaviorBtnClass(isActive)}>
        <span className="font-medium leading-tight">{zh}</span>
        {zh !== b.displayName && <span className={`text-[9px] mt-0.5 leading-none ${isActive ? "opacity-60" : "opacity-30"}`}>{b.displayName}</span>}
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto">
      <div className="flex gap-1 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
            className={`px-3 py-1.5 text-xs rounded-lg transition-all border ${
              activeCategory === cat.id
                ? "bg-primary text-primary-content border-primary font-semibold shadow-sm"
                : "bg-base-100 hover:bg-base-200 text-base-content/70 border-base-300"
            }`}>
            {cat.label}
          </button>
        ))}
      </div>

      {/* 1. Keyboard 108 layout */}
      {activeCategory === "keyboard" && (
        <div className="flex flex-col gap-0.5 overflow-x-auto pb-1">
          {KEYBOARD_ROWS.map((row, ri) => (
            <div key={ri} className="flex gap-px" style={{ minWidth: "580px" }}>
              {row.map((key) => {
                const usage = hid_usage_from_page_and_id(key.page, key.id);
                const isActive = currentUsage === usage;
                return (
                  <button key={`${key.page}-${key.id}`} onClick={() => handleQuickKey(key.page, key.id)}
                    style={key.w && key.w > 1 ? { flex: `${key.w} 0 0%` } : { flex: "1 0 0%" }}
                    className={keyBtnClass(isActive, "min-h-[28px] py-0.5 whitespace-nowrap")}>
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
            const isActive = currentUsage === usage;
            return (
              <button key={usage} onClick={() => handleQuickKey(key.page, key.id)}
                className={behaviorBtnClass(isActive)}>
                <span className="font-medium">{key.zh}</span>
                <span className={`text-[9px] mt-0.5 ${isActive ? "opacity-60" : "opacity-30"}`}>{key.label}</span>
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
            const isActive = currentUsage === usage;
            return (
              <button key={usage} onClick={() => handleQuickKey(key.page, key.id)}
                className={keyBtnClass(isActive, "min-h-[38px] rounded-lg")}>
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
              <p className="text-xs text-base-content/50 mb-1.5">{"\u5C42\u5207\u6362"}</p>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(110px,1fr))] gap-1.5">
                {layerBehaviors.map((b) => renderBehaviorBtn(b, LAYER_NAMES))}
              </div>
              {metadata && layerBehaviors.some((b) => b.id === behaviorId) && (
                <div className="mt-2"><BehaviorParametersPicker metadata={metadata} param1={param1} param2={param2} layers={layers} onParam1Changed={setParam1} onParam2Changed={setParam2} /></div>
              )}
            </div>
          )}
          <div>
            <p className="text-xs text-base-content/50 mb-1.5">{"\u5176\u4ED6\u529F\u80FD"}</p>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(110px,1fr))] gap-1.5">
              {otherBehaviors.map((b) => renderBehaviorBtn(b, OTHER_NAMES))}
            </div>
            {metadata && otherBehaviors.some((b) => b.id === behaviorId) && (
              <div className="mt-2"><BehaviorParametersPicker metadata={metadata} param1={param1} param2={param2} layers={layers} onParam1Changed={setParam1} onParam2Changed={setParam2} /></div>
            )}
          </div>
        </div>
      )}

      {/* 5. Lighting */}
      {activeCategory === "lighting" && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-base-content/50">RGB \u7075\u706F\u548C\u80CC\u5149\u63A7\u5236</p>
          {lightBehaviors.length > 0 ? (
            <>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(110px,1fr))] gap-1.5">
                {lightBehaviors.map((b) => renderBehaviorBtn(b, LIGHT_NAMES))}
              </div>
              {metadata && lightBehaviors.some((b) => b.id === behaviorId) && (
                <div>
                  <p className="text-xs text-base-content/50 mb-1 mt-1">{"\u706F\u6548\u53C2\u6570"}</p>
                  <BehaviorParametersPicker metadata={metadata} param1={param1} param2={param2} layers={layers} onParam1Changed={setParam1} onParam2Changed={setParam2} />
                </div>
              )}
            </>
          ) : (
            <div className="text-sm text-base-content/40 text-center py-4">{"\u56FA\u4EF6\u4E2D\u672A\u542F\u7528\u706F\u5149\u529F\u80FD"}</div>
          )}
        </div>
      )}

      {/* 6. Macro */}
      {activeCategory === "macro" && (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-base-content/50">{"\u5B8F\u53EF\u4EE5\u6309\u987A\u5E8F\u6267\u884C\u591A\u4E2A\u6309\u952E\u64CD\u4F5C\u3002\u9700\u5728\u56FA\u4EF6 .keymap \u4E2D\u9884\u5148\u5B9A\u4E49\u3002"}</p>
          {macroBehaviors.length > 0 ? (
            <>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-1.5">
                {macroBehaviors.map((b) => {
                  const isActive = behaviorId === b.id;
                  return <button key={b.id} onClick={() => handleSelectBehavior(b.id)} className={behaviorBtnClass(isActive)}>{b.displayName}</button>;
                })}
              </div>
              {metadata && macroBehaviors.some((b) => b.id === behaviorId) && (
                <BehaviorParametersPicker metadata={metadata} param1={param1} param2={param2} layers={layers} onParam1Changed={setParam1} onParam2Changed={setParam2} />
              )}
            </>
          ) : (
            <div className="bg-base-100 border border-base-300 rounded-lg p-4 text-center">
              <p className="text-sm text-base-content/70 mb-2">{"\u5F53\u524D\u56FA\u4EF6\u4E2D\u6CA1\u6709\u5B9A\u4E49\u5B8F"}</p>
              <p className="text-xs text-base-content/40 mb-3">{"\u5728 .keymap \u6587\u4EF6\u4E2D\u6DFB\u52A0\u5B8F\u5B9A\u4E49\u540E\u91CD\u65B0\u7F16\u8BD1\u56FA\u4EF6\u5373\u53EF\u4F7F\u7528"}</p>
              <div className="bg-base-200 rounded-md p-3 text-left text-[11px] font-mono text-base-content/60 leading-relaxed">
                <div>{"/ {"}</div>
                <div className="pl-4">{"macros {"}</div>
                <div className="pl-8">{"copy_paste: copy_paste {"}</div>
                <div className="pl-12">{'compatible = "zmk,behavior-macro";'}</div>
                <div className="pl-12">{"#binding-cells = <0>;"}</div>
                <div className="pl-12">{"wait-ms = <30>;"}</div>
                <div className="pl-12">{"tap-ms = <40>;"}</div>
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
          <p className="text-xs text-base-content/50">{"\u9AD8\u7EA7\u6A21\u5F0F\u652F\u6301\u6240\u6709 ZMK \u884C\u4E3A\uFF0C\u5305\u62EC Mod-Tap\u3001Hold-Tap\u3001\u5B8F\u7B49"}</p>
          <div>
            <label className="text-xs text-base-content/50 block mb-1">{"\u884C\u4E3A\u7C7B\u578B"}</label>
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
