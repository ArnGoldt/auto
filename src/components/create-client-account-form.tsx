"use client";

import { useState } from "react";
import { createClientAccountAction } from "@/app/actions/manager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateClientAccountForm({ clientId }: { clientId: string }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await createClientAccountAction({
        clientId,
        login: fd.get("login") as string,
        password: fd.get("password") as string,
      });
      setMsg(`Доступ создан: ${res.login}`);
      e.currentTarget.reset();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Ошибка");
    }
  }

  function genPassword() {
    const p = `lk-${Math.random().toString(36).slice(2, 10)}`;
    const input = document.getElementById("portal-password") as HTMLInputElement;
    if (input) input.value = p;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 border rounded-lg p-4">
      <p className="font-medium text-sm">Создать доступ в ЛК</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="login">Логин</Label>
          <Input id="login" name="login" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="portal-password">Пароль</Label>
          <Input id="portal-password" name="password" required minLength={6} />
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={genPassword}>
          Сгенерировать пароль
        </Button>
        <Button type="submit" size="sm">
          Создать
        </Button>
      </div>
      {msg && <p className="text-sm text-green-700">{msg}</p>}
      {err && <p className="text-sm text-destructive">{err}</p>}
    </form>
  );
}
