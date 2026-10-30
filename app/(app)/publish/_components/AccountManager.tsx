"use client";

import { Plus, Trash2, Loader2 } from "lucide-react";
import { Card } from "../../../components/ui";
import type { SocialAccount, SocialPlatform } from "../../../types";
import { PLATFORMS, PLATFORM_LABEL } from "../_lib/constants";
import type { useAccountForm } from "../_hooks/useAccountForm";

type AccountForm = ReturnType<typeof useAccountForm>;

export function AccountManager({
  accounts,
  form,
}: {
  accounts: SocialAccount[];
  form: AccountForm;
}) {
  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold text-white/85">Akun terhubung</h2>
      <p className="mt-1 text-[11px] leading-relaxed text-white/40">
        Token disimpan di database PostgreSQL. Untuk produksi, isi access token dari Meta Graph API
        (panduan: <code className="rounded bg-white/8 px-1">docs/meta-setup.md</code>).
      </p>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {accounts.length === 0 && (
          <p className="col-span-2 rounded-xl border border-dashed border-white/10 px-3 py-5 text-center text-xs text-white/35">
            Belum ada akun. Tambahkan akun pertama di bawah.
          </p>
        )}
        {accounts.map((a) => (
          <div key={a.id} className="flex items-start gap-2.5 rounded-xl border border-white/8 bg-white/2 p-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white/85">@{a.accountName}</p>
              <p className="mt-0.5 text-[11px] text-white/40">
                {PLATFORM_LABEL[a.platform]} · {a.accessToken && a.userId ? "API siap" : "mode simulasi"}
              </p>
            </div>
            <button
              onClick={() => form.removeAccount(a.id)}
              className="rounded-lg p-1.5 text-white/30 transition hover:bg-white/8 hover:text-brand-400"
              aria-label="Hapus akun"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-4">
        <select value={form.accPlatform} onChange={(e) => form.setAccPlatform(e.target.value as SocialPlatform)} className="input-base">
          {PLATFORMS.map((p) => (
            <option key={p.id} value={p.id} className="bg-ink-900">
              {p.label}
            </option>
          ))}
        </select>
        <input value={form.accName} onChange={(e) => form.setAccName(e.target.value)} placeholder="Username / nama akun" className="input-base sm:col-span-3" />
        <input value={form.accUserId} onChange={(e) => form.setAccUserId(e.target.value)} placeholder="User ID / Page ID" className="input-base sm:col-span-2" />
        <input value={form.accToken} onChange={(e) => form.setAccToken(e.target.value)} placeholder="Access token (opsional)" className="input-base sm:col-span-2" />
      </div>
      <button
        onClick={form.addAccount}
        disabled={form.busyAcc}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/6 px-4 py-2.5 text-sm text-white/85 transition hover:bg-white/10 disabled:opacity-50"
      >
        {form.busyAcc ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
        Tambah akun
      </button>
    </Card>
  );
}
