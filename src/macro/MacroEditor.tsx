import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { MacroContext } from "./MacroContext";
import {
  MacroSlot,
  MacroStep,
  MACRO_STEP_TAP,
  MACRO_STEP_DELAY,
  MACRO_STEP_KEY_PRESS,
  MACRO_STEP_KEY_RELEASE,
  MACRO_MAX_SLOTS,
  MACRO_MAX_STEPS,
} from "./macro-types";
import {
  encodeGetSlots,
  encodeSetSlot,
  encodeClearSlot,
  encodeExecSlot,
  MacroResponse,
} from "./macro-protocol";
import { hid_usage_from_page_and_id } from "../hid-usages";
import {
  Trash2,
  Play,
  Save,
  Plus,
  GripVertical,
  Clock,
  X,
  Download,
  Keyboard,
} from "lucide-react";

// ─── 按键标签映射（复用 BehaviorBindingPicker 的数据） ───

interface QuickKey {
  label: string;
  page: number;
  id: number;
  w?: number;
}

const ROW_ALPHA_TOP: QuickKey[] = [
  { label: "Q", page: 7, id: 0x14 },
  { label: "W", page: 7, id: 0x1a },
  { label: "E", page: 7, id: 0x08 },
  { label: "R", page: 7, id: 0x15 },
  { label: "T", page: 7, id: 0x17 },
  { label: "Y", page: 7, id: 0x1c },
  { label: "U", page: 7, id: 0x18 },
  { label: "I", page: 7, id: 0x0c },
  { label: "O", page: 7, id: 0x12 },
  { label: "P", page: 7, id: 0x13 },
];
const ROW_ALPHA_MID: QuickKey[] = [
  { label: "A", page: 7, id: 0x04 },
  { label: "S", page: 7, id: 0x16 },
  { label: "D", page: 7, id: 0x07 },
  { label: "F", page: 7, id: 0x09 },
  { label: "G", page: 7, id: 0x0a },
  { label: "H", page: 7, id: 0x0b },
  { label: "J", page: 7, id: 0x0d },
  { label: "K", page: 7, id: 0x0e },
  { label: "L", page: 7, id: 0x0f },
];
const ROW_ALPHA_BOT: QuickKey[] = [
  { label: "Z", page: 7, id: 0x1d },
  { label: "X", page: 7, id: 0x1b },
  { label: "C", page: 7, id: 0x06 },
  { label: "V", page: 7, id: 0x19 },
  { label: "B", page: 7, id: 0x05 },
  { label: "N", page: 7, id: 0x11 },
  { label: "M", page: 7, id: 0x10 },
];
const COMMON_KEYS: QuickKey[] = [
  { label: "Enter", page: 7, id: 0x28 },
  { label: "Space", page: 7, id: 0x2c },
  { label: "Bksp", page: 7, id: 0x2a },
  { label: "Tab", page: 7, id: 0x2b },
  { label: "Esc", page: 7, id: 0x29 },
  { label: "Del", page: 7, id: 0x4c },
];
const MOD_KEYS: QuickKey[] = [
  { label: "LCtrl", page: 7, id: 0xe0 },
  { label: "LShift", page: 7, id: 0xe1 },
  { label: "LAlt", page: 7, id: 0xe2 },
  { label: "LGUI", page: 7, id: 0xe3 },
  { label: "RCtrl", page: 7, id: 0xe4 },
  { label: "RShift", page: 7, id: 0xe5 },
  { label: "RAlt", page: 7, id: 0xe6 },
];

