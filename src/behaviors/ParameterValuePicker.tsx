import { BehaviorParameterValueDescription } from "@zmkfirmware/zmk-studio-ts-client/behaviors";
import { HidUsagePicker } from "./HidUsagePicker";

const PARAM_NAME_ZH: Record<string, string> = {
  "Next Profile": "下一配置", "Previous Profile": "上一配置",
  "Select Profile": "选择配置", "Clear All Profiles": "清除所有配对",
  "Clear Selected Profile": "清除当前配对", "Disconnect Profile": "断开蓝牙",
  "Toggle On/Off": "开/关", "Turn On": "开启", "Turn Off": "关闭",
  "Hue Up": "色相+", "Hue Down": "色相-",
  "Saturation Up": "饱和度+", "Saturation Down": "饱和度-",
  "Brightness Up": "亮度+", "Brightness Down": "亮度-",
  "Speed Up": "速度+", "Speed Down": "速度-",
  "Next Effect": "下一灯效", "Previous Effect": "上一灯效",
  "Profile": "配置编号", "USB": "USB", "BLE": "蓝牙",
};

function translateParamName(name: string): string {
  if (PARAM_NAME_ZH[name]) return PARAM_NAME_ZH[name];
  for (const [en, zh] of Object.entries(PARAM_NAME_ZH)) {
    if (name.toLowerCase().includes(en.toLowerCase())) return zh;
  }
  return name;
}

export interface ParameterValuePickerProps {
  value?: number;
  values: BehaviorParameterValueDescription[];
  layers: { id: number; name: string }[];
  onValueChanged: (value?: number) => void;
}

export const ParameterValuePicker = ({
  value, values, layers, onValueChanged,
}: ParameterValuePickerProps) => {
  if (values.length == 0) {
    return <></>;
  } else if (values.every((v) => v.constant !== undefined)) {
    // ── 全部是常量 → 单行按钮 ──
    return (
      <div className="flex flex-wrap gap-1.5 justify-center">
        {values.map((v) => {
          const isActive = value === v.constant;
          const zhName = translateParamName(v.name);
          return (
            <button
              key={v.constant}
              onClick={() => onValueChanged(v.constant)}
              className={`inline-flex items-center gap-1 rounded-lg text-[11px] px-3 py-1.5 cursor-pointer whitespace-nowrap ${
                isActive
                  ? "bg-primary text-white font-semibold shadow-[0_2px_6px_rgba(0,122,255,0.25)]"
                  : "glass-light text-base-content/55 hover:text-base-content/80"
              }`}
            >
              {zhName}
            </button>
          );
        })}
      </div>
    );
  } else if (values.length == 1) {
    if (values[0].range) {
      // ── 数字范围 → 内联输入 ──
      return (
        <div className="inline-flex items-center gap-1.5">
          <label className="text-[11px] text-base-content/45 font-medium">{translateParamName(values[0].name)}:</label>
          <input
            type="number"
            min={values[0].range.min}
            max={values[0].range.max}
            value={value}
            className="h-7 w-14 rounded-lg glass border-0 px-2 text-[11px] outline-none focus:ring-2 focus:ring-primary/30 text-center font-medium text-base-content/70"
            onChange={(e) => onValueChanged(parseInt(e.target.value))}
          />
        </div>
      );
    } else if (values[0].hidUsage) {
      return (
        <HidUsagePicker
          onValueChanged={onValueChanged}
          label={translateParamName(values[0].name)}
          value={value}
          usagePages={[
            { id: 7, min: 4, max: values[0].hidUsage.keyboardMax },
            { id: 12, max: values[0].hidUsage.consumerMax },
          ]}
        />
      );
    } else if (values[0].layerId) {
      return (
        <div className="inline-flex items-center gap-1.5">
          <label className="text-[11px] text-base-content/45 font-medium">{translateParamName(values[0].name)}:</label>
          <select
            value={value}
            className="h-7 rounded-lg glass border-0 px-2 text-[11px] outline-none focus:ring-2 focus:ring-primary/30 font-medium text-base-content/70 appearance-none"
            onChange={(e) => onValueChanged(parseInt(e.target.value))}
          >
            {layers.map(({ name, id }) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
        </div>
      );
    }
  } else {
    console.log("Not sure how to handle", values);
    return <p className="text-[11px] text-base-content/30">复合参数</p>;
  }
  return <></>;
};
