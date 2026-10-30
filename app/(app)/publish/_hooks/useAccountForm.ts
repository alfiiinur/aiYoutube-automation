"use client";

import { useState } from "react";
import type { SocialPlatform } from "../../../types";

export function useAccountForm(
  loadAccounts: () => Promise<void>,
  setError: (msg: string | null) => void,
) {
  const [accPlatform, setAccPlatform] = useState<SocialPlatform>("threads");
  const [accName, setAccName] = useState("");
  const [accToken, setAccToken] = useState("");
  const [accUserId, setAccUserId] = useState("");
  const [busyAcc, setBusyAcc] = useState(false);

  const addAccount = async () => {
    if (accName.trim().length < 2) {
      setError("Nama akun minimal 2 karakter.");
      return;
    }
    setBusyAcc(true);
    setError(null);
    try {
      const res = await fetch("/api/social-accounts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          platform: accPlatform,
          accountName: accName.trim(),
          accessToken: accToken.trim() || undefined,
          userId: accUserId.trim() || undefined,
          enabled: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal menambah akun");
      setAccName("");
      setAccToken("");
      setAccUserId("");
      await loadAccounts();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menambah akun");
    } finally {
      setBusyAcc(false);
    }
  };

  const removeAccount = async (id: string) => {
    await fetch(`/api/social-accounts/${id}`, { method: "DELETE" });
    await loadAccounts();
  };

  return {
    accPlatform,
    setAccPlatform,
    accName,
    setAccName,
    accToken,
    setAccToken,
    accUserId,
    setAccUserId,
    busyAcc,
    addAccount,
    removeAccount,
  };
}