const ALL_LABEL_KEYS = [
  ...ROW_ALPHA_TOP,
  ...ROW_ALPHA_MID,
  ...ROW_ALPHA_BOT,
  ...COMMON_KEYS,
  ...MOD_KEYS,
  { label: "1", page: 7, id: 0x1e },
  { label: "2", page: 7, id: 0x1f },
  { label: "3", page: 7, id: 0x20 },
  { label: "4", page: 7, id: 0x21 },
  { label: "5", page: 7, id: 0x22 },
  { label: "6", page: 7, id: 0x23 },
  { label: "7", page: 7, id: 0x24 },
  { label: "8", page: 7, id: 0x25 },
  { label: "9", page: 7, id: 0x26 },
  { label: "0", page: 7, id: 0x27 },
  { label: "F1", page: 7, id: 0x3a },
  { label: "F2", page: 7, id: 0x3b },
  { label: "F3", page: 7, id: 0x3c },
  { label: "F4", page: 7, id: 0x3d },
  { label: "F5", page: 7, id: 0x3e },
  { label: "F6", page: 7, id: 0x3f },
  { label: "F7", page: 7, id: 0x40 },
  { label: "F8", page: 7, id: 0x41 },
  { label: "F9", page: 7, id: 0x42 },
  { label: "F10", page: 7, id: 0x43 },
  { label: "F11", page: 7, id: 0x44 },
  { label: "F12", page: 7, id: 0x45 },
  { label: "Up", page: 7, id: 0x52 },
  { label: "Down", page: 7, id: 0x51 },
  { label: "Left", page: 7, id: 0x50 },
  { label: "Right", page: 7, id: 0x4f },
];

function getStepLabel(step: MacroStep): string {
  const baseUsage = step.param1 & 0x00ffffff;
  const modFlags = (step.param1 >> 24) & 0xff;
  const hidId = baseUsage & 0xffff;
  const found = ALL_LABEL_KEYS.find((k) => k.id === hidId && k.page === 7);
  const keyName = found?.label || `0x${hidId.toString(16)}`;

  const mods: string[] = [];
  if (modFlags & 0x01) mods.push("Ctrl");
  if (modFlags & 0x02) mods.push("Shift");
  if (modFlags & 0x04) mods.push("Alt");
  if (modFlags & 0x08) mods.push("GUI");
  if (modFlags & 0x10) mods.push("RCtrl");
  if (modFlags & 0x20) mods.push("RShift");
  if (modFlags & 0x40) mods.push("RAlt");
  if (modFlags & 0x80) mods.push("RGUI");

  const prefix = mods.length > 0 ? mods.join("+") + "+" : "";

  switch (step.type) {
    case MACRO_STEP_TAP:
      return `⌨ ${prefix}${keyName}`;
    case MACRO_STEP_KEY_PRESS:
      return `↓ ${prefix}${keyName}`;
    case MACRO_STEP_KEY_RELEASE:
      return `↑ ${prefix}${keyName}`;
    case MACRO_STEP_DELAY:
      return `⏱ ${step.param1}ms`;
    default:
      return `? type=${step.type}`;
  }
}

// ─── 空槽位生成 ───────────────────────────────

function emptySlots(): MacroSlot[] {
  return Array.from({ length: MACRO_MAX_SLOTS }, (_, i) => ({
    id: i,
    name: `宏 ${i + 1}`,
    steps: [],
  }));
}

// ─── 主组件 ───────────────────────────────────

