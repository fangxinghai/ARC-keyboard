import {
  CSSProperties,
  PropsWithChildren,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Key } from "./Key";

export type KeyPosition = PropsWithChildren<{
  id: string;
  header?: string;
  width: number;
  height: number;
  x: number;
  y: number;
  r?: number;
  rx?: number;
  ry?: number;
}>;

export type LayoutZoom = number | "auto";

export function deserializeLayoutZoom(value: string): LayoutZoom {
  if (value === "auto") return "auto";
  return parseFloat(value) || "auto";
}

interface PhysicalLayoutProps {
  positions: Array<KeyPosition>;
  selectedPosition?: number;
  oneU?: number;
  hoverZoom?: boolean;
  zoom?: LayoutZoom;
  onPositionClicked?: (position: number) => void;
}

interface PhysicalLayoutPositionLocation {
  x: number; y: number; r?: number; rx?: number; ry?: number;
}

function scalePosition({ x, y, r, rx, ry }: PhysicalLayoutPositionLocation, oneU: number): CSSProperties {
  let left = x * oneU;
  let top = y * oneU;
  let transformOrigin = undefined;
  let transform = undefined;
  const transformStyle: "preserve-3d" = "preserve-3d";
  if (r) {
    let transformX = ((rx || x) - x) * oneU;
    let transformY = ((ry || y) - y) * oneU;
    transformOrigin = `${transformX}px ${transformY}px`;
    transform = `rotate(${r}deg)`;
  }
  return { top, left, transformOrigin, transform, transformStyle };
}

// ─── 判断按键分组（左边按键区 vs 右边旋钮区）───
function classifyPositions(positions: KeyPosition[]): { keys: number[]; encoders: number[] } {
  if (positions.length <= 2) return { keys: [], encoders: positions.map((_, i) => i) };
  
  // 按 x 坐标排序，找到右侧间隔最大的分界点
  const sorted = positions.map((p, i) => ({ x: p.x, i })).sort((a, b) => a.x - b.x);
  
  let maxGap = 0;
  let splitIdx = positions.length;
  
  for (let i = 1; i < sorted.length; i++) {
    const gap = sorted[i].x - sorted[i - 1].x;
    // 如果间隔大于 2U，并且右侧只有少量键（<=2），认为是旋钮
    if (gap > 2 && sorted.length - i <= 2) {
      if (gap > maxGap) {
        maxGap = gap;
        splitIdx = i;
      }
    }
  }
  
  if (maxGap > 0) {
    const keyIndices = sorted.slice(0, splitIdx).map((s) => s.i);
    const encoderIndices = sorted.slice(splitIdx).map((s) => s.i);
    return { keys: keyIndices, encoders: encoderIndices };
  }
  
  return { keys: positions.map((_, i) => i), encoders: [] };
}

export const PhysicalLayout = ({
  positions,
  selectedPosition,
  oneU = 48,
  onPositionClicked,
  ...props
}: PhysicalLayoutProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const parent = element.parentElement;
    if (!parent) return;
    const calculateScale = () => {
      if (props.zoom === "auto") {
        const padding = Math.min(window.innerWidth, window.innerHeight) * 0.05;
        const newScale = Math.min(
          parent.clientWidth / (element.clientWidth + 2 * padding),
          parent.clientHeight / (element.clientHeight + 2 * padding),
        );
        setScale(newScale);
      } else {
        setScale(props.zoom || 1);
      }
    };
    calculateScale();
    const resizeObserver = new ResizeObserver(() => calculateScale());
    resizeObserver.observe(element);
    resizeObserver.observe(parent);
    return () => resizeObserver.disconnect();
  }, [props.zoom]);

  let rightMost = positions.map((k) => k.x + k.width).reduce((a, b) => Math.max(a, b), 0);
  let bottomMost = positions.map((k) => k.y + k.height).reduce((a, b) => Math.max(a, b), 0);

  // 计算按键区和旋钮区的边界
  const { keys: keyIndices, encoders: encoderIndices } = classifyPositions(positions);

  function getBounds(indices: number[]) {
    if (indices.length === 0) return null;
    const ps = indices.map((i) => positions[i]);
    const minX = Math.min(...ps.map((p) => p.x));
    const minY = Math.min(...ps.map((p) => p.y));
    const maxX = Math.max(...ps.map((p) => p.x + p.width));
    const maxY = Math.max(...ps.map((p) => p.y + p.height));
    return { minX, minY, maxX, maxY };
  }

  const keyBounds = getBounds(keyIndices);
  const encoderBounds = getBounds(encoderIndices);

  const pad = 8; // px padding
  const labelH = 18; // 标签高度

  const positionItems = positions.map((p, idx) => (
    <div className="absolute" style={scalePosition(p, oneU)} key={p.id}>
      <div
        onClick={() => onPositionClicked?.(idx)}
        className="hover:[transform:translateZ(50px)] transition-transform duration-150 ease-out"
      >
        <Key oneU={oneU} selected={idx === selectedPosition} {...p} />
      </div>
    </div>
  ));

  return (
    <div
      className="relative"
      style={{
        height: bottomMost * oneU + labelH + pad + "px",
        width: rightMost * oneU + "px",
        transform: `scale(${scale})`,
        transformStyle: "preserve-3d",
      }}
      ref={ref}
    >
      {/* ─── 按键区外框 ─── */}
      {keyBounds && (
        <div
          className="absolute rounded-2xl border border-base-content/8 pointer-events-none"
          style={{
            left: keyBounds.minX * oneU - pad,
            top: keyBounds.minY * oneU - pad,
            width: (keyBounds.maxX - keyBounds.minX) * oneU + pad * 2,
            height: (keyBounds.maxY - keyBounds.minY) * oneU + pad * 2,
          }}
        >
          <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-base-content/25 font-medium whitespace-nowrap">
            按键
          </span>
        </div>
      )}

      {/* ─── 旋钮区外框 ─── */}
      {encoderBounds && (
        <div
          className="absolute rounded-2xl border border-base-content/8 pointer-events-none"
          style={{
            left: encoderBounds.minX * oneU - pad,
            top: encoderBounds.minY * oneU - pad,
            width: (encoderBounds.maxX - encoderBounds.minX) * oneU + pad * 2,
            height: (encoderBounds.maxY - encoderBounds.minY) * oneU + pad * 2,
          }}
        >
          <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-base-content/25 font-medium whitespace-nowrap">
            旋钮
          </span>
        </div>
      )}

      {positionItems}
    </div>
  );
};
