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
    <div>
      <div className="grid grid-cols-[1fr_auto] items-center mb-2">
        <label className="text-sm font-medium opacity-70">可用设备</label>
        <button
          className="p-1.5 rounded-lg hover:bg-base-300 disabled:opacity-50 transition-colors"
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
        className="flex flex-col gap-1"
      >
        {([t, d]) => (
          <ListBoxItem
            className="grid grid-cols-[1.5em_1fr] items-center rounded-lg hover:bg-base-300 cursor-pointer px-3 py-2 transition-colors"
            id={d.id}
            aria-label={d.label}
          >
            {t.isWireless ? (
              <Bluetooth className="w-4 text-blue-400" />
            ) : (
              <Usb className="w-4 opacity-50" />
            )}
            <span className="col-start-2 text-sm">{d.label}</span>
          </ListBoxItem>
        )}
      </ListBox>
      {devices.length === 0 && !refreshing && (
        <p className="text-sm opacity-40 text-center py-4">未发现设备，请检查连接后点击刷新</p>
      )}
      {refreshing && (
        <p className="text-sm opacity-40 text-center py-4">正在搜索设备...</p>
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
        className="w-full flex flex-col items-center gap-2 bg-base-200 hover:bg-primary hover:text-primary-content rounded-xl px-4 py-4 transition-all duration-200 hover:scale-105 hover:shadow-lg"
        type="button"
        onClick={async () => setSelectedTransport(t)}
      >
        {t.label === "USB" || t.label === "USB 有线" ? (
          <Usb className="w-6 h-6" />
        ) : (
          <Bluetooth className="w-6 h-6" />
        )}
        <span className="text-sm font-medium">
          {t.label === "USB" ? "USB 有线" : t.label === "BLE" ? "蓝牙" : t.label}
        </span>
      </button>
    </li>
  ));

  return (
    <div>
      <p className="text-sm opacity-60 mb-3">选择连接方式</p>
      <ul className="flex gap-3">{connections}</ul>
      {selectedTransport && availableDevices && (
        <ul className="mt-3">
          {availableDevices.map((d) => (
            <li
              key={d.id}
              className="rounded-lg hover:bg-base-300 cursor-pointer px-3 py-2 transition-colors"
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
    <div className="flex flex-col gap-3">
      <div className="bg-base-200 rounded-lg p-4">
        <p className="text-sm leading-relaxed">
          当前浏览器不支持所需功能。改键器需要{" "}
          <ExternalLink href="https://caniuse.com/web-serial">
            Web Serial
          </ExternalLink>{" "}
          或{" "}
          <ExternalLink href="https://caniuse.com/web-bluetooth">
            Web Bluetooth
          </ExternalLink>{" "}
          （仅 Linux）来连接设备。
        </p>
      </div>

      <div className="text-sm">
        <p className="font-medium mb-1">解决方案：</p>
        <ul className="list-disc list-inside space-y-1 opacity-70">
          <li>使用 Chrome 或 Edge 浏览器</li>
          <li>
            下载{" "}
            <ExternalLink href="/download">
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
    <GenericModal ref={dialog} className="max-w-md">
      <div className="flex flex-col gap-4">
        <div className="text-center">
          <div className="text-3xl mb-2">⌨️</div>
          <h1 className="text-xl font-bold">ARC 改键器</h1>
          <p className="text-xs opacity-50 mt-1">连接键盘，实时改键</p>
        </div>
        <div className="border-t border-base-300 pt-4">
          {haveTransports
            ? connectOptions(transports, onTransportCreated, open)
            : noTransportsOptionsPrompt()}
        </div>
      </div>
    </GenericModal>
  );
};
