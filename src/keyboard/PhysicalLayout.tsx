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
  { x, y, r, rx, ry }: { x: number; y: number; r?: number; rx?: number; ry?: number }, oneU: number
): CSSProperties {
  const left = x * oneU, top = y * oneU;
  let transformOrigin: string | undefined, transform: string | undefined;
  if (r) {
    transformOrigin = `${((rx || x) - x) * oneU}px ${((ry || y) - y) * oneU}px`;
    transform = `rotate(${r}deg)`;
  }
  return { top, left, transformOrigin, transform, transformStyle: "preserve-3d" as const };
}

function clusterPositions(positions: KeyPosition[]): number[][] {
  if (positions.length === 0) return [];
  const items = positions.map((p, i) => ({ i, cx: p.x + p.width / 2 }));
  items.sort((a, b) => a.cx - b.cx);
  let maxGap = 0, splitAt = -1;
  for (let k = 1; k < items.length; k++) {
    const gap = items[k].cx - items[k - 1].cx;
    if (gap > maxGap) { maxGap = gap; splitAt = k; }
  }
  if (maxGap > 3 && splitAt > 0) {
    return [items.slice(0, splitAt).map((it) => it.i), items.slice(splitAt).map((it) => it.i)];
  }
  return [items.map((it) => it.i)];
}

function getBounds(positions: KeyPosition[], indices: number[]) {
  if (indices.length === 0) return null;
  const ps = indices.map((i) => positions[i]);
  return {
    minX: Math.min(...ps.map((p) => p.x)), minY: Math.min(...ps.map((p) => p.y)),
    maxX: Math.max(...ps.map((p) => p.x + p.width)), maxY: Math.max(...ps.map((p) => p.y + p.height)),
  };
}

export const PhysicalLayout = ({
  positions, selectedPosition, oneU = 48, onPositionClicked, ...props
}: PhysicalLayoutProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const el = ref.current; if (!el) return;
    const parent = el.parentElement; if (!parent) return;
    const calc = () => {
      if (props.zoom === "auto") {
        const pad = Math.min(window.innerWidth, window.innerHeight) * 0.04;
        setScale(Math.min(parent.clientWidth / (el.clientWidth + 2 * pad), parent.clientHeight / (el.clientHeight + 2 * pad)));
      } else { setScale(props.zoom || 1); }
    };
    calc();
    const ro = new ResizeObserver(calc); ro.observe(el); ro.observe(parent);
    return () => ro.disconnect();
  }, [props.zoom]);

  const rightMost = positions.map((k) => k.x + k.width).reduce((a, b) => Math.max(a, b), 0);
  const bottomMost = positions.map((k) => k.y + k.height).reduce((a, b) => Math.max(a, b), 0);
  const groups = clusterPositions(positions);
  const pad = 10;

  return (
    <div className="relative" ref={ref} style={{
      height: bottomMost * oneU + 28 + "px", width: rightMost * oneU + "px",
      transform: `scale(${scale})`, transformStyle: "preserve-3d",
    }}>
      {groups.map((group, gi) => {
        const bounds = getBounds(positions, group);
        if (!bounds) return null;

        return (
          <div key={gi} className="absolute group-frame pointer-events-none" style={{
            left: bounds.minX * oneU - pad, top: bounds.minY * oneU - pad,
            width: (bounds.maxX - bounds.minX) * oneU + pad * 2,
            height: (bounds.maxY - bounds.minY) * oneU + pad * 2,
          }}>
        
          </div>
        );
      })}
      {positions.map((p, idx) => (
        <div className="absolute" style={scalePosition(p, oneU)} key={p.id}>
          <div onClick={() => onPositionClicked?.(idx)}>
            <Key oneU={oneU} selected={idx === selectedPosition} {...p} />
          </div>
        </div>
      ))}
    </div>
  );
};
