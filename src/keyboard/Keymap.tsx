import {
  PhysicalLayout, Keymap as KeymapMsg,
} from "@zmkfirmware/zmk-studio-ts-client/keymap";
import type { GetBehaviorDetailsResponse } from "@zmkfirmware/zmk-studio-ts-client/behaviors";
import { LayoutZoom, PhysicalLayout as PhysicalLayoutComp } from "./PhysicalLayout";
import { HidUsageLabel } from "./HidUsageLabel";

type BehaviorMap = Record<number, GetBehaviorDetailsResponse>;

// ─── Behavior 参数的中文描述 ───


// 通用参数名翻译
function getParamLabel(behaviorName: string, param1: number, behavior?: GetBehaviorDetailsResponse): string {
  const n = behaviorName.toLowerCase();

  // 蓝牙
  if (n.includes("bluetooth") || n === "bt") {
    const meta = behavior?.metadata;
    if (meta) {
      for (const set of meta) {
        const match = set.param1.find((p) => p.constant === param1);
        if (match) {
          // 翻译常见蓝牙操作名
          const zh: Record<string, string> = {
            "Next Profile": "下一配置",
            "Previous Profile": "上一配置",
            "Select Profile": "选择配置",
            "Clear All Profiles": "清除所有",
            "Clear Selected Profile": "清除当前",
            "Disconnect Profile": "断开连接",
          };
          return zh[match.name] || match.name;
        }
      }
    }
    return `配置 ${param1}`;
  }

  // 输出选择
  if (n.includes("output")) {
    const map: Record<number, string> = { 0: "切换", 1: "USB", 2: "蓝牙" };
    return map[param1] || `${param1}`;
  }

  // RGB
  if (n.includes("rgb") || n.includes("underglow")) {
    const map: Record<number, string> = {
      0: "开/关", 1: "开", 2: "关", 3: "色相+", 4: "色相-",
      5: "饱和+", 6: "饱和-", 7: "亮度+", 8: "亮度-",
      9: "速度+", 10: "速度-", 11: "下一效果", 12: "上一效果",
    };
    return map[param1] || `${param1}`;
  }

  // 背光
  if (n.includes("backlight")) {
    const map: Record<number, string> = { 0: "开/关", 1: "开", 2: "关", 3: "亮度+", 4: "亮度-", 5: "循环" };
    return map[param1] || `${param1}`;
  }

  // 外部电源
  if (n.includes("ext") && n.includes("power")) {
    const map: Record<number, string> = { 0: "开/关", 1: "开", 2: "关" };
    return map[param1] || `${param1}`;
  }

  return "";
}

export interface KeymapProps {
  layout: PhysicalLayout;
  keymap: KeymapMsg;
  behaviors: BehaviorMap;
  scale: LayoutZoom;
  selectedLayerIndex: number;
  selectedKeyPosition: number | undefined;
  onKeyPositionClicked: (keyPosition: number) => void;
}

export const Keymap = ({
  layout, keymap, behaviors, scale,
  selectedLayerIndex, selectedKeyPosition, onKeyPositionClicked,
}: KeymapProps) => {
  if (!keymap.layers[selectedLayerIndex]) return <></>;

  const positions = layout.keys.map((k, i) => {
    if (i >= keymap.layers[selectedLayerIndex].bindings.length) {
      return {
        id: `${keymap.layers[selectedLayerIndex].id}-${i}`,
        header: "",
        x: k.x / 100.0, y: k.y / 100.0,
        width: k.width / 100, height: k.height / 100.0,
        children: <span></span>,
      };
    }

    const binding = keymap.layers[selectedLayerIndex].bindings[i];
    const behavior = behaviors[binding.behaviorId];
    const behaviorName = behavior?.displayName || "Unknown";

    // 判断是否是 Key Press（有 HID usage 参数）
    const isKeyPress = behaviorName.toLowerCase().includes("key") && behaviorName.toLowerCase().includes("press");

    // 获取参数标签
    const paramLabel = !isKeyPress ? getParamLabel(behaviorName, binding.param1, behavior) : "";

    return {
      id: `${keymap.layers[selectedLayerIndex].id}-${i}`,
      header: behaviorName,
      x: k.x / 100.0, y: k.y / 100.0,
      width: k.width / 100, height: k.height / 100.0,
      r: (k.r || 0) / 100.0,
      rx: (k.rx || 0) / 100.0,
      ry: (k.ry || 0) / 100.0,
      children: isKeyPress ? (
        <HidUsageLabel hid_usage={binding.param1} />
      ) : (
        <span className="text-[10px] leading-tight text-center">{paramLabel}</span>
      ),
    };
  });

  return (
    <PhysicalLayoutComp
      positions={positions}
      oneU={48}
      hoverZoom={true}
      zoom={scale}
      selectedPosition={selectedKeyPosition}
      onPositionClicked={onKeyPositionClicked}
    />
  );
};
