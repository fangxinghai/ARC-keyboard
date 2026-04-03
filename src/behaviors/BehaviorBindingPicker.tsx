import { useEffect, useMemo, useState } from "react";
import {
  GetBehaviorDetailsResponse,
  BehaviorBindingParametersSet,
} from "@zmkfirmware/zmk-studio-ts-client/behaviors";
import { BehaviorBinding } from "@zmkfirmware/zmk-studio-ts-client/keymap";
import { BehaviorParametersPicker } from "./BehaviorParametersPicker";
import { validateValue } from "./parameters";

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

// Visual keyboard categories with Chinese labels
const KEY_CATEGORIES: Record<string, Array<{ label: string; usage: number }>> = {
  "\u5B57\u6BCD": [
    { label: "A", usage: 0x70004 }, { label: "B", usage: 0x70005 }, { label: "C", usage: 0x70006 },
    { label: "D", usage: 0x70007 }, { label: "E", usage: 0x70008 }, { label: "F", usage: 0x70009 },
    { label: "G", usage: 0x7000a }, { label: "H", usage: 0x7000b }, { label: "I", usage: 0x7000c },
    { label: "J", usage: 0x7000d }, { label: "K", usage: 0x7000e }, { label: "L", usage: 0x7000f },
    { label: "M", usage: 0x70010 }, { label: "N", usage: 0x70011 }, { label: "O", usage: 0x70012 },
    { label: "P", usage: 0x70013 }, { label: "Q", usage: 0x70014 }, { label: "R", usage: 0x70015 },
    { label: "S", usage: 0x70016 }, { label: "T", usage: 0x70017 }, { label: "U", usage: 0x70018 },
    { label: "V", usage: 0x70019 }, { label: "W", usage: 0x7001a }, { label: "X", usage: 0x7001b },
    { label: "Y", usage: 0x7001c }, { label: "Z", usage: 0x7001d },
  ],
  "\u6570\u5B57": [
    { label: "1", usage: 0x7001e }, { label: "2", usage: 0x7001f }, { label: "3", usage: 0x70020 },
    { label: "4", usage: 0x70021 }, { label: "5", usage: 0x70022 }, { label: "6", usage: 0x70023 },
    { label: "7", usage: 0x70024 }, { label: "8", usage: 0x70025 }, { label: "9", usage: 0x70026 },
    { label: "0", usage: 0x70027 },
  ],
  "\u529F\u80FD\u952E": [
    { label: "F1", usage: 0x7003a }, { label: "F2", usage: 0x7003b }, { label: "F3", usage: 0x7003c },
    { label: "F4", usage: 0x7003d }, { label: "F5", usage: 0x7003e }, { label: "F6", usage: 0x7003f },
    { label: "F7", usage: 0x70040 }, { label: "F8", usage: 0x70041 }, { label: "F9", usage: 0x70042 },
    { label: "F10", usage: 0x70043 }, { label: "F11", usage: 0x70044 }, { label: "F12", usage: 0x70045 },
  ],
  "\u7279\u6B8A\u952E": [
    { label: "Esc", usage: 0x70029 }, { label: "Tab", usage: 0x7002b }, { label: "\u7A7A\u683C", usage: 0x7002c },
    { label: "\u56DE\u8F66", usage: 0x70028 }, { label: "\u9000\u683C", usage: 0x7002a }, { label: "Del", usage: 0x7004c },
    { label: "Ins", usage: 0x70049 }, { label: "Home", usage: 0x7004a }, { label: "End", usage: 0x7004d },
    { label: "PgUp", usage: 0x7004b }, { label: "PgDn", usage: 0x7004e },
    { label: "\u2191", usage: 0x70052 }, { label: "\u2193", usage: 0x70051 },
    { label: "\u2190", usage: 0x70050 }, { label: "\u2192", usage: 0x7004f },
    { label: "PrtSc", usage: 0x70046 }, { label: "Caps", usage: 0x70039 },
  ],
  "\u4FEE\u9970\u952E": [
    { label: "L Ctrl", usage: 0x700e0 }, { label: "L Shift", usage: 0x700e1 },
    { label: "L Alt", usage: 0x700e2 }, { label: "L GUI", usage: 0x700e3 },
    { label: "R Ctrl", usage: 0x700e4 }, { label: "R Shift", usage: 0x700e5 },
    { label: "R Alt", usage: 0x700e6 }, { label: "R GUI", usage: 0x700e7 },
  ],
  "\u7B26\u53F7": [
    { label: "-", usage: 0x7002d }, { label: "=", usage: 0x7002e },
    { label: "[", usage: 0x7002f }, { label: "]", usage: 0x70030 },
    { label: "\\", usage: 0x70031 }, { label: ";", usage: 0x70033 },
    { label: "'", usage: 0x70034 }, { label: ",", usage: 0x70036 },
    { label: ".", usage: 0x70037 }, { label: "/", usage: 0x70038 },
    { label: "`", usage: 0x70035 },
  ],
  "\u591A\u5A92\u4F53": [
    { label: "\u97F3\u91CF+", usage: 0x0c00e9 }, { label: "\u97F3\u91CF-", usage: 0x0c00ea },
    { label: "\u9759\u97F3", usage: 0x0c00e2 }, { label: "\u4E0B\u4E00\u66F2", usage: 0x0c00b5 },
    { label: "\u4E0A\u4E00\u66F2", usage: 0x0c00b6 }, { label: "\u64AD\u653E/\u6682\u505C", usage: 0x0c00cd },
    { label: "\u4EAE\u5EA6+", usage: 0x0c006f }, { label: "\u4EAE\u5EA6-", usage: 0x0c0070 },
  ],
};

