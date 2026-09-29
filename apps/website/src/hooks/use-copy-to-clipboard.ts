import { useEffect, useRef, useState } from "react";

export type CopyStatus = "idle" | "copied" | "error";

export function useCopyToClipboard(text: string, resetAfter = 1600) {
  const [result, setResult] = useState<{
    text: string;
    status: Exclude<CopyStatus, "idle">;
  } | null>(null);

  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const attempt = useRef(0);
  const status: CopyStatus = result?.text == text ? result.status : "idle";

  useEffect(() => {
    return function cleanup() {
      clearTimeout(timeout.current);
      attempt.current += 1;
    };
  }, []);

  async function copy() {
    const current = ++attempt.current;
    clearTimeout(timeout.current);
    try {
      await navigator.clipboard.writeText(text);
      if (attempt.current != current) return;
      setResult({ text, status: "copied" });
    } catch {
      if (attempt.current != current) return;
      setResult({ text, status: "error" });
    }
    timeout.current = setTimeout(() => setResult(null), resetAfter);
  }

  return { status, copy };
}
