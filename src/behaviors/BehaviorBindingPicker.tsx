import { useEffect, useMemo, useState, useCallback, useRef, useLayoutEffect } from "react";
import {
  GetBehaviorDetailsResponse,
  BehaviorBindingParametersSet,
} from "@zmkfirmware/zmk-studio-ts-client/behaviors";
import { BehaviorBinding } from "@zmkfirmware/zmk-studio-ts-client/keymap";
import { BehaviorParametersPicker } from "./BehaviorParametersPicker";
import { validateValue } from "./parameters";
import { hid_usage_from_page_and_id } from "../hid-usages";
import { Bluetooth } from "lucide-react";

export interface BehaviorBindingPickerProps {
  binding: BehaviorBinding;
  behaviors: GetBehaviorDetailsResponse[];
  layers: { id: number; name: string }[];
  onBindingChanged: (binding: BehaviorBinding) => void;
}

function validateBinding(
  metadata: BehaviorBindingParametersSet[], layerIds: number[], param1?: number, param2?: number
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
  { label: "Vol+", zh: "音量+", page: 12, id: 0xe9 }, { label: "Vol-", zh: "音量-", page: 12, id: 0xea },
  { label: "Mute", zh: "静音", page: 12, id: 0xe2 }, { label: "Next", zh: "下一曲", page: 12, id: 0xb5 },
  { label: "Prev", zh: "上一曲", page: 12, id: 0xb6 }, { label: "Play", zh: "播放/暂停", page: 12, id: 0xcd },
  { label: "Stop", zh: "停止", page: 12, id: 0xb7 }, { label: "Bri+", zh: "亮度+", page: 12, id: 0x6f },
  { label: "Bri-", zh: "亮度-", page: 12, id: 0x70 }, { label: "Calc", zh: "计算器", page: 12, id: 0x192 },
  { label: "Web", zh: "浏览器", page: 12, id: 0x196 }, { label: "Mail", zh: "邮件", page: 12, id: 0x18a },
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

interface LightButton { zh: string; en: string; paramValue: number; }
const RGB_BUTTONS: LightButton[] = [
  { zh: "RGB 开/关", en: "Toggle", paramValue: 0 }, { zh: "RGB 开启", en: "On", paramValue: 1 },
  { zh: "RGB 关闭", en: "Off", paramValue: 2 }, { zh: "色相 +", en: "Hue Up", paramValue: 3 },
  { zh: "色相 -", en: "Hue Down", paramValue: 4 }, { zh: "饱和度 +", en: "Sat Up", paramValue: 5 },
  { zh: "饱和度 -", en: "Sat Down", paramValue: 6 }, { zh: "亮度 +", en: "Bri Up", paramValue: 7 },
  { zh: "亮度 -", en: "Bri Down", paramValue: 8 }, { zh: "速度 +", en: "Spd Up", paramValue: 9 },
  { zh: "速度 -", en: "Spd Down", paramValue: 10 }, { zh: "下一灯效", en: "Next Eff", paramValue: 11 },
  { zh: "上一灯效", en: "Prev Eff", paramValue: 12 },
];

const LAYER_NAMES: Record<string, string> = {
  "Momentary Layer": "瞬时层 (MO)", "Layer Tap": "层/按键 (LT)",
  "To Layer": "切换到层 (TO)", "Toggle Layer": "切换层 (TG)",
  "Default Layer": "默认层 (DF)", "Conditional Layer": "条件层",
};
const OTHER_NAMES: Record<string, string> = {
  "Bluetooth": "蓝牙", "Output Selection": "输出切换", "None": "无", "Transparent": "透明",
  "Reset": "重启", "Bootloader": "引导模式", "Caps Word": "大写词", "Key Toggle": "按键锁定",
  "Sticky Key": "粘滞键", "Sticky Layer": "粘滞层", "Mod-Tap": "修饰/按键 (MT)",
  "Hold-Tap": "长按/点按 (HT)", "Tap Dance": "多次点击 (TD)", "Studio Unlock": "Studio 解锁",
  "Soft Off": "软关机", "Key Repeat": "按键重复", "Grave/Escape": "~/Esc", "External Power": "外部电源",
};

type CategoryId = "keyboard" | "media" | "special" | "bluetooth" | "other" | "lighting" | "macro" | "advanced";
const CATEGORIES: { id: CategoryId; label: string; icon?: boolean }[] = [
  { id: "keyboard", label: "按键" }, { id: "media", label: "媒体" },
  { id: "special", label: "特色键" }, { id: "bluetooth", label: "蓝牙", icon: true },
  { id: "other", label: "其他" }, { id: "lighting", label: "灯光" },
  { id: "macro", label: "宏按键" }, { id: "advanced", label: "高级" },
];

function matchName(name: string, map: Record<string, string>): string {
  if (map[name]) return map[name];
  for (const [en, zh] of Object.entries(map)) { if (name.toLowerCase().includes(en.toLowerCase())) return zh; }
  return name;
}

const MODIFIER_HID_IDS: Record<number, number> = { 0xe0:0x01, 0xe1:0x02, 0xe2:0x04, 0xe3:0x08, 0xe4:0x10, 0xe5:0x20, 0xe6:0x40, 0xe7:0x80 };
function isModifierKey(key: QuickKey): boolean { return key.page === 7 && key.id >= 0xe0 && key.id <= 0xe7; }
function getModFlag(h: number): number { return MODIFIER_HID_IDS[h] || 0; }
function extractModFlags(p: number): number { return (p >> 24) & 0xff; }
function extractBaseUsage(p: number): number { return p & 0x00ffffff; }
function buildParam1(m: number, b: number): number { return ((m & 0xff) << 24) | (b & 0x00ffffff); }
function modFlagsToLabels(f: number): string[] {
  const l: string[] = [];
  if(f&0x01)l.push("LCtrl");if(f&0x02)l.push("LShift");if(f&0x04)l.push("LAlt");if(f&0x08)l.push("LGUI");
  if(f&0x10)l.push("RCtrl");if(f&0x20)l.push("RShift");if(f&0x40)l.push("RAlt");if(f&0x80)l.push("RGUI");
  return l;
}
function findKeyLabel(h: number): string | undefined {
  for (const row of KEYBOARD_ROWS) { const f = row.find((k) => k.page === 7 && k.id === h); if (f) return f.label; }
  return undefined;
}

export const BehaviorBindingPicker = ({
  binding, layers, behaviors, onBindingChanged,
}: BehaviorBindingPickerProps) => {
  const [behaviorId, setBehaviorId] = useState(binding.behaviorId);
  const [param1, setParam1] = useState<number | undefined>(binding.param1);
  const [param2, setParam2] = useState<number | undefined>(binding.param2);
  const [activeCategory, setActiveCategory] = useState<CategoryId>("keyboard");

  const tabsRef = useRef<HTMLDivElement>(null);
  const [capsuleStyle, setCapsuleStyle] = useState({ left: 0, width: 0 });
  const updateCapsule = useCallback(() => {
    const c = tabsRef.current; if (!c) return;
    const el = c.querySelector(`[data-tab="${activeCategory}"]`) as HTMLElement;
    if (!el) return;
    setCapsuleStyle({ left: el.offsetLeft, width: el.offsetWidth });
  }, [activeCategory]);
  useLayoutEffect(updateCapsule, [updateCapsule]);
  useEffect(() => { window.addEventListener("resize", updateCapsule); return () => window.removeEventListener("resize", updateCapsule); }, [updateCapsule]);

  const metadata = useMemo(() => behaviors.find((b) => b.id == behaviorId)?.metadata, [behaviorId, behaviors]);
  const sortedBehaviors = useMemo(() => [...behaviors].sort((a, b) => a.displayName.localeCompare(b.displayName)), [behaviors]);
  const keyPressBehavior = useMemo(() => behaviors.find((b) => b.displayName.toLowerCase().includes("key") && b.displayName.toLowerCase().includes("press")), [behaviors]);
  const underglowBehavior = useMemo(() => behaviors.find((b) => { const n = b.displayName.toLowerCase(); return n.includes("underglow") || n.includes("rgb"); }), [behaviors]);
  const backlightBehavior = useMemo(() => behaviors.find((b) => b.displayName.toLowerCase().includes("backlight")), [behaviors]);
  const extPowerBehavior = useMemo(() => behaviors.find((b) => { const n = b.displayName.toLowerCase(); return n.includes("ext") && n.includes("power"); }), [behaviors]);
  const btBehavior = useMemo(() => behaviors.find((b) => { const n = b.displayName.toLowerCase(); return n.includes("bluetooth") || n === "bt"; }), [behaviors]);
  const layerBehaviors = useMemo(() => behaviors.filter((b) => { const n = b.displayName.toLowerCase(); return n.includes("layer") || n.includes("momentary") || n.includes("conditional"); }), [behaviors]);
  const otherBehaviors = useMemo(() => behaviors.filter((b) => { const n = b.displayName.toLowerCase(); const skip = (n.includes("key") && n.includes("press")) || n.includes("rgb") || n.includes("underglow") || n.includes("backlight") || (n.includes("ext") && n.includes("power")) || n.includes("layer") || n.includes("momentary") || n.includes("conditional") || n.includes("macro") || n.includes("bluetooth") || n === "bt"; return !skip; }), [behaviors]);
  const macroBehaviors = useMemo(() => behaviors.filter((b) => b.displayName.toLowerCase().includes("macro")), [behaviors]);

  const btMetadata = useMemo(() => btBehavior ? behaviors.find((b) => b.id === btBehavior.id)?.metadata : undefined, [btBehavior, behaviors]);

  useEffect(() => {
    if (binding.behaviorId === behaviorId && binding.param1 === param1 && binding.param2 === param2) return;
    if (!metadata) return;
    if (validateBinding(metadata, layers.map(({ id }) => id), param1, param2))
      onBindingChanged({ behaviorId, param1: param1 || 0, param2: param2 || 0 });
  }, [behaviorId, param1, param2]);

  useEffect(() => { setBehaviorId(binding.behaviorId); setParam1(binding.param1); setParam2(binding.param2); }, [binding]);

  const currentModFlags = useMemo(() => (!keyPressBehavior || behaviorId !== keyPressBehavior.id) ? 0 : extractModFlags(param1 || 0), [behaviorId, param1, keyPressBehavior]);
  const currentBaseUsage = useMemo(() => (!keyPressBehavior || behaviorId !== keyPressBehavior.id) ? 0 : extractBaseUsage(param1 || 0), [behaviorId, param1, keyPressBehavior]);
  const currentBaseHidId = useMemo(() => currentBaseUsage & 0xffff, [currentBaseUsage]);

  const handleQuickKey = useCallback((page: number, id: number) => {
    if (!keyPressBehavior) return;
    if (page === 7 && isModifierKey({ label: "", page, id })) {
      const nf = currentModFlags ^ getModFlag(id);
      setBehaviorId(keyPressBehavior.id); setParam1(buildParam1(nf, currentBaseUsage)); setParam2(0);
    } else {
      const bu = hid_usage_from_page_and_id(page, id);
      const pm = (behaviorId === keyPressBehavior.id) ? currentModFlags : 0;
      setBehaviorId(keyPressBehavior.id); setParam1(buildParam1(pm, bu)); setParam2(0);
    }
  }, [keyPressBehavior, behaviorId, currentModFlags, currentBaseUsage]);

  const handleDirectBind = (beh: GetBehaviorDetailsResponse | undefined, pv: number) => {
    if (!beh) return; setBehaviorId(beh.id); setParam1(pv); setParam2(0);
  };
  const handleSelectBehavior = (bid: number) => { setBehaviorId(bid); setParam1(0); setParam2(0); };

  const isKeyActive = useCallback((page: number, id: number): boolean => {
    if (!keyPressBehavior || behaviorId !== keyPressBehavior.id) return false;
    if (page === 7 && id >= 0xe0 && id <= 0xe7) return !!(currentModFlags & getModFlag(id));
    return currentBaseUsage === hid_usage_from_page_and_id(page, id);
  }, [behaviorId, keyPressBehavior, currentModFlags, currentBaseUsage]);

  const comboDescription = useMemo(() => {
    if (!keyPressBehavior || behaviorId !== keyPressBehavior.id) return null;
    const mods = modFlagsToLabels(currentModFlags);
    const bl = currentBaseHidId ? findKeyLabel(currentBaseHidId) : null;
    if (mods.length === 0 && !bl) return null;
    return [...mods, ...(bl ? [bl] : [])].join(" + ");
  }, [behaviorId, keyPressBehavior, currentModFlags, currentBaseHidId]);

  const keyBtn = (active: boolean, isMod: boolean, extra = "") => {
    if (active && isMod) return `flex items-center justify-center rounded-[10px] text-[11px] font-semibold text-white bg-accent shadow-[0_2px_8px_rgba(255,149,0,0.3)] ring-1 ring-accent/30 ${extra}`;
    if (active) return `flex items-center justify-center rounded-[10px] text-[11px] font-semibold text-white bg-primary shadow-[0_2px_8px_rgba(0,122,255,0.3)] ${extra}`;
    if (isMod) return `flex items-center justify-center rounded-[10px] text-[11px] font-medium glass-light text-base-content/60 hover:text-base-content/90 bg-accent/5 ${extra}`;
    return `flex items-center justify-center rounded-[10px] text-[11px] font-medium glass-light text-base-content/60 hover:text-base-content/90 ${extra}`;
  };

  const cardBtn = (active: boolean) =>
    `flex flex-col items-center justify-center rounded-xl text-xs min-h-[46px] px-3 py-1.5 cursor-pointer ${
      active ? "bg-primary text-white font-semibold shadow-[0_2px_8px_rgba(0,122,255,0.3)]"
             : "glass-light text-base-content/60 hover:text-base-content/90"
    }`;

  return (
    <div className="flex flex-col gap-3">
      {/* ═══ Tab 栏 — 独立一行居中 ═══ */}
      <div className="flex flex-col items-center gap-2">
        <div ref={tabsRef} className="relative flex gap-0.5 p-1 rounded-2xl glass">
          <div className="absolute top-1 bottom-1 rounded-xl bg-primary tab-capsule pointer-events-none" style={{ left: capsuleStyle.left, width: capsuleStyle.width }} />
          {CATEGORIES.map((cat) => (
            <button key={cat.id} data-tab={cat.id} onClick={() => setActiveCategory(cat.id)}
              className={`relative z-10 flex items-center gap-1 px-3 py-1.5 text-xs rounded-xl ${
                activeCategory === cat.id ? "text-white font-semibold" : "text-base-content/45 hover:text-base-content/70"
              }`}>
              {cat.icon && <Bluetooth className="w-3 h-3" />}
              {cat.label}
            </button>
          ))}
        </div>
        {/* 组合键预览 — Tab 下方独立行，不影响 Tab 宽度 */}
        {comboDescription && activeCategory === "keyboard" && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-xl glass text-[11px]">
            <span className="text-base-content/30">当前：</span>
            <span className="font-semibold text-primary">{comboDescription}</span>
            {currentModFlags !== 0 && (
              <button onClick={() => { if (keyPressBehavior) setParam1(buildParam1(0, currentBaseUsage)); }}
                className="text-base-content/20 hover:text-error ml-0.5 cursor-pointer">✕</button>
            )}
          </div>
        )}
      </div>

      {/* ═══ 面板内容 ═══ */}
      <div>

        {activeCategory === "keyboard" && (
          <div className="panel-fade-enter flex justify-center">
            <div className="w-full max-w-[750px]" style={{ aspectRatio: "17/6" }}>
              <div className="w-full h-full flex flex-col gap-[2px] justify-between">
                {KEYBOARD_ROWS.map((row, ri) => (
                  <div key={ri} className="flex gap-[2px] flex-1">
                    {row.map((key) => {
                      const isMod = isModifierKey(key);
                      const active = isKeyActive(key.page, key.id);
                      return (
                        <button key={`${key.page}-${key.id}`} onClick={() => handleQuickKey(key.page, key.id)}
                          style={key.w && key.w > 1 ? { flex: `${key.w} 0 0%` } : { flex: "1 0 0%" }}
                          className={keyBtn(active, isMod, "whitespace-nowrap")}>
                          {key.label}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeCategory === "media" && (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(95px,1fr))] gap-2 panel-fade-enter">
            {MEDIA_KEYS.map((key) => {
              const usage = hid_usage_from_page_and_id(key.page, key.id);
              const active = keyPressBehavior && behaviorId === keyPressBehavior.id && extractBaseUsage(param1 || 0) === usage;
              return (
                <button key={usage} onClick={() => { if (!keyPressBehavior) return; setBehaviorId(keyPressBehavior.id); setParam1(hid_usage_from_page_and_id(key.page, key.id)); setParam2(0); }} className={cardBtn(!!active)}>
                  <span className="font-medium">{key.zh}</span>
                  <span className={`text-[9px] mt-0.5 ${active ? "opacity-70" : "opacity-30"}`}>{key.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {activeCategory === "special" && (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(64px,1fr))] gap-2 panel-fade-enter">
            {SPECIAL_KEYS.map((key) => {
              const usage = hid_usage_from_page_and_id(key.page, key.id);
              const active = keyPressBehavior && behaviorId === keyPressBehavior.id && extractBaseUsage(param1 || 0) === usage;
              return (<button key={usage} onClick={() => handleQuickKey(key.page, key.id)} className={cardBtn(!!active)}>{key.label}</button>);
            })}
          </div>
        )}

        {activeCategory === "bluetooth" && (
          <div className="flex flex-col gap-3 panel-fade-enter items-center">
            {btBehavior ? (
              <>
                <p className="text-xs text-base-content/40 font-medium flex items-center gap-1.5">
                  <Bluetooth className="w-3.5 h-3.5" /> 选择蓝牙操作绑定到当前按键
                </p>
                {behaviorId !== btBehavior.id && (
                  <div className="flex justify-center">
                    <button onClick={() => { setBehaviorId(btBehavior.id); setParam1(0); setParam2(0); }}
                      className="btn-apple px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium">
                      <Bluetooth className="w-4 h-4 mr-1.5" /> 设为蓝牙功能
                    </button>
                  </div>
                )}
                {behaviorId === btBehavior.id && btMetadata && (
                  <BehaviorParametersPicker
                    metadata={btMetadata}
                    param1={param1}
                    param2={param2}
                    layers={layers}
                    onParam1Changed={setParam1}
                    onParam2Changed={setParam2}
                  />
                )}
              </>
            ) : (
              <div className="glass rounded-2xl p-5 text-center text-sm text-base-content/40">固件中未启用蓝牙功能</div>
            )}
          </div>
        )}

        {activeCategory === "other" && (
          <div className="flex flex-col gap-4 panel-fade-enter">
            {layerBehaviors.length > 0 && (
              <div>
                <p className="text-xs text-base-content/40 mb-2 font-medium">层切换</p>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(115px,1fr))] gap-2">
                  {layerBehaviors.map((b) => { const zh = matchName(b.displayName, LAYER_NAMES); return (
                    <button key={b.id} onClick={() => handleSelectBehavior(b.id)} className={cardBtn(behaviorId === b.id)}>
                      <span className="font-medium leading-tight">{zh}</span>
                      {zh !== b.displayName && <span className={`text-[9px] mt-0.5 ${behaviorId === b.id ? "opacity-70" : "opacity-30"}`}>{b.displayName}</span>}
                    </button>); })}
                </div>
                {metadata && layerBehaviors.some((b) => b.id === behaviorId) && (
                  <div className="mt-3"><BehaviorParametersPicker metadata={metadata} param1={param1} param2={param2} layers={layers} onParam1Changed={setParam1} onParam2Changed={setParam2} /></div>
                )}
              </div>
            )}
            <div>
              <p className="text-xs text-base-content/40 mb-2 font-medium">其他功能</p>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(115px,1fr))] gap-2">
                {otherBehaviors.map((b) => { const zh = matchName(b.displayName, OTHER_NAMES); return (
                  <button key={b.id} onClick={() => handleSelectBehavior(b.id)} className={cardBtn(behaviorId === b.id)}>
                    <span className="font-medium leading-tight">{zh}</span>
                    {zh !== b.displayName && <span className={`text-[9px] mt-0.5 ${behaviorId === b.id ? "opacity-70" : "opacity-30"}`}>{b.displayName}</span>}
                  </button>); })}
              </div>
              {metadata && otherBehaviors.some((b) => b.id === behaviorId) && (
                <div className="mt-3"><BehaviorParametersPicker metadata={metadata} param1={param1} param2={param2} layers={layers} onParam1Changed={setParam1} onParam2Changed={setParam2} /></div>
              )}
            </div>
          </div>
        )}

               {activeCategory === "lighting" && (
          <div className="flex flex-col gap-4 panel-fade-enter">
            {underglowBehavior ? (
              <>
                <p className="text-xs text-base-content/40 font-medium">RGB 灯效控制</p>
                {behaviorId !== underglowBehavior.id && (
                  <div className="flex justify-center">
                    <button onClick={() => { setBehaviorId(underglowBehavior.id); setParam1(0); setParam2(0); }}
                      className="btn-apple px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium">
                      设为 RGB 灯效
                    </button>
                  </div>
                )}
                {behaviorId === underglowBehavior.id && underglowBehavior.metadata && (
                  <BehaviorParametersPicker
                    metadata={underglowBehavior.metadata}
                    param1={param1}
                    param2={param2}
                    layers={layers}
                    onParam1Changed={setParam1}
                    onParam2Changed={setParam2}
                  />
                )}
              </>
            ) : (<div className="glass rounded-2xl p-5 text-center text-sm text-base-content/40">固件中未启用 RGB</div>)}

            {backlightBehavior && (
              <>
                <p className="text-xs text-base-content/40 mt-1 font-medium">背光控制</p>
                {behaviorId !== backlightBehavior.id && (
                  <div className="flex justify-center">
                    <button onClick={() => { setBehaviorId(backlightBehavior.id); setParam1(0); setParam2(0); }}
                      className="btn-apple px-4 py-2 rounded-xl bg-base-content/10 text-base-content/70 text-sm font-medium">
                      设为背光控制
                    </button>
                  </div>
                )}
                {behaviorId === backlightBehavior.id && backlightBehavior.metadata && (
                  <BehaviorParametersPicker
                    metadata={backlightBehavior.metadata}
                    param1={param1}
                    param2={param2}
                    layers={layers}
                    onParam1Changed={setParam1}
                    onParam2Changed={setParam2}
                  />
                )}
              </>
            )}

            {extPowerBehavior && (
              <>
                <p className="text-xs text-base-content/40 mt-1 font-medium">外部电源</p>
                {behaviorId !== extPowerBehavior.id && (
                  <div className="flex justify-center">
                    <button onClick={() => { setBehaviorId(extPowerBehavior.id); setParam1(0); setParam2(0); }}
                      className="btn-apple px-4 py-2 rounded-xl bg-base-content/10 text-base-content/70 text-sm font-medium">
                      设为外部电源
                    </button>
                  </div>
                )}
                {behaviorId === extPowerBehavior.id && extPowerBehavior.metadata && (
                  <BehaviorParametersPicker
                    metadata={extPowerBehavior.metadata}
                    param1={param1}
                    param2={param2}
                    layers={layers}
                    onParam1Changed={setParam1}
                    onParam2Changed={setParam2}
                  />
                )}
              </>
            )}
          </div>
        )}


        {activeCategory === "macro" && (
          <div className="flex flex-col gap-3 panel-fade-enter">
            <p className="text-xs text-base-content/40 font-medium text-center">宏可以按顺序执行多个按键操作。需在固件 .keymap 中预先定义。</p>
            {macroBehaviors.length > 0 ? (
              <>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2">
                  {macroBehaviors.map((b) => (<button key={b.id} onClick={() => handleSelectBehavior(b.id)} className={cardBtn(behaviorId === b.id)}>{b.displayName}</button>))}
                </div>
                {metadata && macroBehaviors.some((b) => b.id === behaviorId) && (
                  <BehaviorParametersPicker metadata={metadata} param1={param1} param2={param2} layers={layers} onParam1Changed={setParam1} onParam2Changed={setParam2} />
                )}
              </>
            ) : (
              <div className="glass rounded-2xl p-5 text-center">
                <p className="text-sm text-base-content/50 mb-2">当前固件中没有定义宏</p>
                <p className="text-xs text-base-content/30">在 .keymap 文件中添加宏定义后重新编译固件即可使用</p>
              </div>
            )}
          </div>
        )}

        {activeCategory === "advanced" && (
          <div className="flex flex-col gap-4 panel-fade-enter">
            <p className="text-xs text-base-content/40 font-medium text-center">高级模式支持所有 ZMK 行为</p>
            <div>
              <label className="text-xs text-base-content/40 block mb-1.5 font-medium">行为类型</label>
              <select value={behaviorId}
                className="h-10 rounded-xl w-full text-sm glass border-0 px-3 outline-none focus:ring-2 focus:ring-primary/30 appearance-none font-medium text-base-content/70"
                onChange={(e) => { setBehaviorId(parseInt(e.target.value)); setParam1(0); setParam2(0); }}>
                {sortedBehaviors.map((b) => (<option key={b.id} value={b.id}>{b.displayName}</option>))}
              </select>
            </div>
            {metadata && <BehaviorParametersPicker metadata={metadata} param1={param1} param2={param2} layers={layers} onParam1Changed={setParam1} onParam2Changed={setParam2} />}
            <div className="h-px bg-base-content/5 mt-2" />
            <div className="flex gap-4 text-xs text-base-content/30 justify-center">
              <span>ARC 改键器 · 基于 ZMK 固件</span>
              <span className="cursor-pointer hover:text-base-content/60"
                onClick={() => window.open("https://github.com/fangxinghai/ARC-keyboard", "_blank")}>关于</span>
              <span className="cursor-pointer hover:text-base-content/60"
                onClick={() => window.open("https://github.com/nicell/zmk-studio/blob/main/LICENSE", "_blank")}>许可证</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
