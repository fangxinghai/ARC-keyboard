import { useEffect, useRef } from "react";

// ═══ Simplex Noise 轻量实现 ═══
class SimplexNoise {
  private perm: number[];
  private grad3 = [
    [1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],
    [1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],
    [0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1],
  ];

  constructor(seed = 42) {
    const p: number[] = [];
    for (let i = 0; i < 256; i++) p[i] = i;
    let s = seed * 2147483647 || 1;
    for (let i = 255; i > 0; i--) {
      s = (s * 16807) % 2147483647;
      const j = Math.floor((s / 2147483647) * (i + 1));
      [p[i], p[j]] = [p[j], p[i]];
    }
    this.perm = [...p, ...p];
  }

  private dot(g: number[], x: number, y: number) { return g[0]*x + g[1]*y; }

  noise2D(xin: number, yin: number): number {
    const F2 = 0.5*(Math.sqrt(3)-1);
    const G2 = (3-Math.sqrt(3))/6;
    const s = (xin+yin)*F2;
    const i = Math.floor(xin+s), j = Math.floor(yin+s);
    const t = (i+j)*G2;
    const x0 = xin-(i-t), y0 = yin-(j-t);
    const [i1, j1] = x0>y0 ? [1,0] : [0,1];
    const x1=x0-i1+G2, y1=y0-j1+G2;
    const x2=x0-1+2*G2, y2=y0-1+2*G2;
    const ii=i&255, jj=j&255;
    const gi0=this.perm[ii+this.perm[jj]]%12;
    const gi1=this.perm[ii+i1+this.perm[jj+j1]]%12;
    const gi2=this.perm[ii+1+this.perm[jj+1]]%12;
    let n0=0, n1=0, n2=0;
    let t0=0.5-x0*x0-y0*y0;
    if(t0>=0){t0*=t0;n0=t0*t0*this.dot(this.grad3[gi0],x0,y0);}
    let t1=0.5-x1*x1-y1*y1;
    if(t1>=0){t1*=t1;n1=t1*t1*this.dot(this.grad3[gi1],x1,y1);}
    let t2=0.5-x2*x2-y2*y2;
    if(t2>=0){t2*=t2;n2=t2*t2*this.dot(this.grad3[gi2],x2,y2);}
    return 70*(n0+n1+n2);
  }
}

const simplex = new SimplexNoise(42);

// 亮色色板（饱和度+15%）
const LIGHT_COLORS = [
  { r: 255, g: 100, b: 145 },  // 粉红
  { r: 75,  g: 195, b: 255 },  // 天蓝
  { r: 110, g: 235, b: 165 },  // 薄荷绿
  { r: 255, g: 215, b: 85  },  // 柠檬黄
  { r: 175, g: 120, b: 255 },  // 薰衣草紫
  { r: 255, g: 155, b: 115 },  // 蜜桃橙
];

// 暗色色板
const DARK_COLORS = [
  { r: 255, g: 40,  b: 85  },
  { r: 10,  g: 120, b: 255 },
  { r: 40,  g: 210, b: 85  },
  { r: 255, g: 200, b: 10  },
  { r: 180, g: 75,  b: 242 },
  { r: 255, g: 85,  b: 120 },
];

export function WatercolorBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const darkRef = useRef(false);
  const frameRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const scale = 0.2; // 低分辨率 → 自带柔和模糊

    let W = 0, H = 0;
    function resize() {
      W = Math.ceil(window.innerWidth * scale);
      H = Math.ceil(window.innerHeight * scale);
      canvas!.width = W;
      canvas!.height = H;
    }
    resize();
    window.addEventListener("resize", resize);

    // 监听 dark class
    const observer = new MutationObserver(() => {
      darkRef.current = document.documentElement.classList.contains("dark");
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    function draw(time: number) {
      const t = time * 0.00035; // 流动速度
      const colors = darkRef.current ? DARK_COLORS : LIGHT_COLORS;
      const imageData = ctx.createImageData(W, H);
      const data = imageData.data;

      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const idx = (y * W + x) * 4;
          const nx = x / W, ny = y / H;
          let r = 0, g = 0, b = 0, tw = 0;

          for (let i = 0; i < colors.length; i++) {
            const freq = 1.8 + i * 0.3;
            const ox = i * 7.7 + t * (0.8 + i * 0.15);
            const oy = i * 5.3 + t * (0.6 + i * 0.12);
            let n = simplex.noise2D(nx*freq+ox, ny*freq+oy) * 0.6
                  + simplex.noise2D(nx*freq*2.2+ox*1.3, ny*freq*2.2+oy*1.3) * 0.25
                  + simplex.noise2D(nx*freq*4.5+ox*0.7, ny*freq*4.5+oy*0.7) * 0.15;
            let w = (n + 1) * 0.5;
            w = w * w * (3 - 2 * w);
            w = Math.pow(w, 1.2);
            r += colors[i].r * w;
            g += colors[i].g * w;
            b += colors[i].b * w;
            tw += w;
          }
          if (tw > 0) { r /= tw; g /= tw; b /= tw; }

          const mix = darkRef.current ? 0.45 : 0.5;
          const base = darkRef.current ? 8 : 250;
          data[idx]   = Math.min(255, r * (1-mix) + base * mix);
          data[idx+1] = Math.min(255, g * (1-mix) + base * mix);
          data[idx+2] = Math.min(255, b * (1-mix) + base * mix);
          data[idx+3] = 255;
        }
      }
      ctx.putImageData(imageData, 0, 0);
      frameRef.current = requestAnimationFrame(draw);
    }
    frameRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", resize);
      observer.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 w-full h-full"
      style={{ imageRendering: "auto" }}
    />
  );
}
