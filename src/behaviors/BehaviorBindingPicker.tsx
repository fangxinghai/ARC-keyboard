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
  if (
    (param1 === undefined || param1 === 0) &&
    metadata.every((s) => !s.param1 || s.param1.length === 0)
  ) {
    return true;
  }
  let matchingSet = metadata.find((s) =>
    validateValue(layerIds, param1, s.param1)
  );
  if (!matchingSet) return false;
  return validateValue(layerIds, param2, matchingSet.param2);
}

interface QuickKey {
  label: string;
  page: number;
  id: number;
  w?: number;
}

// ==================== 108-key layout ====================
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
  { label: "L Shift", page: 7, id: 0xe1, w: 2.25 },
  { label: "Z", page: 7, id: 0x1d }, { label: "X", page: 7, id: 0x1b },
  { label: "C", page: 7, id: 0x06 }, { label: "V", page: 7, id: 0x19 },
  { label: "B", page: 7, id: 0x05 }, { label: "N", page: 7, id: 0x11 },
  { label: "M", page: 7, id: 0x10 }, { label: ",", page: 7, id: 0x36 },
  { label: ".", page: 7, id: 0x37 }, { label: "/", page: 7, id: 0x38 },
  { label: "R Shift", page: 7, id: 0xe5, w: 2.75 },
  { label: "Up", page: 7, id: 0x52 },
];
const ROW_CTRL: QuickKey[] = [
  { label: "L Ctrl", page: 7, id: 0xe0, w: 1.25 },
  { label: "L GUI", page: 7, id: 0xe3, w: 1.25 },
  { label: "L Alt", page: 7, id: 0xe2, w: 1.25 },
  { label: "Space", page: 7, id: 0x2c, w: 6.25 },
  { label: "R Alt", page: 7, id: 0xe6, w: 1.25 },
  { label: "R GUI", page: 7, id: 0xe7, w: 1.25 },
  { label: "Menu", page: 7, id: 0x65, w: 1.25 },
  { label: "R Ctrl", page: 7, id: 0xe4, w: 1.25 },
  { label: "Left", page: 7, id: 0x50 },
  { label: "Down", page: 7, id: 0x51 },
  { label: "Right", page: 7, id: 0x4f },
];
const KEYBOARD_ROWS = [ROW_ESC, ROW_NUM, ROW_TAB, ROW_CAPS, ROW_SHIFT, ROW_CTRL];

// ==================== Media ====================
const MEDIA_KEYS: QuickKey[] = [
  { label: "Vol+", page: 12, id: 0xe9 }, { label: "Vol-", page: 12, id: 0xea },
  { label: "Mute", page: 12, id: 0xe2 }, { label: "Next", page: 12, id: 0xb5 },
  { label: "Prev", page: 12, id: 0xb6 }, { label: "Play/Pause", page: 12, id: 0xcd },
  { label: "Stop", page: 12, id: 0xb7 }, { label: "Bright+", page: 12, id: 0x6f },
  { label: "Bright-", page: 12, id: 0x70 }, { label: "Calc", page: 12, id: 0x192 },
  { label: "Browser", page: 12, id: 0x196 }, { label: "Mail", page: 12, id: 0x18a },
];

// ==================== Special (Numpad) ====================
const SPECIAL_KEYS: QuickKey[] = [
  { label: "NumLk", page: 7, id: 0x53 }, { label: "KP /", page: 7, id: 0x54 },
  { label: "KP *", page: 7, id: 0x55 }, { label: "KP -", page: 7, id: 0x56 },
  { label: "KP +", page: 7, id: 0x57 }, { label: "KP Enter", page: 7, id: 0x58 },
  { label: "KP 1", page: 7, id: 0x59 }, { label: "KP 2", page: 7, id: 0x5a },
  { label: "KP 3", page: 7, id: 0x5b }, { label: "KP 4", page: 7, id: 0x5c },
  { label: "KP 5", page: 7, id: 0x5d }, { label: "KP 6", page: 7, id: 0x5e },
  { label: "KP 7", page: 7, id: 0x5f }, { label: "KP 8", page: 7, id: 0x60 },
  { label: "KP 9", page: 7, id: 0x61 }, { label: "KP 0", page: 7, id: 0x62 },
  { label: "KP .", page: 7, id: 0x63 },
];

