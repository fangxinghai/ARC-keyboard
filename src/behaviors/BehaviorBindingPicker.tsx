import { useEffect, useMemo, useState } from "react";
import {
  GetBehaviorDetailsResponse,
  BehaviorBindingParametersSet,
} from "@zmkfirmware/zmk-studio-ts-client/behaviors";
import { BehaviorBinding } from "@zmkfirmware/zmk-studio-ts-client/keymap";
import { BehaviorParametersPicker } from "./BehaviorParametersPicker";
import { validateValue } from "./parameters";
import {
  hid_usage_from_page_and_id,
  hid_usage_page_and_id_from_usage,
} from "../hid-usages";

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
  if (!matchingSet) {
    return false;
  }
  return validateValue(layerIds, param2, matchingSet.param2);
}

interface QuickKey {
  label: string;
  sub?: string;
  page: number;
  id: number;
}

const ALPHA_KEYS: QuickKey[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  .split("")
  .map((c, i) => ({ label: c, page: 7, id: 4 + i }));

const NUMBER_KEYS: QuickKey[] = [
  { label: "1", page: 7, id: 0x1e }, { label: "2", page: 7, id: 0x1f },
  { label: "3", page: 7, id: 0x20 }, { label: "4", page: 7, id: 0x21 },
  { label: "5", page: 7, id: 0x22 }, { label: "6", page: 7, id: 0x23 },
  { label: "7", page: 7, id: 0x24 }, { label: "8", page: 7, id: 0x25 },
  { label: "9", page: 7, id: 0x26 }, { label: "0", page: 7, id: 0x27 },
];

const F_KEYS: QuickKey[] = Array.from({ length: 12 }, (_, i) => ({
  label: `F${i + 1}`, page: 7, id: 0x3a + i,
}));

const SPECIAL_KEYS: QuickKey[] = [
  { label: "Esc", page: 7, id: 0x29 },
  { label: "Tab", page: 7, id: 0x2b },
  { label: "Space", page: 7, id: 0x2c },
  { label: "Enter", page: 7, id: 0x28 },
  { label: "Bksp", page: 7, id: 0x2a },
  { label: "Del", page: 7, id: 0x4c },
  { label: "Ins", page: 7, id: 0x49 },
  { label: "Home", page: 7, id: 0x4a },
  { label: "End", page: 7, id: 0x4d },
  { label: "PgUp", page: 7, id: 0x4b },
  { label: "PgDn", page: 7, id: 0x4e },
  { label: "Up", page: 7, id: 0x52 },
  { label: "Down", page: 7, id: 0x51 },
  { label: "Left", page: 7, id: 0x50 },
  { label: "Right", page: 7, id: 0x4f },
  { label: "PrtSc", page: 7, id: 0x46 },
  { label: "Caps", page: 7, id: 0x39 },
  { label: "NumLk", page: 7, id: 0x53 },
];

const MOD_KEYS: QuickKey[] = [
  { label: "L Ctrl", page: 7, id: 0xe0 },
  { label: "L Shift", page: 7, id: 0xe1 },
  { label: "L Alt", page: 7, id: 0xe2 },
  { label: "L GUI", sub: "Win/Cmd", page: 7, id: 0xe3 },
  { label: "R Ctrl", page: 7, id: 0xe4 },
  { label: "R Shift", page: 7, id: 0xe5 },
  { label: "R Alt", page: 7, id: 0xe6 },
  { label: "R GUI", sub: "Win/Cmd", page: 7, id: 0xe7 },
];

const SYMBOL_KEYS: QuickKey[] = [
  { label: "-", page: 7, id: 0x2d }, { label: "=", page: 7, id: 0x2e },
  { label: "[", page: 7, id: 0x2f }, { label: "]", page: 7, id: 0x30 },
  { label: "\\", page: 7, id: 0x31 }, { label: ";", page: 7, id: 0x33 },
  { label: "'", page: 7, id: 0x34 }, { label: "`", page: 7, id: 0x35 },
  { label: ",", page: 7, id: 0x36 }, { label: ".", page: 7, id: 0x37 },
  { label: "/", page: 7, id: 0x38 },
];

const MEDIA_KEYS: QuickKey[] = [
  { label: "Vol+", page: 12, id: 0xe9 },
  { label: "Vol-", page: 12, id: 0xea },
  { label: "Mute", page: 12, id: 0xe2 },
  { label: "Next", page: 12, id: 0xb5 },
  { label: "Prev", page: 12, id: 0xb6 },
  { label: "Play/Pause", page: 12, id: 0xcd },
  { label: "Bright+", page: 12, id: 0x6f },
  { label: "Bright-", page: 12, id: 0x70 },
];

// ZMK modifier flags (left side)
const ZMK_MOD_LCTL = 0x01;
const ZMK_MOD_LSFT = 0x02;
const ZMK_MOD_LALT = 0x04;
const ZMK_MOD_LGUI = 0x08;

const MOD_CHECKBOXES = [
  { label: "Ctrl", flag: ZMK_MOD_LCTL },
  { label: "Shift", flag: ZMK_MOD_LSFT },
  { label: "Alt", flag: ZMK_MOD_LALT },
  { label: "GUI", flag: ZMK_MOD_LGUI },
];

type CategoryId = "alpha" | "number" | "fkeys" | "special" | "mod" | "symbol" | "media" | "advanced";

const CATEGORIES: { id: CategoryId; label: string; keys?: QuickKey[] }[] = [
  { id: "alpha", label: "ABC", keys: ALPHA_KEYS },
  { id: "number", label: "123", keys: NUMBER_KEYS },
  { id: "fkeys", label: "Fn", keys: F_KEYS },
  { id: "special", label: "Special", keys: SPECIAL_KEYS },
  { id: "mod", label: "Mod", keys: MOD_KEYS },
  { id: "symbol", label: "Symbol", keys: SYMBOL_KEYS },
  { id: "media", label: "Media", keys: MEDIA_KEYS },
  { id: "advanced", label: "Advanced" },
];

export const BehaviorBindingPicker = ({
  binding,
  layers,
  behaviors,
  onBindingChanged,
}: BehaviorBindingPickerProps) => {
  const [behaviorId, setBehaviorId] = useState(binding.behaviorId);
  const [param1, setParam1] = useState<number | undefined>(binding.param1);
  const [param2, setParam2] = useState<number | undefined>(binding.param2);
  const [activeCategory, setActiveCategory] = useState<CategoryId>("alpha");
  const [modFlags, setModFlags] = useState<number>(0);

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
      (b) =>
        b.displayName.toLowerCase().includes("key") &&
        b.displayName.toLowerCase().includes("press")
    );
  }, [behaviors]);

  useEffect(() => {
    if (
      binding.behaviorId === behaviorId &&
      binding.param1 === param1 &&
      binding.param2 === param2
    ) {
      return;
    }
    if (!metadata) {
      return;
    }
    if (
      validateBinding(
        metadata,
        layers.map(({ id }) => id),
        param1,
        param2
      )
    ) {
      onBindingChanged({
        behaviorId,
        param1: param1 || 0,
        param2: param2 || 0,
      });
    }
  }, [behaviorId, param1, param2]);

  useEffect(() => {
    setBehaviorId(binding.behaviorId);
    setParam1(binding.param1);
    setParam2(binding.param2);
    // Extract modifier flags from current binding
    if (binding.param1) {
      const implicitMods = (binding.param1 >> 24) & 0xff;
      setModFlags(implicitMods);
    } else {
      setModFlags(0);
    }
  }, [binding]);

  const handleQuickKey = (key: QuickKey) => {
    if (!keyPressBehavior) return;
    const baseUsage = hid_usage_from_page_and_id(key.page, key.id);
    // Encode modifiers in upper byte of param1 (ZMK implicit modifier format)
    const finalParam = modFlags > 0 ? ((modFlags << 24) | baseUsage) : baseUsage;
    setBehaviorId(keyPressBehavior.id);
    setParam1(finalParam);
    setParam2(0);
  };

  const toggleMod = (flag: number) => {
    setModFlags((prev) => prev ^ flag);
  };

  const currentBaseUsage = useMemo(() => {
    if (!keyPressBehavior || behaviorId !== keyPressBehavior.id) return -1;
    const p = param1 || 0;
    return p & 0x00ffffff; // strip modifier bits
  }, [behaviorId, param1, keyPressBehavior]);

  const activeCat = CATEGORIES.find((c) => c.id === activeCategory);

  const modPreview = useMemo(() => {
    const parts: string[] = [];
    MOD_CHECKBOXES.forEach((m) => {
      if (modFlags & m.flag) parts.push(m.label);
    });
    return parts.join(" + ");
  }, [modFlags]);

  return (
    <div className="flex flex-col gap-2 max-h-[45vh] overflow-y-auto">
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

      {/* Modifier checkboxes */}
      {activeCategory !== "advanced" && activeCategory !== "mod" && (
        <div className="flex items-center gap-4 px-3 py-2 bg-base-100 rounded-lg border border-base-300">
          <span className="text-xs text-base-content/50 shrink-0">Modifier:</span>
          {MOD_CHECKBOXES.map((m) => {
            const isOn = (modFlags & m.flag) !== 0;
            return (
              <label
                key={m.label}
                className={`flex items-center gap-1.5 cursor-pointer text-xs select-none transition-colors ${
                  isOn ? "text-primary font-semibold" : "text-base-content/60"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isOn}
                  onChange={() => toggleMod(m.flag)}
                  className="w-3.5 h-3.5 rounded accent-primary cursor-pointer"
                />
                {m.label}
              </label>
            );
          })}
          {modPreview && (
            <span className="ml-auto text-xs text-primary font-medium">
              {modPreview} + ...
            </span>
          )}
        </div>
      )}

      {/* Visual keyboard grid */}
      {activeCategory !== "advanced" && activeCat?.keys && (
        <div
          className={`grid gap-1.5 ${
            activeCategory === "alpha"
              ? "grid-cols-[repeat(auto-fill,minmax(38px,1fr))]"
              : activeCategory === "media"
              ? "grid-cols-[repeat(auto-fill,minmax(72px,1fr))]"
              : "grid-cols-[repeat(auto-fill,minmax(50px,1fr))]"
          }`}
        >
          {activeCat.keys.map((key) => {
            const usage = hid_usage_from_page_and_id(key.page, key.id);
            const isActive = currentBaseUsage === usage;
            return (
              <button
                key={usage}
                onClick={() => handleQuickKey(key)}
                title={key.sub || key.label}
                className={`flex flex-col items-center justify-center rounded-lg text-sm transition-all duration-100 border ${
                  key.sub ? "min-h-[44px] py-1" : "min-h-[38px]"
                } ${
                  isActive
                    ? "bg-primary text-primary-content border-primary font-bold shadow-md"
                    : "bg-base-100 hover:bg-base-200 text-base-content border-base-300 hover:border-primary/50 hover:-translate-y-px hover:shadow active:scale-95"
                }`}
              >
                <span className="leading-none font-medium">{key.label}</span>
                {key.sub && (
                  <span className={`text-[10px] leading-none mt-0.5 ${
                    isActive ? "text-primary-content/70" : "text-base-content/40"
                  }`}>
                    {key.sub}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Advanced mode */}
      {activeCategory === "advanced" && (
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs text-base-content/50 block mb-1">
              Behavior
            </label>
            <select
              value={behaviorId}
              className="h-9 rounded-lg w-full text-sm bg-base-100 border border-base-300 px-2"
              onChange={(e) => {
                setBehaviorId(parseInt(e.target.value));
                setParam1(0);
                setParam2(0);
              }}
            >
              {sortedBehaviors.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.displayName}
                </option>
              ))}
            </select>
          </div>
          {metadata && (
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
      )}
    </div>
  );
};
