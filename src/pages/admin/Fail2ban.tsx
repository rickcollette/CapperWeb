import { useEffect, useState } from "react";
import {
  useFail2banStatus,
  useFail2banBan,
  useFail2banUnban,
  useFail2banUnbanAll,
  useFail2banFlush,
  useFail2banReload,
  useFail2banBlocklist,
  useFail2banAddBlocklist,
  useFail2banRemoveBlocklist,
  useFail2banAllowlist,
  useFail2banSetAllowlist,
} from "@/api/hostsec";
import { Button, Card, EmptyState, PageHeader } from "@/components/common/ui";

function Blocklist({ jails }: { jails: string[] }) {
  const { data: entries = [] } = useFail2banBlocklist();
  const add = useFail2banAddBlocklist();
  const remove = useFail2banRemoveBlocklist();
  const [form, setForm] = useState({ jail: "", ip: "", reason: "" });
  return (
    <Card className="mb-6">
      <h3 className="mb-1 text-sm font-medium">Persistent blocklist</h3>
      <p className="mb-3 text-xs text-muted">Always-on bans re-applied automatically if fail2ban restarts or drops them.</p>
      <form className="mb-3 flex flex-wrap items-end gap-2"
        onSubmit={(e) => { e.preventDefault(); add.mutate(form, { onSuccess: () => setForm((f) => ({ ...f, ip: "", reason: "" })) }); }}>
        <select value={form.jail} onChange={(e) => setForm((f) => ({ ...f, jail: e.target.value }))}
          className="rounded-lg border border-border bg-background px-2 py-2 text-sm" required>
          <option value="">Jail…</option>
          {jails.map((j) => <option key={j} value={j}>{j}</option>)}
        </select>
        <input value={form.ip} onChange={(e) => setForm((f) => ({ ...f, ip: e.target.value }))}
          placeholder="IP" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" required />
        <input value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
          placeholder="Reason (optional)" className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        <Button type="submit" variant="danger" disabled={add.isPending}>Add</Button>
      </form>
      {!entries.length ? (
        <div className="text-xs text-muted">No persistent bans.</div>
      ) : (
        <table className="w-full text-sm">
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className="border-t border-border/40">
                <td className="py-1.5 font-mono">{e.ip}</td>
                <td className="py-1.5 text-muted">{e.jail}</td>
                <td className="py-1.5 text-muted">{e.reason || "—"}</td>
                <td className="py-1.5 text-right">
                  <Button size="sm" disabled={remove.isPending} onClick={() => remove.mutate(e.id)}>Remove</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}

function Allowlist() {
  const { data } = useFail2banAllowlist();
  const save = useFail2banSetAllowlist();
  const [text, setText] = useState("");
  useEffect(() => { if (data?.ips) setText(data.ips.join("\n")); }, [data]);
  return (
    <Card className="mb-6">
      <h3 className="mb-1 text-sm font-medium">Allowlist (ignoreip)</h3>
      <p className="mb-3 text-xs text-muted">IPs/CIDRs fail2ban will never ban. Loopback is always allowed. One per line.</p>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4}
        placeholder="203.0.113.0/24" className="mb-2 w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm" />
      <Button variant="primary" disabled={save.isPending}
        onClick={() => save.mutate(text.split("\n").map((s) => s.trim()).filter(Boolean))}>
        Save allowlist
      </Button>
    </Card>
  );
}

// Fail2ban manages the host's fail2ban jails: status, banned IPs, and manual
// ban/unban. Host OS only — driven by the exclusive server-side worker.
export function Fail2ban() {
  const { data: status, isLoading, error } = useFail2banStatus();
  const ban = useFail2banBan();
  const unban = useFail2banUnban();
  const unbanAll = useFail2banUnbanAll();
  const flush = useFail2banFlush();
  const reload = useFail2banReload();
  const [form, setForm] = useState({ jail: "", ip: "" });
  const [err, setErr] = useState<string | null>(null);

  function submitBan(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    ban.mutate(
      { jail: form.jail, ip: form.ip },
      { onSuccess: () => setForm((f) => ({ ...f, ip: "" })), onError: (e: unknown) => setErr(e instanceof Error ? e.message : "ban failed") },
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Fail2ban" description="Host intrusion-prevention jails." />
        <EmptyState title="fail2ban unavailable" description="fail2ban-client could not be run on this host." />
      </div>
    );
  }

  const jails = status?.jails ?? [];
  const banned = status?.banned ?? [];

  return (
    <div>
      <PageHeader title="Fail2ban" description="Host intrusion-prevention jails and system-wide bans. Applies to the host OS only." />

      {isLoading ? (
        <EmptyState title="Loading…" />
      ) : status && !status.available ? (
        <EmptyState title="fail2ban not installed" description="Install and enable fail2ban on the host to manage jails here." />
      ) : (
        <>
          <Card className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm">
              <span className={`rounded px-2 py-0.5 text-xs ${status?.running ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>
                {status?.running ? "running" : "stopped"}
              </span>
              {status?.version && <span className="text-xs text-muted">fail2ban {status.version}</span>}
              <span className="text-xs text-muted">· {jails.length} jail(s) · {status?.totalBanned ?? 0} banned IP(s)</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" disabled={reload.isPending} onClick={() => reload.mutate(undefined)}>Reload</Button>
              <Button size="sm" variant="danger" disabled={flush.isPending}
                onClick={() => { if (confirm("Unban every IP from every jail?")) flush.mutate(); }}>
                Flush all bans
              </Button>
            </div>
          </Card>

          <Card className="mb-6 p-0">
            <div className="border-b border-border p-3 text-sm font-medium">Banned IPs (system-wide)</div>
            {!banned.length ? (
              <div className="p-3 text-xs text-muted">No IPs are currently banned in any jail.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-muted">
                      <th className="p-3">IP</th>
                      <th className="p-3">Jails</th>
                      <th className="p-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {banned.map((b) => (
                      <tr key={b.ip} className="border-b border-border/60">
                        <td className="p-3 font-mono">{b.ip}</td>
                        <td className="p-3 text-xs text-muted">{b.jails.join(", ")}</td>
                        <td className="p-3 text-right">
                          <Button size="sm" disabled={unbanAll.isPending} onClick={() => unbanAll.mutate(b.ip)}>
                            Unban everywhere
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card className="mb-6">
            <h3 className="mb-3 text-sm font-medium">Manual ban</h3>
            <form className="flex flex-wrap items-end gap-2" onSubmit={submitBan}>
              <select value={form.jail} onChange={(e) => setForm((f) => ({ ...f, jail: e.target.value }))}
                className="rounded-lg border border-border bg-background px-2 py-2 text-sm" required>
                <option value="">Select jail…</option>
                {jails.map((j) => <option key={j.name} value={j.name}>{j.name}</option>)}
              </select>
              <input value={form.ip} onChange={(e) => setForm((f) => ({ ...f, ip: e.target.value }))}
                placeholder="IP to ban" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" required />
              <Button type="submit" variant="danger" disabled={ban.isPending}>Ban</Button>
              {err && <span className="text-xs text-red-400">{err}</span>}
            </form>
          </Card>

          <Blocklist jails={jails.map((j) => j.name)} />
          <Allowlist />

          {!jails.length ? (
            <EmptyState title="No jails" description="fail2ban is running but no jails are configured." />
          ) : (
            <div className="space-y-3">
              {jails.map((j) => {
                const bannedIps = j.bannedIps ?? [];
                return (
                <Card key={j.name} className="p-0">
                  <div className="flex items-center justify-between border-b border-border p-3">
                    <div className="font-medium">{j.name}</div>
                    <div className="text-xs text-muted">
                      {j.currentlyBanned} banned · {j.currentlyFailed} failed · {j.totalBanned} total
                      {j.banTime >= 0 && <> · bantime {j.banTime}s</>}
                      {j.findTime >= 0 && <> · findtime {j.findTime}s</>}
                      {j.maxRetry >= 0 && <> · maxretry {j.maxRetry}</>}
                    </div>
                  </div>
                  {!bannedIps.length ? (
                    <div className="p-3 text-xs text-muted">No banned IPs.</div>
                  ) : (
                    <table className="w-full text-sm">
                      <tbody>
                        {bannedIps.map((ip) => (
                          <tr key={ip} className="border-b border-border/40">
                            <td className="p-3 font-mono">{ip}</td>
                            <td className="p-3 text-right">
                              <Button size="sm" disabled={unban.isPending} onClick={() => unban.mutate({ jail: j.name, ip })}>
                                Unban
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
