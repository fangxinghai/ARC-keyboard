import {
  CSSProperties, PropsWithChildren, useLayoutEffect, useRef, useState,
} from "react";
import { Key } from "./Key";

export type KeyPosition = PropsWithChildren<{
  id: string; header?: string; width: number; height: number;
  x: number; y: number; r?: number; rx?: number; ry?: number;
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

function scalePosition(
  { x, y, r, rx, ry }: { x: number; y: number; r?: number; rx?: number; ry?: number },
  oneU: number
): CSSProperties {
  let left = x * oneU;
  let top = y * oneU;
  let transformOrigin = undefined;
  let transform = undefined;
  if (r) {
    transformOrigin = `${((rx || x) - x) * oneU}px ${((ry || y) - y) * oneU}px`;
    transform = `rotate(${r}deg)`;
  }
  return { top, left, transformOrigin, transform, transformStyle: "preserve-3d" as const };
}

// ─── 分组：找到水平间隔 > 1.5U 的地方分割 ───
function findGroups(positions: KeyPosition[]): number[][] {
  if (positions.length === 0) return [];
  if (positions.length <= 2) return [positions.map((_, i) => i)];

  // 按 x+width 的右边界排序，找大间隔
  const items = positions.map((p, i) => ({ i, left: p.x, right: p.x + p.width }));
  items.sort((a, b) => a.left - b.left);

  const groups: number[][] = [[items[0].i]];
  
  for (let k = 1; k < items.length; k++) {
    // 当前键的左边界 vs 上一个键的右边界
    const gap = items[k].left - items[k - 1].right;
    if (gap > 1.5) {
      // 新组
      groups.push([items[k].i]);
    } else {
      groups[groups.length - 1].push(items[k].i);
    }
  }

  return groups;
}

function getBounds(positions: KeyPosition[], indices: number[]) {
  if (indices.length === 0) return null;
  const ps = indices.map((i) => positions[i]);
  return {
    minX: Math.min(...ps.map((p) => p.x)),
    minY: Math.min(...ps.map((p) => p.y)),
    maxX: Math.max(...ps.map((p) => p.x + p.width)),
    maxY: Math.max(...ps.map((p) => p.y + p.height)),
  };
}

export const PhysicalLayout = ({
  positions, selectedPosition, oneU = 48, onPositionClicked, ...props
}: PhysicalLayoutProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const parent = element.parentElement;
    if (!parent) return;
    const calc = () => {
      if (props.zoom === "auto") {
        const pad = Math.min(window.innerWidth, window.innerHeight) * 0.05;
        setScale(Math.min(
          parent.clientWidth / (element.clientWidth + 2 * pad),
          parent.clientHeight / (element.clientHeight + 2 * pad),
        ));
      } else {
        setScale(props.zoom || 1);
      }
    };
    calc();
    const ro = new ResizeObserver(calc);
    ro.observe(element); ro.observe(parent);
    return () => ro.disconnect();
  }, [props.zoom]);

  const rightMost = positions.map((k) => k.x + k.width).reduce((a, b) => Math.max(a, b), 0);
  const bottomMost = positions.map((k) => k.y + k.height).reduce((a, b) => Math.max(a, b), 0);

  // 分组
  const groups = findGroups(positions);
  const pad = 8;

  const positionItems = positions.map((p, idx) => (
    <div className="absolute" style={scalePosition(p, oneU)} key={p.id}>
      <div onClick={() => onPositionClicked?.(idx)}
        className="hover:[transform:translateZ(30px)] transition-transform duration-100 ease-out">
        <Key oneU={oneU} selected={idx === selectedPosition} {...p} />
      </div>
    </div>
  ));

  return (
    <div className="relative" ref={ref}
      style={{
        height: bottomMost * oneU + 24 + "px",
        width: rightMost * oneU + "px",
        transform: `scale(${scale})`,
        transformStyle: "preserve-3d",
      }}>
      {/* 分组外框 */}
      {groups.map((group, gi) => {
        const bounds = getBounds(positions, group);
        if (!bounds) return null;
        const label = group.length <= 2 && groups.length > 1 ? "旋钮" : "按键";
        return (
          <div key={gi} className="absolute rounded-2xl pointer-events-none"
            style={{
              left: bounds.minX * oneU - pad,
              top: bounds.minY * oneU - pad,
              width: (bounds.maxX - bounds.minX) * oneU + pad * 2,
              height: (bounds.maxY - bounds.minY) * oneU + pad * 2,
              border: "1px solid",
              borderColor: "light-dark(rgba(0,0,0,0.08), rgba(255,255,255,0.1))",
            }}>
            <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-medium whitespace-nowrap"
              style={{ color: "light-dark(rgba(0,0,0,0.2), rgba(255,255,255,0.2))" }}>
              {label}
            </span>
          </div>
        );
      })}
      {positionItems}
    </div>
  );
};