// ==================== Lighting display names (Chinese) ====================
const LIGHT_NAMES: Record<string, string> = {
  "RGB Underglow Toggle": "RGB \u5F00/\u5173",
  "RGB Underglow On": "RGB \u5F00",
  "RGB Underglow Off": "RGB \u5173",
  "RGB Underglow Hue Up": "RGB \u8272\u76F8+",
  "RGB Underglow Hue Down": "RGB \u8272\u76F8-",
  "RGB Underglow Saturation Up": "RGB \u997E\u548C\u5EA6+",
  "RGB Underglow Saturation Down": "RGB \u997E\u548C\u5EA6-",
  "RGB Underglow Brightness Up": "RGB \u4EAE\u5EA6+",
  "RGB Underglow Brightness Down": "RGB \u4EAE\u5EA6-",
  "RGB Underglow Speed Up": "RGB \u901F\u5EA6+",
  "RGB Underglow Speed Down": "RGB \u901F\u5EA6-",
  "RGB Underglow Effect": "RGB \u706F\u6548\u5207\u6362",
  "RGB Underglow Color": "RGB \u989C\u8272\u8BBE\u7F6E",
  "Backlight Toggle": "\u80CC\u5149 \u5F00/\u5173",
  "Backlight On": "\u80CC\u5149 \u5F00",
  "Backlight Off": "\u80CC\u5149 \u5173",
  "Backlight Brightness Up": "\u80CC\u5149 \u4EAE\u5EA6+",
  "Backlight Brightness Down": "\u80CC\u5149 \u4EAE\u5EA6-",
  "Backlight Cycle": "\u80CC\u5149 \u5FAA\u73AF",
};

// ==================== Layer display names (Chinese) ====================
const LAYER_NAMES: Record<string, string> = {
  "Momentary Layer": "\u77AC\u65F6\u5C42 (MO)",
  "Layer Tap": "\u5C42/\u6309\u952E (LT)",
  "To Layer": "\u5207\u6362\u5230\u5C42 (TO)",
  "Toggle Layer": "\u5207\u6362\u5C42 (TG)",
  "Default Layer": "\u9ED8\u8BA4\u5C42 (DF)",
  "Conditional Layer": "\u6761\u4EF6\u5C42",
};

