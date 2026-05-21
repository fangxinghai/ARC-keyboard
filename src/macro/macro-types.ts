// ─── 宏步骤类型 ───────────────────────────────
export const MACRO_STEP_KEY_PRESS = 0x01;
export const MACRO_STEP_KEY_RELEASE = 0x02;
export const MACRO_STEP_DELAY = 0x03;
export const MACRO_STEP_TAP = 0x04;

export interface MacroStep {
  type: number;
  param1: number;
  param2: number;
  delayMs: number;
}

export interface MacroSlot {
  id: number;
  name: string;
  steps: MacroStep[];
}

// ─── 命令 ID ──────────────────────────────────
export const MACRO_CMD_GET_SLOTS = 0x01;
export const MACRO_CMD_SET_SLOT = 0x02;
export const MACRO_CMD_CLEAR_SLOT = 0x03;
export const MACRO_CMD_EXEC_SLOT = 0x04;

// ─── 响应 ID ──────────────────────────────────
export const MACRO_RESP_SLOTS_DATA = 0x81;
export const MACRO_RESP_OK = 0x82;
export const MACRO_RESP_ERROR = 0x83;

// ─── 错误码 ───────────────────────────────────
export const MACRO_ERR_SLOT_FULL = 0x01;
export const MACRO_ERR_DATA_TOO_BIG = 0x02;
export const MACRO_ERR_INVALID_PARAM = 0x03;

// ─── 常量 ─────────────────────────────────────
export const MACRO_MAX_SLOTS = 6;
export const MACRO_MAX_STEPS = 64;
export const MACRO_MAX_NAME_LEN = 32;
export const MACRO_PROTOCOL_MARKER = 0xff;
