"use client";

import { useState } from "react";
import { approveSupplementAction } from "@/app/actions/client";
import { Button } from "@/components/ui/button";

export function ApproveSupplementButton({ supplementId }: { supplementId: string }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function approve() {
    setLoading(true);
    setError(null);
    try {
      await approveSupplementAction(supplementId);
      setDone(true);
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return <p className="text-sm text-green-700">Согласовано</p>;
  }

  return (
    <div>
      <Button onClick={approve} disabled={loading} className="min-h-[44px]">
        {loading ? "…" : "Согласовать доп. работы"}
      </Button>
      {error && <p className="text-sm text-destructive mt-1">{error}</p>}
    </div>
  );
}
