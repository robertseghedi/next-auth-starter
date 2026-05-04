/**
 * Passkey management component — register and delete passkeys.
 * Shown on the dashboard when `authConfig.plugins.passkey.enabled` is true.
 */

"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Passkey {
  id: string;
  name: string | null;
  createdAt: string;
}

export function PasskeyManage() {
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(true);

  async function loadPasskeys() {
    const { data } = await authClient.passkey.listUserPasskeys();
    setPasskeys((data as Passkey[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadPasskeys();
  }, []);

  async function handleAdd() {
    setError("");
    setPending(true);

    try {
      const { error } = await authClient.passkey.addPasskey({
        name: name || undefined,
      });

      if (error) {
        setError(error.message ?? "Failed to register passkey.");
      } else {
        setName("");
        await loadPasskeys();
      }
    } catch {
      setError("Passkey registration was cancelled or failed.");
    }

    setPending(false);
  }

  async function handleDelete(id: string) {
    setPending(true);
    await authClient.passkey.deletePasskey({ id });
    await loadPasskeys();
    setPending(false);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="passkey-name">Passkey name (optional)</Label>
        <Input
          id="passkey-name"
          type="text"
          placeholder="e.g. MacBook, iPhone"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button disabled={pending} onClick={handleAdd}>
        {pending ? "Registering..." : "Register new passkey"}
      </Button>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading passkeys...</p>
      ) : passkeys.length === 0 ? (
        <p className="text-sm text-muted-foreground">No passkeys registered.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {passkeys.map((pk) => (
            <li
              key={pk.id}
              className="flex items-center justify-between rounded-lg border p-2"
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  {pk.name ?? "Unnamed passkey"}
                </span>
                <span className="text-xs text-muted-foreground">
                  Added {new Date(pk.createdAt).toLocaleDateString()}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={() => handleDelete(pk.id)}
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
