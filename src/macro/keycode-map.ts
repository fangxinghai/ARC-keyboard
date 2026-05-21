/**
 * 浏览器 KeyboardEvent.code → HID Usage ID 映射
 * 用于宏录制时将用户的真实键盘输入转换为 HID usage
 */

import { hid_usage_from_page_and_id } from "../hid-usages";

// code → [page, id]
const CODE_TO_HID: Record<string, [number, number]> = {
  // 字母
  KeyA: [7, 0x04], KeyB: [7, 0x05], KeyC: [7, 0x06], KeyD: [7, 0x07],
  KeyE: [7, 0x08], KeyF: [7, 0x09], KeyG: [7, 0x0a], KeyH: [7, 0x0b],
  KeyI: [7, 0x0c], KeyJ: [7, 0x0d], KeyK: [7, 0x0e], KeyL: [7, 0x0f],
  KeyM: [7, 0x10], KeyN: [7, 0x11], KeyO: [7, 0x12], KeyP: [7, 0x13],
  KeyQ: [7, 0x14], KeyR: [7, 0x15], KeyS: [7, 0x16], KeyT: [7, 0x17],
  KeyU: [7, 0x18], KeyV: [7, 0x19], KeyW: [7, 0x1a], KeyX: [7, 0x1b],
  KeyY: [7, 0x1c], KeyZ: [7, 0x1d],
  // 数字
  Digit1: [7, 0x1e], Digit2: [7, 0x1f], Digit3: [7, 0x20], Digit4: [7, 0x21],
  Digit5: [7, 0x22], Digit6: [7, 0x23], Digit7: [7, 0x24], Digit8: [7, 0x25],
  Digit9: [7, 0x26], Digit0: [7, 0x27],
  // 功能键
  Enter: [7, 0x28], Escape: [7, 0x29], Backspace: [7, 0x2a], Tab: [7, 0x2b],
  Space: [7, 0x2c], Minus: [7, 0x2d], Equal: [7, 0x2e],
  BracketLeft: [7, 0x2f], BracketRight: [7, 0x30], Backslash: [7, 0x31],
  Semicolon: [7, 0x33], Quote: [7, 0x34], Backquote: [7, 0x35],
  Comma: [7, 0x36], Period: [7, 0x37], Slash: [7, 0x38],
  CapsLock: [7, 0x39],
  // F键
  F1: [7, 0x3a], F2: [7, 0x3b], F3: [7, 0x3c], F4: [7, 0x3d],
  F5: [7, 0x3e], F6: [7, 0x3f], F7: [7, 0x40], F8: [7, 0x41],
  F9: [7, 0x42], F10: [7, 0x43], F11: [7, 0x44], F12: [7, 0x45],
  // 控制键
  PrintScreen: [7, 0x46], ScrollLock: [7, 0x47], Pause: [7, 0x48],
  Insert: [7, 0x49], Home: [7, 0x4a], PageUp: [7, 0x4b],
  Delete: [7, 0x4c], End: [7, 0x4d], PageDown: [7, 0x4e],
  ArrowRight: [7, 0x4f], ArrowLeft: [7, 0x50],
  ArrowDown: [7, 0x51], ArrowUp: [7, 0x52],
  // 修饰键
  ControlLeft: [7, 0xe0], ShiftLeft: [7, 0xe1], AltLeft: [7, 0xe2],
  MetaLeft: [7, 0xe3], ControlRight: [7, 0xe4], ShiftRight: [7, 0xe5],
  AltRight: [7, 0xe6], MetaRight: [7, 0xe7],
  // 小键盘
  NumLock: [7, 0x53], NumpadDivide: [7, 0x54], NumpadMultiply: [7, 0x55],
  NumpadSubtract: [7, 0x56], NumpadAdd: [7, 0x57], NumpadEnter: [7, 0x58],
  Numpad1: [7, 0x59], Numpad2: [7, 0x5a], Numpad3: [7, 0x5b],
  Numpad4: [7, 0x5c], Numpad5: [7, 0x5d], Numpad6: [7, 0x5e],
  Numpad7: [7, 0x5f], Numpad8: [7, 0x60], Numpad9: [7, 0x61],
  Numpad0: [7, 0x62], NumpadDecimal: [7, 0x63],
  // 其他
  ContextMenu: [7, 0x65],
};

/**
 * 将 KeyboardEvent.code 转换为 HID usage 值
 * @returns HID usage (page << 16 | id) 或 null（无法映射时）
 */
export function codeToHidUsage(code: string): number | null {
  const entry = CODE_TO_HID[code];
  if (!entry) return null;
  return hid_usage_from_page_and_id(entry[0], entry[1]);
}

/**
 * 从 KeyboardEvent 提取修饰键 flags（ZMK 格式）
 */
export function eventToModFlags(e: KeyboardEvent): number {
  let flags = 0;
  if (e.ctrlKey) flags |= 0x01;
  if (e.shiftKey) flags |= 0x02;
  if (e.altKey) flags |= 0x04;
  if (e.metaKey) flags |= 0x08;
  return flags;
}

/**
 * 判断一个 KeyboardEvent.code 是否是修饰键
 */
export function isModifierCode(code: string): boolean {
  return [
    "ControlLeft", "ControlRight",
    "ShiftLeft", "ShiftRight",
    "AltLeft", "AltRight",
    "MetaLeft", "MetaRight",
  ].includes(code);
}
