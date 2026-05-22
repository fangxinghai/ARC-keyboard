function noTransportsOptionsPrompt() {
  return (
    <div className="flex flex-col gap-4 panel-enter">
      <div className="glass rounded-xl p-4">
        <p className="text-sm leading-relaxed text-base-content/60">
          当前浏览器不支持所需功能。改键器需要{" "}
          <span className="text-primary hover:underline underline-offset-2">
            <ExternalLink href="https://caniuse.com/web-serial">
              Web Serial
            </ExternalLink>
          </span>{" "}
          或{" "}
          <span className="text-primary hover:underline underline-offset-2">
            <ExternalLink href="https://caniuse.com/web-bluetooth">
              Web Bluetooth
            </ExternalLink>
          </span>{" "}
          （仅 Linux）来连接设备。
        </p>
      </div>

      <div className="text-sm">
        <p className="font-medium mb-2 text-base-content/70">解决方案：</p>
        <ul className="list-disc list-inside space-y-1.5 text-base-content/50">
          <li>使用 Chrome 或 Edge 浏览器</li>
          <li>
            下载{" "}
            <span className="text-primary hover:underline underline-offset-2">
              <ExternalLink href="/download">桌面客户端</ExternalLink>
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
