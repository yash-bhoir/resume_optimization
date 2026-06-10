"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import type { PricingSettings } from "@/lib/app-settings";

interface AdminUserRow {
  clerkId: string;
  email: string;
  plan: "free" | "pro";
  creditsBalance: number;
  creditsUsedThisMonth: number;
  optimizationsThisMonth: number;
  totalAvailable: number;
  monthlyLimit: number;
  usageMonthKey: string;
}

interface DashboardStats {
  totalUsers: number;
  proUsers: number;
  freeUsers: number;
  optimizationsThisMonth: number;
  packCreditsOutstanding: number;
  pricing: PricingSettings;
  payments?: {
    stripeEnabled: boolean;
    webhookReady: boolean;
    missingEnvVars: string[];
    webhookUrl: string;
  };
}

type Tab = "overview" | "users" | "pricing";

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>("overview");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<"all" | "free" | "pro">("all");
  const [settings, setSettings] = useState<PricingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUserRow | null>(null);
  const [grantAmount, setGrantAmount] = useState(5);
  const [patching, setPatching] = useState(false);

  const adminFetch = async (input: RequestInfo, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    if (init?.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    return fetch(input, {
      ...init,
      credentials: "same-origin",
      headers,
    });
  };

  const readApiError = async (res: Response, fallback: string) => {
    try {
      const data = await res.json();
      return data.error || data.message || fallback;
    } catch {
      return `${fallback} (HTTP ${res.status})`;
    }
  };

  const showMsg = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(null), 4000);
  };

  const loadStats = useCallback(async () => {
    try {
      const res = await adminFetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
        setSettings(data.pricing);
      }
    } catch {
      /* ignore refresh errors */
    }
  }, []);

  const loadUsers = useCallback(async () => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: "15",
      plan: planFilter,
    });
    if (search.trim()) params.set("search", search.trim());
    try {
      const res = await adminFetch(`/api/admin/users?${params}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setUsersTotal(data.total);
      }
    } catch {
      /* ignore refresh errors */
    }
  }, [page, planFilter, search]);

  const loadSettings = useCallback(async () => {
    try {
      const res = await adminFetch("/api/admin/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
      }
    } catch {
      /* ignore refresh errors */
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([loadStats(), loadUsers(), loadSettings()]);
      setLoading(false);
    })();
  }, [loadStats, loadUsers, loadSettings]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const patchUser = async (clerkId: string, body: Record<string, unknown>) => {
    setError(null);
    setPatching(true);
    try {
      const res = await adminFetch(`/api/admin/users/${encodeURIComponent(clerkId)}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        setError(await readApiError(res, "Update failed"));
        return false;
      }
      await loadUsers();
      await loadStats();
      return true;
    } catch (err) {
      const hint =
        err instanceof TypeError
          ? "Network error — keep the same URL host (use localhost, not 127.0.0.1) and ensure the dev server is running."
          : "Update failed";
      setError(err instanceof Error ? err.message || hint : hint);
      return false;
    } finally {
      setPatching(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;
    setSavingSettings(true);
    setError(null);
    try {
      const payload = {
        freeCreditsPerMonth: settings.freeCreditsPerMonth,
        signupBonusCredits: settings.signupBonusCredits,
        proMonthlyCreditCap: settings.proMonthlyCreditCap,
        creditPackSize: settings.creditPackSize,
        proMonthlyPriceUsd: settings.proMonthlyPriceUsd,
        creditPackPriceUsd: settings.creditPackPriceUsd,
        rateLimitOptimizePerHour: settings.rateLimitOptimizePerHour,
        requireSignInToOptimize: settings.requireSignInToOptimize,
        guestScorePreviewEnabled: settings.guestScorePreviewEnabled,
      };
      const res = await adminFetch("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        setError(await readApiError(res, "Failed to save settings"));
        return;
      }
      const data = await res.json();
      setSettings(data.settings);
      showMsg("Pricing settings saved — live immediately");
      await loadStats();
    } catch (err) {
      const hint =
        err instanceof TypeError
          ? "Network error — keep the same URL host (use localhost, not 127.0.0.1) and ensure the dev server is running."
          : "Failed to save settings";
      setError(err instanceof Error ? err.message || hint : hint);
    } finally {
      setSavingSettings(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(usersTotal / 15));

  if (loading && !stats) {
    return (
      <div className="admin-page">
        <p className="admin-loading">Loading admin panel…</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div>
          <Link href="/" className="admin-back">
            ← App
          </Link>
          <h1>Admin panel</h1>
          <p className="admin-subtitle">Manage users, credits, and pricing without redeploying</p>
        </div>
        <UserButton />
      </header>

      {message && (
        <div className="admin-banner admin-banner-success" role="status">
          {message}
        </div>
      )}
      {error && (
        <div className="admin-banner admin-banner-error" role="alert">
          {error}
        </div>
      )}

      <nav className="admin-tabs" role="tablist">
        {(["overview", "users", "pricing"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            className={`admin-tab ${tab === t ? "active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t === "overview" ? "Overview" : t === "users" ? "Users" : "Pricing & credits"}
          </button>
        ))}
      </nav>

      {tab === "overview" && stats && (
        <section className="admin-section">
          <div className="admin-stat-grid">
            <div className="admin-stat-card">
              <span className="admin-stat-label">Total users</span>
              <span className="admin-stat-value">{stats.totalUsers}</span>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-label">Pro subscribers</span>
              <span className="admin-stat-value">{stats.proUsers}</span>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-label">Optimizations this month</span>
              <span className="admin-stat-value">{stats.optimizationsThisMonth}</span>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-label">Pack credits outstanding</span>
              <span className="admin-stat-value">{stats.packCreditsOutstanding}</span>
            </div>
          </div>
          {stats.payments && (
            <div className="admin-card">
              <h2>Stripe payments</h2>
              <ul className="admin-kv-list">
                <li>
                  <span>Checkout</span>
                  <strong>{stats.payments.stripeEnabled ? "Ready" : "Not configured"}</strong>
                </li>
                <li>
                  <span>Webhook</span>
                  <strong>{stats.payments.webhookReady ? "Ready" : "Missing secret"}</strong>
                </li>
                <li>
                  <span>Webhook URL</span>
                  <strong className="admin-mono">{stats.payments.webhookUrl}</strong>
                </li>
                {stats.payments.missingEnvVars.length > 0 && (
                  <li>
                    <span>Missing env vars</span>
                    <strong>{stats.payments.missingEnvVars.join(", ")}</strong>
                  </li>
                )}
              </ul>
            </div>
          )}
          <div className="admin-card">
            <h2>Current pricing (live)</h2>
            <ul className="admin-kv-list">
              <li>
                <span>Free credits / month</span>
                <strong>{stats.pricing.freeCreditsPerMonth}</strong>
              </li>
              <li>
                <span>Signup bonus</span>
                <strong>{stats.pricing.signupBonusCredits}</strong>
              </li>
              <li>
                <span>Pro monthly cap</span>
                <strong>{stats.pricing.proMonthlyCreditCap}</strong>
              </li>
              <li>
                <span>Pro price</span>
                <strong>${stats.pricing.proMonthlyPriceUsd}/mo</strong>
              </li>
              <li>
                <span>Credit pack</span>
                <strong>
                  {stats.pricing.creditPackSize} for ${stats.pricing.creditPackPriceUsd}
                </strong>
              </li>
            </ul>
          </div>
        </section>
      )}

      {tab === "users" && (
        <section className="admin-section">
          <div className="admin-toolbar">
            <input
              type="search"
              className="admin-input"
              placeholder="Search email or Clerk ID…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
            <select
              className="admin-select"
              value={planFilter}
              onChange={(e) => {
                setPlanFilter(e.target.value as "all" | "free" | "pro");
                setPage(1);
              }}
            >
              <option value="all">All plans</option>
              <option value="free">Free</option>
              <option value="pro">Pro</option>
            </select>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Plan</th>
                  <th>Used / limit</th>
                  <th>Pack</th>
                  <th>Available</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.clerkId}>
                    <td>
                      <div className="admin-cell-email">{u.email || "—"}</div>
                      <div className="admin-cell-muted">{u.clerkId.slice(0, 12)}…</div>
                    </td>
                    <td>
                      <span className={`admin-badge admin-badge-${u.plan}`}>{u.plan}</span>
                    </td>
                    <td>
                      {u.creditsUsedThisMonth} / {u.monthlyLimit}
                    </td>
                    <td>{u.creditsBalance}</td>
                    <td>
                      <strong>{u.totalAvailable}</strong>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setEditingUser(u)}
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="admin-pagination">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </button>
            <span>
              Page {page} of {totalPages} ({usersTotal} users)
            </span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </section>
      )}

      {tab === "pricing" && settings && (
        <section className="admin-section">
          <div className="admin-card admin-form">
            <h2>Credit &amp; pricing settings</h2>
            <p className="admin-hint">
              Changes apply immediately for new optimizations. Cached for ~30 seconds across
              servers.
            </p>

            <div className="admin-form-grid">
              <label>
                Free credits per month
                <input
                  type="number"
                  min={0}
                  max={100}
                  className="admin-input"
                  value={settings.freeCreditsPerMonth}
                  onChange={(e) =>
                    setSettings({ ...settings, freeCreditsPerMonth: Number(e.target.value) })
                  }
                />
              </label>
              <label>
                Signup bonus credits
                <input
                  type="number"
                  min={0}
                  max={50}
                  className="admin-input"
                  value={settings.signupBonusCredits}
                  onChange={(e) =>
                    setSettings({ ...settings, signupBonusCredits: Number(e.target.value) })
                  }
                />
              </label>
              <label>
                Pro monthly credit cap
                <input
                  type="number"
                  min={1}
                  max={500}
                  className="admin-input"
                  value={settings.proMonthlyCreditCap}
                  onChange={(e) =>
                    setSettings({ ...settings, proMonthlyCreditCap: Number(e.target.value) })
                  }
                />
              </label>
              <label>
                Credit pack size
                <input
                  type="number"
                  min={1}
                  max={200}
                  className="admin-input"
                  value={settings.creditPackSize}
                  onChange={(e) =>
                    setSettings({ ...settings, creditPackSize: Number(e.target.value) })
                  }
                />
              </label>
              <label>
                Pro price (USD / month)
                <input
                  type="number"
                  min={0}
                  step={1}
                  className="admin-input"
                  value={settings.proMonthlyPriceUsd}
                  onChange={(e) =>
                    setSettings({ ...settings, proMonthlyPriceUsd: Number(e.target.value) })
                  }
                />
              </label>
              <label>
                Credit pack price (USD)
                <input
                  type="number"
                  min={0}
                  step={1}
                  className="admin-input"
                  value={settings.creditPackPriceUsd}
                  onChange={(e) =>
                    setSettings({ ...settings, creditPackPriceUsd: Number(e.target.value) })
                  }
                />
              </label>
              <label>
                Rate limit (optimize / hour / user)
                <input
                  type="number"
                  min={1}
                  max={100}
                  className="admin-input"
                  value={settings.rateLimitOptimizePerHour}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      rateLimitOptimizePerHour: Number(e.target.value),
                    })
                  }
                />
              </label>
            </div>

            <div className="admin-toggles">
              <label className="admin-toggle">
                <input
                  type="checkbox"
                  checked={settings.requireSignInToOptimize}
                  onChange={(e) =>
                    setSettings({ ...settings, requireSignInToOptimize: e.target.checked })
                  }
                />
                Require sign-in to optimize
              </label>
              <label className="admin-toggle">
                <input
                  type="checkbox"
                  checked={settings.guestScorePreviewEnabled}
                  onChange={(e) =>
                    setSettings({ ...settings, guestScorePreviewEnabled: e.target.checked })
                  }
                />
                Guest ATS score preview enabled
              </label>
            </div>

            {settings.updatedAt && (
              <p className="admin-hint">
                Last updated {new Date(settings.updatedAt).toLocaleString()}
                {settings.updatedBy ? ` by ${settings.updatedBy}` : ""}
              </p>
            )}

            <button
              type="button"
              className="btn btn-primary"
              disabled={savingSettings}
              onClick={saveSettings}
            >
              {savingSettings ? "Saving…" : "Save pricing settings"}
            </button>
          </div>
        </section>
      )}

      {editingUser && (
        <div className="admin-modal-backdrop" role="dialog" aria-modal="true">
          <div className="admin-modal">
            <h2>Manage user</h2>
            <p className="admin-cell-email">{editingUser.email || "No email on file"}</p>
            <p className="admin-hint">Clerk ID: {editingUser.clerkId}</p>

            <div className="admin-modal-actions">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={patching}
                onClick={async () => {
                  const ok = await patchUser(editingUser.clerkId, { plan: "pro" });
                  if (ok) {
                    showMsg("Set to Pro");
                    setEditingUser(null);
                  }
                }}
              >
                Set Pro
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={patching}
                onClick={async () => {
                  const ok = await patchUser(editingUser.clerkId, { plan: "free" });
                  if (ok) {
                    showMsg("Set to Free");
                    setEditingUser(null);
                  }
                }}
              >
                Set Free
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={patching}
                onClick={async () => {
                  const ok = await patchUser(editingUser.clerkId, { resetMonthlyUsage: true });
                  if (ok) {
                    showMsg("Monthly usage reset");
                    setEditingUser(null);
                  }
                }}
              >
                Reset monthly usage
              </button>
            </div>

            <label className="admin-grant-row">
              Grant pack credits
              <input
                type="number"
                min={1}
                max={500}
                className="admin-input admin-input-inline"
                value={grantAmount}
                onChange={(e) => setGrantAmount(Number(e.target.value))}
              />
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={patching || grantAmount < 1}
                onClick={async () => {
                  const amount = Math.floor(grantAmount);
                  if (!Number.isFinite(amount) || amount < 1) {
                    setError("Enter a valid credit amount (1–500)");
                    return;
                  }
                  const ok = await patchUser(editingUser.clerkId, {
                    grantPackCredits: amount,
                  });
                  if (ok) {
                    showMsg(`Granted ${amount} credits`);
                    setEditingUser(null);
                  }
                }}
              >
                Grant
              </button>
            </label>

            <label>
              Set pack balance directly
              <input
                type="number"
                min={0}
                className="admin-input"
                defaultValue={editingUser.creditsBalance}
                id="pack-balance-input"
              />
            </label>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={patching}
              onClick={async () => {
                const input = document.getElementById("pack-balance-input") as HTMLInputElement;
                const balance = Math.floor(Number(input.value));
                if (!Number.isFinite(balance) || balance < 0) {
                  setError("Enter a valid pack balance (0 or higher)");
                  return;
                }
                const ok = await patchUser(editingUser.clerkId, {
                  creditsBalance: balance,
                });
                if (ok) {
                  showMsg("Pack balance updated");
                  setEditingUser(null);
                }
              }}
            >
              Update balance
            </button>

            <button
              type="button"
              className="btn btn-ghost admin-modal-close"
              onClick={() => setEditingUser(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
