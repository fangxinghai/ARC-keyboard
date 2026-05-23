import { BehaviorParameterValueDescription } from "@zmkfirmware/zmk-studio-ts-client/behaviors";
import { HidUsagePicker } from "./HidUsagePicker";

const ZH: Record<string, string> = {
  "Next Profile": "下一配置", "Previous Profile": "上一配置",
  "Select Profile": "选择配置", "Clear All Profiles": "清除所有配对",
  "Clear Selected Profile": "清除当前配对", "Disconnect Profile": "断开蓝牙",
  "Toggle On/Off": "开/关", "Turn On": "开启", "Turn Off": "关闭",
  "Hue Up": "色相+", "Hue Down": "色相-",
  "Saturation Up": "饱和度+", "Saturation Down": "饱和度-",
  "Brightness Up": "亮度+", "Brightness Down": "亮度-",
  "Speed Up": "速度+", "Speed Down": "速度-",
  "Next Effect": "下一灯效", "Previous Effect": "上一灯效",
  "Profile": "配置", "USB": "USB", "BLE": "蓝牙",
};

function tr(n: string): string {
  if (ZH[n]) return ZH[n];
  for (const [en, zh] of Object.entries(ZH)) { if (n.toLowerCase().includes(en.toLowerCase())) return zh; }
  return n;
}

export interface ParameterValuePickerProps {
  value?: number;
  values: BehaviorParameterValueDescription[];
  layers: { id: number; name: string }[];
  onValueChanged: (value?: number) => void;
}

export const ParameterValuePicker = ({ value, values, layers, onValueChanged }: ParameterValuePickerProps) => {
  if (values.length == 0) return <></>;

  if (values.every((v) => v.constant !== undefined)) {
    return (
      <div className="inline-flex flex-wrap gap-1 items-center">
        {values.map((v) => (
          <button key={v.constant} onClick={() => onValueChanged(v.constant)}
            className={`inline-flex items-center rounded-lg text-[11px] px-2.5 py-1 cursor-pointer whitespace-nowrap ${
              value === v.constant ? "bg-primary text-white font-semibold" : "glass-light text-base-content/50 hover:text-base-content/75"
            }`}>
            {tr(v.name)}
          </button>
        ))}
      </div>
    );
  }

  if (values.length == 1) {
    const v = values[0];
    if (v.range) {
      return (
        <div className="inline-flex items-center gap-1">
          <label className="text-[11px] text-base-content/40">{tr(v.name)}</label>
          <input type="number" min={v.range.min} max={v.range.max} value={value}
            className="h-6 w-12 rounded-md glass border-0 px-1 text-[11px] outline-none text-center font-medium text-base-content/70"
            onChange={(e) => onValueChanged(parseInt(e.target.value))} />
        </div>
      );
    }
    if (v.hidUsage) {
      return <HidUsagePicker onValueChanged={onValueChanged} label={tr(v.name)} value={value}
        usagePages={[{ id: 7, min: 4, max: v.hidUsage.keyboardMax }, { id: 12, max: v.hidUsage.consumerMax }]} />;
    }
    if (v.layerId) {
      return (
        <div className="inline-flex items-center gap-1">
          <label className="text-[11px] text-base-content/40">{tr(v.name)}</label>
          <select value={value} className="h-6 rounded-md glass border-0 px-1 text-[11px] outline-none font-medium text-base-content/70 appearance-none"
            onChange={(e) => onValueChanged(parseInt(e.target.value))}>
            {layers.map(({ name, id }) => (<option key={id} value={id}>{name}</option>))}
          </select>
        </div>
      );
    }
  }

  return <p className="text-[10px] text-base-content/25">复合参数</p>;
};
