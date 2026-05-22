import { useCallback, useEffect, useMemo, useState } from "react";

import type { RpcTransport } from "@zmkfirmware/zmk-studio-ts-client/transport/index";
import { UserCancelledError } from "@zmkfirmware/zmk-studio-ts-client/transport/errors";
import type { AvailableDevice } from "./tauri/index";
import { Bluetooth, RefreshCw, Usb } from "lucide-react";
import { Key, ListBox, ListBoxItem, Selection } from "react-aria-components";
import { useModalRef } from "./misc/useModalRef";
import { ExternalLink } from "./misc/ExternalLink";
import { GenericModal } from "./GenericModal";

export type TransportFactory = {
  label: string;
  isWireless?: boolean;
  connect?: () => Promise<RpcTransport>;
  pick_and_connect?: {
    list: () => Promise<Array<AvailableDevice>>;
    connect: (dev: AvailableDevice) => Promise<RpcTransport>;
  };
};

export interface ConnectModalProps {
  open?: boolean;
  transports: TransportFactory[];
  onTransportCreated: (t: RpcTransport) => void;
}

function deviceList(
  open: boolean,
  transports: TransportFactory[],
  onTransportCreated: (t: RpcTransport) => void
) {
  const [devices, setDevices] = useState<
    Array<[TransportFactory, AvailableDevice]>
  >([]);
  const [selectedDev, setSelectedDev] = useState(new Set<Key>());
  const [refreshing, setRefreshing] = useState(false);

  async function LoadEm() {
    setRefreshing(true);
    let entries: Array<[TransportFactory, AvailableDevice]> = [];
    for (const t of transports.filter((t) => t.pick_and_connect)) {
      const devices = await t.pick_and_connect?.list();
      if (!devices) {
        continue;
      }

      entries.push(
        ...devices.map<[TransportFactory, AvailableDevice]>((d) => {
          return [t, d];
        })
      );
    }

    setDevices(entries);
    setRefreshing(false);
  }

  useEffect(() => {
    setSelectedDev(new Set());
    setDevices([]);
    LoadEm();
  }, [transports, open, setDevices]);

  const onRefresh = useCallback(() => {
    setSelectedDev(new Set());
    setDevices([]);
    LoadEm();
  }, [setDevices]);

  const onSelect = useCallback(
    async (keys: Selection) => {
      if (keys === "all") {
        return;
      }
      const dev = devices.find(([_t, d]) => keys.has(d.id));
      if (dev) {
        dev[0]
          .pick_and_connect!.connect(dev[1])
          .then(onTransportCreated)
          .catch((e) => alert(e));
      }
    },
    [devices, onTransportCreated]
  );

  return (
    <div className="panel-enter">
      <div className="grid grid-cols-[1fr_auto] items-center mb-3">
        <label className="text-sm font-medium text-base-content/60">可用设备</label>
        <button
          className="p-2 rounded-xl hover:bg-base-content/5 disabled:opacity-40 transition-all duration-200 active:scale-90"
          disabled={refreshing}
          onClick={onRefresh}
          title="刷新设备列表"
        >
          <RefreshCw
            className={`size-4 ${refreshing ? "animate-spin" : ""}`}
          />
        </button>
      </div>
      <ListBox
        aria-label="设备列表"
        items={devices}
        onSelectionChange={onSelect}
        selectionMode="single"
        selectedKeys={selectedDev}
        className="flex flex-col gap-1.5"
      >
        {([t, d]) => (
          <ListBoxItem
            className="grid grid-cols-[1.5em_1fr] items-center rounded-xl glass-light hover:bg-base-content/5 cursor-pointer px-4 py-3 transition-all duration-200 outline-none focus:ring-2 focus:ring-primary/30"
            id={d.id}
            aria-label={d.label}
          >
            {t.isWireless ? (
              <Bluetooth className="w-4 text-primary" />
            ) : (
              <Usb className="w-4 text-base-content/40" />
            )}
            <span className="col-start-2 text-sm font-medium">{d.label}</span>
          </ListBoxItem>
        )}
      </ListBox>
      {devices.length === 0 && !refreshing && (
        <p className="text-sm text-base-content/30 text-center py-6">
          未发现设备，请检查连接后点击刷新
        </p>
      )}
      {refreshing && (
        <div className="flex items-center justify-center gap-2 py-6">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-soft" />
          <p className="text-sm text-base-content/30">正在搜索设备...</p>
        </div>
      )}
    </div>
  );
}