// ==================== Other behavior names ====================
const OTHER_NAMES: Record<string, string> = {
  "Bluetooth": "\u84DD\u7259",
  "Output Selection": "\u8F93\u51FA\u5207\u6362 (USB/BT)",
  "None": "\u65E0",
  "Transparent": "\u900F\u660E",
  "Reset": "\u91CD\u542F",
  "Bootloader": "\u8FDB\u5165\u5F15\u5BFC",
  "Caps Word": "\u5927\u5199\u8BCD",
  "Key Toggle": "\u6309\u952E\u9501\u5B9A",
  "Sticky Key": "\u7C98\u6ED3\u952E",
  "Sticky Layer": "\u7C98\u6ED3\u5C42",
  "Mod-Tap": "\u4FEE\u9970/\u6309\u952E",
  "Hold-Tap": "\u957F\u6309/\u70B9\u6309",
  "Tap Dance": "\u591A\u6B21\u70B9\u51FB",
  "Studio Unlock": "Studio \u89E3\u9501",
  "External Power": "\u5916\u90E8\u7535\u6E90",
  "Soft Off": "\u8F6F\u5173\u673A",
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

function getBehaviorChinese(name: string, maps: Record<string, string>): string {
  for (const [en, zh] of Object.entries(maps)) {
    if (name.toLowerCase().includes(en.toLowerCase())) return zh;
  }
  return name;
}

export const BehaviorBindingPicker = ({
  binding,
  layers,
  behaviors,
  onBindingChanged,
}: BehaviorBindingPickerProps) => {
  const [behaviorId, setBehaviorId] = useState(binding.behaviorId);
  const [param1, setParam1] = useState<number | undefined>(binding.param1);
  const [param2, setParam2] = useState<number | undefined>(binding.param2);
  const [activeCategory, setActiveCategory] = useState<CategoryId>("keyboard");

  const metadata = useMemo(
    () => behaviors.find((b) => b.id == behaviorId)?.metadata,
    [behaviorId, behaviors]
  );
  const sortedBehaviors = useMemo(
    () => [...behaviors].sort((a, b) => a.displayName.localeCompare(b.displayName)),
    [behaviors]
  );
  const keyPressBehavior = useMemo(() => {
    return behaviors.find(
      (b) => b.displayName.toLowerCase().includes("key") && b.displayName.toLowerCase().includes("press")
    );
  }, [behaviors]);

  // Categorize behaviors
  const lightBehaviors = useMemo(() => behaviors.filter((b) => {
    const n = b.displayName.toLowerCase();
    return n.includes("rgb") || n.includes("underglow") || n.includes("backlight") || n.includes("ext_power") || n.includes("external power");
  }), [behaviors]);

  const layerBehaviors = useMemo(() => behaviors.filter((b) => {
    const n = b.displayName.toLowerCase();
    return n.includes("layer") || n.includes("momentary") || n.includes("to layer") || n.includes("toggle layer") || n.includes("default layer") || n.includes("conditional");
  }), [behaviors]);

  const otherBehaviors = useMemo(() => behaviors.filter((b) => {
    const n = b.displayName.toLowerCase();
    const isKey = n.includes("key") && n.includes("press");
    const isLight = n.includes("rgb") || n.includes("underglow") || n.includes("backlight") || n.includes("ext_power") || n.includes("external power");
    const isLayer = n.includes("layer") || n.includes("momentary") || n.includes("to layer") || n.includes("toggle layer") || n.includes("default layer") || n.includes("conditional");
    const isMacro = n.includes("macro");
    return !isKey && !isLight && !isLayer && !isMacro;
  }), [behaviors]);

  const macroBehaviors = useMemo(() => behaviors.filter((b) => {
    return b.displayName.toLowerCase().includes("macro");
  }), [behaviors]);

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

  const handleQuickKey = (key: QuickKey) => {
    if (!keyPressBehavior) return;
    const usage = hid_usage_from_page_and_id(key.page, key.id);
    setBehaviorId(keyPressBehavior.id);
    setParam1(usage);
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

  const renderKeyButton = (key: QuickKey) => {
    const usage = hid_usage_from_page_and_id(key.page, key.id);
    const isActive = currentUsage === usage;
    return (
      <button
        key={`${key.page}-${key.id}`}
        onClick={() => handleQuickKey(key)}
        style={key.w && key.w > 1 ? { flex: `${key.w} 0 0%` } : { flex: "1 0 0%" }}
        className={`flex items-center justify-center rounded-md text-[11px] border py-1 min-h-[32px] transition-all duration-100 ${
          isActive
            ? "bg-primary text-primary-content border-primary font-bold shadow-md"
            : "bg-base-100 hover:bg-base-200 text-base-content border-base-300 hover:border-primary/50 active:scale-95"
        }`}
      >
        <span className="leading-none font-medium whitespace-nowrap">{key.label}</span>
      </button>
    );
  };

  const renderBehaviorGrid = (list: GetBehaviorDetailsResponse[], nameMap: Record<string, string>, description: string) => (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-base-content/50">{description}</p>
      {list.length > 0 ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-1.5">
          {list.map((b) => {
            const isActive = behaviorId === b.id;
            const zhName = getBehaviorChinese(b.displayName, nameMap);
            return (
              <button
                key={b.id}
                onClick={() => handleSelectBehavior(b.id)}
                className={`flex flex-col items-center justify-center rounded-lg text-xs border min-h-[44px] px-2 py-1 transition-all duration-100 ${
                  isActive
                    ? "bg-primary text-primary-content border-primary font-bold shadow-md"
                    : "bg-base-100 hover:bg-base-200 text-base-content border-base-300 hover:border-primary/50 active:scale-95"
                }`}
              >
                <span className="font-medium">{zhName}</span>
                {zhName !== b.displayName && (
                  <span className={`text-[9px] mt-0.5 ${isActive ? "text-primary-content/60" : "text-base-content/30"}`}>{b.displayName}</span>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="text-sm text-base-content/40 text-center py-4">
          {"\u56FA\u4EF6\u4E2D\u672A\u627E\u5230\u76F8\u5173\u884C\u4E3A"}
        </div>
      )}
      {metadata && list.some((b) => b.id === behaviorId) && (
        <BehaviorParametersPicker
          metadata={metadata}
          param1={param1}
          param2={param2}
          layers={layers}
          onParam1Changed={setParam1}
          onParam2Changed={setParam2}
        />
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto">
      {/* Category tabs */}
      <div className="flex gap-1 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-3 py-1.5 text-xs rounded-lg transition-all border ${
              activeCategory === cat.id
                ? "bg-primary text-primary-content border-primary font-semibold shadow-sm"
                : "bg-base-100 hover:bg-base-200 text-base-content/70 border-base-300"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* 1. Keyboard */}
      {activeCategory === "keyboard" && (
        <div className="flex flex-col gap-1 overflow-x-auto pb-1">
          {KEYBOARD_ROWS.map((row, ri) => (
            <div key={ri} className="flex gap-0.5 min-w-[600px]">
              {row.map((key) => renderKeyButton(key))}
            </div>
          ))}
        </div>
      )}

      {/* 2. Media */}
      {activeCategory === "media" && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-1.5">
          {MEDIA_KEYS.map((key) => {
            const usage = hid_usage_from_page_and_id(key.page, key.id);
            const isActive = currentUsage === usage;
            return (
              <button key={usage} onClick={() => handleQuickKey(key)}
                className={`flex items-center justify-center rounded-lg text-xs border min-h-[44px] py-1 transition-all duration-100 ${
                  isActive ? "bg-primary text-primary-content border-primary font-bold shadow-md"
                    : "bg-base-100 hover:bg-base-200 text-base-content border-base-300 hover:border-primary/50 active:scale-95"
                }`}>
                <span className="font-medium">{key.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* 3. Special (Numpad) */}
      {activeCategory === "special" && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(64px,1fr))] gap-1.5">
          {SPECIAL_KEYS.map((key) => {
            const usage = hid_usage_from_page_and_id(key.page, key.id);
            const isActive = currentUsage === usage;
            return (
              <button key={usage} onClick={() => handleQuickKey(key)}
                className={`flex items-center justify-center rounded-lg text-xs border min-h-[40px] py-1 transition-all duration-100 ${
                  isActive ? "bg-primary text-primary-content border-primary font-bold shadow-md"
                    : "bg-base-100 hover:bg-base-200 text-base-content border-base-300 hover:border-primary/50 active:scale-95"
                }`}>
                <span className="font-medium">{key.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* 4. Other (Layer + BT + Misc) */}
      {activeCategory === "other" && (
        <div className="flex flex-col gap-3">
          {layerBehaviors.length > 0 && (
            <div>
              <p className="text-xs text-base-content/50 mb-1.5">{"\u5C42\u5207\u6362"}</p>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-1.5">
                {layerBehaviors.map((b) => {
                  const isActive = behaviorId === b.id;
                  const zhName = getBehaviorChinese(b.displayName, LAYER_NAMES);
                  return (
                    <button key={b.id} onClick={() => handleSelectBehavior(b.id)}
                      className={`flex flex-col items-center justify-center rounded-lg text-xs border min-h-[44px] px-2 py-1 transition-all duration-100 ${
                        isActive ? "bg-primary text-primary-content border-primary font-bold shadow-md"
                          : "bg-base-100 hover:bg-base-200 text-base-content border-base-300 hover:border-primary/50 active:scale-95"
                      }`}>
                      <span className="font-medium">{zhName}</span>
                      {zhName !== b.displayName && (
                        <span className={`text-[9px] mt-0.5 ${isActive ? "text-primary-content/60" : "text-base-content/30"}`}>{b.displayName}</span>
                      )}
                    </button>
                  );
                })}
              </div>
              {metadata && layerBehaviors.some((b) => b.id === behaviorId) && (
                <div className="mt-2">
                  <BehaviorParametersPicker metadata={metadata} param1={param1} param2={param2} layers={layers} onParam1Changed={setParam1} onParam2Changed={setParam2} />
                </div>
              )}
            </div>
          )}
          <div>
            <p className="text-xs text-base-content/50 mb-1.5">{"\u5176\u4ED6\u529F\u80FD"}</p>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-1.5">
              {otherBehaviors.map((b) => {
                const isActive = behaviorId === b.id;
                const zhName = getBehaviorChinese(b.displayName, OTHER_NAMES);
                return (
                  <button key={b.id} onClick={() => handleSelectBehavior(b.id)}
                    className={`flex flex-col items-center justify-center rounded-lg text-xs border min-h-[40px] px-2 py-1 transition-all duration-100 ${
                      isActive ? "bg-primary text-primary-content border-primary font-bold shadow-md"
                        : "bg-base-100 hover:bg-base-200 text-base-content border-base-300 hover:border-primary/50 active:scale-95"
                    }`}>
                    <span className="font-medium">{zhName}</span>
                    {zhName !== b.displayName && (
                      <span className={`text-[9px] mt-0.5 ${isActive ? "text-primary-content/60" : "text-base-content/30"}`}>{b.displayName}</span>
                    )}
                  </button>
                );
              })}
            </div>
            {metadata && otherBehaviors.some((b) => b.id === behaviorId) && (
              <div className="mt-2">
                <BehaviorParametersPicker metadata={metadata} param1={param1} param2={param2} layers={layers} onParam1Changed={setParam1} onParam2Changed={setParam2} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. Lighting */}
      {activeCategory === "lighting" && renderBehaviorGrid(
        lightBehaviors,
        LIGHT_NAMES,
        "RGB \u7075\u706F\u548C\u80CC\u5149\u63A7\u5236"
      )}

      {/* 6. Macro */}
      {activeCategory === "macro" && (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-base-content/50">
            {"\u5B8F\u6309\u952E\u53EF\u4EE5\u6309\u987A\u5E8F\u6267\u884C\u591A\u4E2A\u6309\u952E\u64CD\u4F5C\u3002\u5B8F\u9700\u8981\u5728\u56FA\u4EF6 .keymap \u6587\u4EF6\u4E2D\u9884\u5148\u5B9A\u4E49\u3002"}
          </p>
          {macroBehaviors.length > 0 ? (
            <>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-1.5">
                {macroBehaviors.map((b) => {
                  const isActive = behaviorId === b.id;
                  return (
                    <button key={b.id} onClick={() => handleSelectBehavior(b.id)}
                      className={`flex items-center justify-center rounded-lg text-xs border min-h-[44px] px-2 py-1 transition-all duration-100 ${
                        isActive ? "bg-primary text-primary-content border-primary font-bold shadow-md"
                          : "bg-base-100 hover:bg-base-200 text-base-content border-base-300 hover:border-primary/50 active:scale-95"
                      }`}>
                      {b.displayName}
                    </button>
                  );
                })}
              </div>
              {metadata && macroBehaviors.some((b) => b.id === behaviorId) && (
                <BehaviorParametersPicker metadata={metadata} param1={param1} param2={param2} layers={layers} onParam1Changed={setParam1} onParam2Changed={setParam2} />
              )}
            </>
          ) : (
            <div className="bg-base-100 border border-base-300 rounded-lg p-4 text-center">
              <p className="text-sm text-base-content/70 mb-2">{"\u5F53\u524D\u56FA\u4EF6\u4E2D\u6CA1\u6709\u5B9A\u4E49\u5B8F"}</p>
              <p className="text-xs text-base-content/40">{"\u8981\u4F7F\u7528\u5B8F\u529F\u80FD\uFF0C\u9700\u8981\u5728 .keymap \u6587\u4EF6\u4E2D\u5B9A\u4E49\u5B8F\u884C\u4E3A\uFF0C\u7136\u540E\u91CD\u65B0\u7F16\u8BD1\u56FA\u4EF6"}</p>
              <div className="mt-3 bg-base-200 rounded-md p-3 text-left text-[11px] font-mono text-base-content/60 leading-relaxed">
                <div>{"/ {"}</div>
                <div className="pl-4">{"macros {"}</div>
                <div className="pl-8">{"my_macro: my_macro {"}</div>
                <div className="pl-12">{'compatible = "zmk,behavior-macro";'}</div>
                <div className="pl-12">{"#binding-cells = <0>;"}</div>
                <div className="pl-12">{"wait-ms = <30>;"}</div>
                <div className="pl-12">{"tap-ms = <40>;"}</div>
                <div className="pl-12">{"bindings = <&kp C &kp V>;"}</div>
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
          <p className="text-xs text-base-content/50">
            {"\u9AD8\u7EA7\u6A21\u5F0F\u652F\u6301\u6240\u6709 ZMK \u884C\u4E3A\uFF0C\u5305\u62EC\u5FEB\u6377\u952E\u7EC4\u5408\u3001Mod-Tap\u3001Hold-Tap\u3001\u5B8F\u7B49"}
          </p>
          <div>
            <label className="text-xs text-base-content/50 block mb-1">{"\u884C\u4E3A\u7C7B\u578B"}</label>
            <select value={behaviorId} className="h-9 rounded-lg w-full text-sm bg-base-100 border border-base-300 px-2"
              onChange={(e) => { setBehaviorId(parseInt(e.target.value)); setParam1(0); setParam2(0); }}>
              {sortedBehaviors.map((b) => (<option key={b.id} value={b.id}>{b.displayName}</option>))}
            </select>
          </div>
          {metadata && (
            <BehaviorParametersPicker metadata={metadata} param1={param1} param2={param2} layers={layers} onParam1Changed={setParam1} onParam2Changed={setParam2} />
          )}
        </div>
      )}
    </div>
  );
};
