"use client";

import { useState } from "react";
import { Check, Link2 } from "lucide-react";

export function CopyButton({ text, label = "Copy link" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-medium text-muted transition hover:border-brand-500 hover:text-fg"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1600);
        } catch {
          /* clipboard unavailable */
        }
      }}
    >
      {done ? <Check size={13} aria-hidden="true" /> : <Link2 size={13} aria-hidden="true" />}
      {done ? "Copied" : label}
    </button>
  );
}