export const MacroEditor = () => {
  const { transport } = useContext(MacroContext);
  const [slots, setSlots] = useState<MacroSlot[]>(emptySlots());
  const [activeSlotId, setActiveSlotId] = useState(0);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const activeSlot = useMemo(
    () => slots.find((s) => s.id === activeSlotId) || slots[0],
    [slots, activeSlotId]
  );

  // ── 从键盘读取所有槽位 ──────────────────────
  const fetchSlots = useCallback(async () => {
    if (!transport) return;
    setLoading(true);
    setStatus(null);

    const timeout = setTimeout(() => {
      setLoading(false);
      setStatus("⚠️ 读取超时，固件可能不支持宏功能");
    }, 3000);

    transport.onResponse((resp: MacroResponse) => {
      clearTimeout(timeout);
      setLoading(false);
      if (resp.type === "slots_data" && resp.slots) {
        // 合并：用固件返回的数据覆盖本地
        const merged = emptySlots();
        for (const s of resp.slots) {
          if (s.id >= 0 && s.id < MACRO_MAX_SLOTS) {
            merged[s.id] = s;
          }
        }
        setSlots(merged);
        setStatus("✅ 已从键盘读取宏数据");
      } else if (resp.type === "error") {
        setStatus(`❌ 读取失败 (错误码: ${resp.errorCode})`);
      }
    });

    await transport.send(encodeGetSlots());
  }, [transport]);

  // ── 连接后自动读取 ─────────────────────────
  useEffect(() => {
    if (transport) {
      fetchSlots();
    }
    return () => {
      transport?.offResponse();
    };
  }, [transport]);

  // ── 保存槽位到键盘 ─────────────────────────
  const saveSlot = useCallback(
    async (slot: MacroSlot) => {
      if (!transport) return;

      transport.onResponse((resp: MacroResponse) => {
        if (resp.type === "ok") {
          setStatus(`✅ 宏 ${slot.id + 1} 已保存`);
        } else if (resp.type === "error") {
          setStatus(`❌ 保存失败 (错误码: ${resp.errorCode})`);
        }
      });

      await transport.send(encodeSetSlot(slot));
    },
    [transport]
  );

  // ── 清空槽位 ───────────────────────────────
  const clearSlot = useCallback(
    async (slotId: number) => {
      if (!transport) return;

      transport.onResponse((resp: MacroResponse) => {
        if (resp.type === "ok") {
          setSlots((prev) =>
            prev.map((s) =>
              s.id === slotId ? { ...s, steps: [], name: `宏 ${slotId + 1}` } : s
            )
          );
          setStatus(`✅ 宏 ${slotId + 1} 已清空`);
        }
      });

      await transport.send(encodeClearSlot(slotId));
    },
    [transport]
  );

  // ── 测试执行 ───────────────────────────────
  const execSlot = useCallback(
    async (slotId: number) => {
      if (!transport) return;

      transport.onResponse((resp: MacroResponse) => {
        if (resp.type === "ok") {
          setStatus(`▶ 宏 ${slotId + 1} 正在执行...`);
        }
      });

      await transport.send(encodeExecSlot(slotId));
    },
    [transport]
  );

  // ── 添加步骤（点击虚拟键盘） ────────────────
  const addTapStep = useCallback(
    (page: number, id: number) => {
      if (activeSlot.steps.length >= MACRO_MAX_STEPS) {
        setStatus(`⚠️ 已达最大步骤数 (${MACRO_MAX_STEPS})`);
        return;
      }
      const usage = hid_usage_from_page_and_id(page, id);
      const step: MacroStep = {
        type: MACRO_STEP_TAP,
        param1: usage,
        param2: 0,
        delayMs: 30,
      };
      setSlots((prev) =>
        prev.map((s) =>
          s.id === activeSlotId ? { ...s, steps: [...s.steps, step] } : s
        )
      );
    },
    [activeSlotId, activeSlot]
  );

  // ── 添加延迟步骤 ──────────────────────────
  const addDelayStep = useCallback(() => {
    if (activeSlot.steps.length >= MACRO_MAX_STEPS) return;
    const step: MacroStep = {
      type: MACRO_STEP_DELAY,
      param1: 100,
      param2: 0,
      delayMs: 0,
    };
    setSlots((prev) =>
      prev.map((s) =>
        s.id === activeSlotId ? { ...s, steps: [...s.steps, step] } : s
      )
    );
  }, [activeSlotId, activeSlot]);

  // ── 删除步骤 ──────────────────────────────
  const removeStep = useCallback(
    (index: number) => {
      setSlots((prev) =>
        prev.map((s) =>
          s.id === activeSlotId
            ? { ...s, steps: s.steps.filter((_, i) => i !== index) }
            : s
        )
      );
    },
    [activeSlotId]
  );

  // ── 修改步骤延迟 ──────────────────────────
  const updateStepDelay = useCallback(
    (index: number, delayMs: number) => {
      setSlots((prev) =>
        prev.map((s) =>
          s.id === activeSlotId
            ? {
                ...s,
                steps: s.steps.map((step, i) =>
                  i === index ? { ...step, delayMs } : step
                ),
              }
            : s
        )
      );
    },
    [activeSlotId]
  );

  // ── 修改延迟步骤的值 ──────────────────────
  const updateDelayValue = useCallback(
    (index: number, ms: number) => {
      setSlots((prev) =>
        prev.map((s) =>
          s.id === activeSlotId
            ? {
                ...s,
                steps: s.steps.map((step, i) =>
                  i === index ? { ...step, param1: ms } : step
                ),
              }
            : s
        )
      );
    },
    [activeSlotId]
  );

  // ── 修改槽位名称 ──────────────────────────
  const updateSlotName = useCallback(
    (name: string) => {
      setSlots((prev) =>
        prev.map((s) =>
          s.id === activeSlotId ? { ...s, name: name.slice(0, 32) } : s
        )
      );
    },
    [activeSlotId]
  );

  // ─── 虚拟键盘小按键样式 ────────────────────
  const miniBtn = (label: string, page: number, id: number) => (
    <button
      key={`${page}-${id}`}
      type="button"
      onClick={() => addTapStep(page, id)}
      className="px-1.5 py-1 text-[10px] bg-base-100 hover:bg-base-200 border border-base-300 rounded transition-colors active:scale-95 min-w-[28px]"
    >
      {label}
    </button>
  );

  if (!transport) {
    return (
      <div className="text-center py-8 text-base-content/50 text-sm">
        <p>请先连接键盘</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* 状态 + 刷新 */}
      {status && (
        <div className="text-xs px-2 py-1 rounded bg-base-200 text-base-content/70">
          {status}
        </div>
      )}

      {/* 槽位选择 */}
      <div className="flex gap-1 items-center">
        {slots.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSlotId(s.id)}
            className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
              s.id === activeSlotId
                ? "bg-primary text-primary-content border-primary font-semibold"
                : "bg-base-100 hover:bg-base-200 border-base-300"
            } ${s.steps.length > 0 ? "ring-1 ring-primary/30" : ""}`}
          >
            {s.name}
            {s.steps.length > 0 && (
              <span className="ml-1 text-[9px] opacity-60">
                ({s.steps.length})
              </span>
            )}
          </button>
        ))}

        <button
          onClick={fetchSlots}
          disabled={loading}
          className="ml-auto px-2 py-1 text-xs rounded bg-base-200 hover:bg-base-300 border border-base-300 transition-colors disabled:opacity-50"
        >
          <Download className="inline-block w-3 h-3 mr-1" />
          {loading ? "读取中..." : "从键盘读取"}
        </button>
      </div>

      {/* 当前槽位编辑区 */}
      <div className="grid grid-cols-[1fr_auto] gap-3">
        {/* 左：步骤列表 */}
        <div className="flex flex-col gap-1">
          {/* 名称编辑 */}
          <div className="flex items-center gap-2 mb-1">
            <input
              type="text"
              value={activeSlot.name}
              onChange={(e) => updateSlotName(e.target.value)}
              className="text-sm px-2 py-1 rounded border border-base-300 bg-base-100 w-40"
              maxLength={32}
              placeholder="宏名称"
            />
            <span className="text-[10px] text-base-content/40">
              {activeSlot.steps.length}/{MACRO_MAX_STEPS} 步
            </span>
          </div>

          {/* 步骤列表 */}
          <div className="flex flex-col gap-0.5 max-h-[180px] overflow-y-auto pr-1">
            {activeSlot.steps.length === 0 && (
              <div className="text-xs text-base-content/40 text-center py-4">
                点击下方键盘添加步骤
              </div>
            )}
            {activeSlot.steps.map((step, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-base-200 text-xs group"
              >
                <GripVertical className="w-3 h-3 text-base-content/20" />
                <span className="flex-1 font-mono text-[11px]">
                  {getStepLabel(step)}
                </span>
                {step.type !== MACRO_STEP_DELAY && (
                  <div className="flex items-center gap-0.5">
                    <Clock className="w-2.5 h-2.5 text-base-content/30" />
                    <input
                      type="number"
                      value={step.delayMs}
                      onChange={(e) =>
                        updateStepDelay(idx, parseInt(e.target.value) || 0)
                      }
                      className="w-12 text-[10px] px-1 py-0 rounded border border-base-300 bg-base-100"
                      min={0}
                      max={5000}
                    />
                    <span className="text-[9px] text-base-content/30">ms</span>
                  </div>
                )}
                {step.type === MACRO_STEP_DELAY && (
                  <div className="flex items-center gap-0.5">
                    <input
                      type="number"
                      value={step.param1}
                      onChange={(e) =>
                        updateDelayValue(idx, parseInt(e.target.value) || 0)
                      }
                      className="w-16 text-[10px] px-1 py-0 rounded border border-base-300 bg-base-100"
                      min={1}
                      max={10000}
                    />
                    <span className="text-[9px] text-base-content/30">ms</span>
                  </div>
                )}
                <button
                  onClick={() => removeStep(idx)}
                  className="opacity-0 group-hover:opacity-100 text-error hover:bg-error/20 rounded p-0.5 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-1 mt-1">
            <button
              onClick={addDelayStep}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-base-200 hover:bg-base-300 rounded border border-base-300"
            >
              <Clock className="w-3 h-3" />
              添加延迟
            </button>
            <div className="flex-1" />
            <button
              onClick={() => execSlot(activeSlotId)}
              disabled={activeSlot.steps.length === 0}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-base-200 hover:bg-base-300 rounded border border-base-300 disabled:opacity-30"
            >
              <Play className="w-3 h-3" />
              测试
            </button>
            <button
              onClick={() => clearSlot(activeSlotId)}
              disabled={activeSlot.steps.length === 0}
              className="flex items-center gap-1 px-2 py-1 text-xs text-error hover:bg-error/10 rounded border border-base-300 disabled:opacity-30"
            >
              <Trash2 className="w-3 h-3" />
              清空
            </button>
            <button
              onClick={() => saveSlot(activeSlot)}
              className="flex items-center gap-1 px-3 py-1 text-xs bg-primary text-primary-content rounded hover:opacity-80"
            >
              <Save className="w-3 h-3" />
              保存到键盘
            </button>
          </div>
        </div>

        {/* 右：迷你虚拟键盘 */}
        <div className="flex flex-col gap-0.5 border-l border-base-300 pl-3">
          <div className="text-[10px] text-base-content/40 mb-0.5 flex items-center gap-1">
            <Keyboard className="w-3 h-3" />
            点击添加按键步骤
          </div>
          <div className="flex gap-px">
            {ROW_ALPHA_TOP.map((k) => miniBtn(k.label, k.page, k.id))}
          </div>
          <div className="flex gap-px pl-2">
            {ROW_ALPHA_MID.map((k) => miniBtn(k.label, k.page, k.id))}
          </div>
          <div className="flex gap-px pl-4">
            {ROW_ALPHA_BOT.map((k) => miniBtn(k.label, k.page, k.id))}
          </div>
          <div className="flex gap-px mt-0.5 flex-wrap">
            {COMMON_KEYS.map((k) => miniBtn(k.label, k.page, k.id))}
          </div>
          <div className="flex gap-px mt-0.5 flex-wrap">
            {MOD_KEYS.map((k) => miniBtn(k.label, k.page, k.id))}
          </div>
          <div className="flex gap-px mt-0.5 flex-wrap">
            {[
              { label: "1", page: 7, id: 0x1e },
              { label: "2", page: 7, id: 0x1f },
              { label: "3", page: 7, id: 0x20 },
              { label: "4", page: 7, id: 0x21 },
              { label: "5", page: 7, id: 0x22 },
              { label: "6", page: 7, id: 0x23 },
              { label: "7", page: 7, id: 0x24 },
              { label: "8", page: 7, id: 0x25 },
              { label: "9", page: 7, id: 0x26 },
              { label: "0", page: 7, id: 0x27 },
            ].map((k) => miniBtn(k.label, k.page, k.id))}
          </div>
        </div>
      </div>
    </div>
  );
};