export const BehaviorBindingPicker = ({
  binding,
  layers,
  behaviors,
  onBindingChanged,
}: BehaviorBindingPickerProps) => {
  const [behaviorId, setBehaviorId] = useState(binding.behaviorId);
  const [param1, setParam1] = useState<number | undefined>(binding.param1);
  const [param2, setParam2] = useState<number | undefined>(binding.param2);
  const [activeCategory, setActiveCategory] = useState("\u5B57\u6BCD");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const metadata = useMemo(
    () => behaviors.find((b) => b.id == behaviorId)?.metadata,
    [behaviorId, behaviors]
  );

  const sortedBehaviors = useMemo(
    () => behaviors.sort((a, b) => a.displayName.localeCompare(b.displayName)),
    [behaviors]
  );

  // Find the "key press" behavior ID
  const keyPressBehaviorId = useMemo(() => {
    const kp = behaviors.find(
      (b) =>
        b.displayName.toLowerCase().includes("key") &&
        b.displayName.toLowerCase().includes("press")
    );
    return kp?.id;
  }, [behaviors]);

  const isKeyPressBehavior = useMemo(() => {
    if (!keyPressBehaviorId) return false;
    return behaviorId === keyPressBehaviorId;
  }, [behaviorId, keyPressBehaviorId]);

  useEffect(() => {
    if (
      binding.behaviorId === behaviorId &&
      binding.param1 === param1 &&
      binding.param2 === param2
    ) {
      return;
    }

    if (!metadata) {
      console.error(
        "Can't find metadata for the selected behaviorId",
        behaviorId
      );
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
  }, [binding]);

  // Quick key press handler for visual keyboard
  const handleQuickKey = (usage: number) => {
    if (keyPressBehaviorId !== undefined) {
      setBehaviorId(keyPressBehaviorId);
      setParam1(usage);
      setParam2(0);
    }
  };

  return (
    <div className="flex flex-col gap-3 max-h-[45vh] overflow-y-auto">
      {/* Category tabs */}
      <div className="flex gap-1 flex-wrap">
        {Object.keys(KEY_CATEGORIES).map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setActiveCategory(cat);
              setShowAdvanced(false);
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-150 ${
              activeCategory === cat && !showAdvanced
                ? "bg-primary text-primary-content shadow-sm"
                : "bg-base-100 hover:bg-base-300 text-base-content"
            }`}
          >
            {cat}
          </button>
        ))}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-150 ${
            showAdvanced
              ? "bg-primary text-primary-content shadow-sm"
              : "bg-base-100 hover:bg-base-300 text-base-content"
          }`}
        >
          \u9AD8\u7EA7
        </button>
      </div>

      {/* Visual keyboard grid */}
      {!showAdvanced && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(52px,1fr))] gap-1.5">
          {KEY_CATEGORIES[activeCategory]?.map((key) => (
            <button
              key={key.usage}
              onClick={() => handleQuickKey(key.usage)}
              className={`h-10 rounded-lg text-xs font-medium transition-all duration-100 ${
                isKeyPressBehavior && param1 === key.usage
                  ? "bg-primary text-primary-content shadow-sm ring-2 ring-primary ring-offset-1 ring-offset-base-200"
                  : "bg-base-100 hover:bg-base-300 hover:-translate-y-0.5 hover:shadow text-base-content border border-base-300"
              }`}
            >
              {key.label}
            </button>
          ))}
        </div>
      )}

      {/* Advanced: original behavior selector */}
      {showAdvanced && (
        <div className="flex flex-col gap-2">
          <div>
            <label className="text-xs text-base-content/60 block mb-1">
              \u884C\u4E3A
            </label>
            <select
              value={behaviorId}
              className="h-8 rounded-lg w-full text-sm"
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