function simpleDevicePicker(
  transports: TransportFactory[],
  onTransportCreated: (t: RpcTransport) => void
) {
  const [availableDevices, setAvailableDevices] = useState<
    AvailableDevice[] | undefined
  >(undefined);
  const [selectedTransport, setSelectedTransport] = useState<
    TransportFactory | undefined
  >(undefined);

  useEffect(() => {
    if (!selectedTransport) {
      setAvailableDevices(undefined);
      return;
    }

    let ignore = false;

    if (selectedTransport.connect) {
      async function connectTransport() {
        try {
          const transport = await selectedTransport?.connect?.();

          if (!ignore) {
            if (transport) {
              onTransportCreated(transport);
            }
            setSelectedTransport(undefined);
          }
        } catch (e) {
          if (!ignore) {
            console.error(e);
            if (e instanceof Error && !(e instanceof UserCancelledError)) {
              alert(e.message);
            }
            setSelectedTransport(undefined);
          }
        }
      }

      connectTransport();
    } else {
      async function loadAvailableDevices() {
        const devices = await selectedTransport?.pick_and_connect?.list();

        if (!ignore) {
          setAvailableDevices(devices);
        }
      }

      loadAvailableDevices();
    }

    return () => {
      ignore = true;
    };
  }, [selectedTransport]);

  let connections = transports.map((t) => (
    <li key={t.label} className="list-none flex-1">
      <button
        className="
          btn-apple w-full flex flex-col items-center gap-3
          glass rounded-2xl px-4 py-5
          hover:bg-primary hover:text-primary-content
          transition-all duration-300
          hover:shadow-apple-lg hover:scale-[1.03]
          active:scale-[0.97]
        "
        type="button"
        onClick={async () => setSelectedTransport(t)}
      >
        {t.label === "USB" || t.label === "USB 有线" ? (
          <div className="w-12 h-12 rounded-xl bg-base-content/5 flex items-center justify-center">
            <Usb className="w-6 h-6" />
          </div>
        ) : (
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Bluetooth className="w-6 h-6 text-primary" />
          </div>
        )}
        <span className="text-sm font-medium">
          {t.label === "USB"
            ? "USB 有线"
            : t.label === "BLE"
              ? "蓝牙"
              : t.label}
        </span>
      </button>
    </li>
  ));

  return (
    <div className="panel-enter">
      <p className="text-sm text-base-content/40 mb-4 font-medium">选择连接方式</p>
      <ul className="flex gap-3">{connections}</ul>
      {selectedTransport && availableDevices && (
        <ul className="mt-4 flex flex-col gap-1.5">
          {availableDevices.map((d) => (
            <li
              key={d.id}
              className="rounded-xl glass-light hover:bg-base-content/5 cursor-pointer px-4 py-3 transition-all duration-200 text-sm font-medium"
              onClick={async () => {
                onTransportCreated(
                  await selectedTransport!.pick_and_connect!.connect(d)
                );
                setSelectedTransport(undefined);
              }}
            >
              {d.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function noTransportsOptionsPrompt() {
  return (
    <div className="flex flex-col gap-4 panel-enter">
      <div className="glass rounded-xl p-4">
        <p className="text-sm leading-relaxed text-base-content/60">
          当前浏览器不支持所需功能。改键器需要{" "}
          <ExternalLink
            href="https://caniuse.com/web-serial"
            className="text-primary hover:underline underline-offset-2"
          >
            Web Serial
          </ExternalLink>{" "}
          或{" "}
          <ExternalLink
            href="https://caniuse.com/web-bluetooth"
            className="text-primary hover:underline underline-offset-2"
          >
            Web Bluetooth
          </ExternalLink>{" "}
          （仅 Linux）来连接设备。
        </p>
      </div>

      <div className="text-sm">
        <p className="font-medium mb-2 text-base-content/70">解决方案：</p>
        <ul className="list-disc list-inside space-y-1.5 text-base-content/50">
          <li>使用 Chrome 或 Edge 浏览器</li>
          <li>
            下载{" "}
            <ExternalLink
              href="/download"
              className="text-primary hover:underline underline-offset-2"
            >
              桌面客户端
            </ExternalLink>
          </li>
        </ul>
      </div>
    </div>
  );
}

function connectOptions(
  transports: TransportFactory[],
  onTransportCreated: (t: RpcTransport) => void,
  open?: boolean
) {
  const useSimplePicker = useMemo(
    () => transports.every((t) => !t.pick_and_connect),
    [transports]
  );

  return useSimplePicker
    ? simpleDevicePicker(transports, onTransportCreated)
    : deviceList(open || false, transports, onTransportCreated);
}

export const ConnectModal = ({
  open,
  transports,
  onTransportCreated,
}: ConnectModalProps) => {
  const dialog = useModalRef(open || false, false, false);

  const haveTransports = useMemo(() => transports.length > 0, [transports]);

  return (
    <GenericModal ref={dialog} className="max-w-md w-[90vw]">
      <div className="flex flex-col gap-5">
        {/* 头部 */}
        <div className="text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-3xl mb-3">
            ⌨️
          </div>
          <h1 className="text-xl font-semibold text-base-content">ARC 改键器</h1>
          <p className="text-xs text-base-content/35 mt-1.5">连接键盘，实时改键</p>
        </div>

        {/* 分割线 */}
        <div className="h-px bg-base-content/5" />

        {/* 连接选项 */}
        {haveTransports
          ? connectOptions(transports, onTransportCreated, open)
          : noTransportsOptionsPrompt()}
      </div>
    </GenericModal>
  );
};
