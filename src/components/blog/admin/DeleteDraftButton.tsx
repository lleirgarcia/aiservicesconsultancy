"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface DeleteDraftButtonProps {
  id: string;
}

export function DeleteDraftButton({ id }: DeleteDraftButtonProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    if (
      !window.confirm(
        "¿Seguro que quieres eliminar este borrador? Esta acción no se puede deshacer.",
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/blog/articles/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        window.alert(`Error: ${json.error ?? res.status}`);
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      className="text-red-400 hover:text-red-300 text-sm disabled:opacity-50"
    >
      {busy ? "…" : "Eliminar"}
    </button>
  );
}
