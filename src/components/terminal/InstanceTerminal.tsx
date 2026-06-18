import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

export function InstanceTerminal({ instanceId }: { instanceId: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const term = new Terminal({
      theme: { background: "#0a0c10", foreground: "#e2e8f0", cursor: "#22d3ee" },
      fontFamily: "JetBrains Mono, monospace",
      fontSize: 13,
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(ref.current);
    fit.fit();

    const connect = () => {
      const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
      const ws = new WebSocket(`${proto}//${window.location.host}/api/v1/instances/${instanceId}/terminal`);
      wsRef.current = ws;
      ws.onmessage = (ev) => term.write(typeof ev.data === "string" ? ev.data : "");
      ws.onopen = () => term.writeln("\r\nConnected.\r\n");
      ws.onclose = () => term.writeln("\r\n[disconnected — press R to reconnect]\r\n");
      term.onData((data) => {
        if (ws.readyState === WebSocket.OPEN) ws.send(data);
      });
    };
    connect();

    term.onKey(({ domEvent }) => {
      if (domEvent.key === "r" && domEvent.ctrlKey) {
        wsRef.current?.close();
        connect();
      }
    });

    const onResize = () => fit.fit();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      wsRef.current?.close();
      term.dispose();
    };
  }, [instanceId]);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-[#0a0c10] p-2">
      <p className="mb-2 text-xs text-muted">Ctrl+R reconnect · select text to copy</p>
      <div ref={ref} className="h-[420px] w-full" />
    </div>
  );
}
