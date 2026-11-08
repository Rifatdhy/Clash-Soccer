"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full border border-border bg-surface p-8 text-center">
        <p className="text-xs uppercase tracking-[0.24em] text-secondary-text mb-3">
          Clash.Soccer
        </p>
        <h1 className="text-2xl font-bold text-primary-text font-display uppercase">
          Konten gagal dimuat
        </h1>
        <p className="text-secondary-text mt-4 leading-relaxed">
          Terjadi kendala saat mengambil data. Silakan coba lagi sebentar lagi.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={reset}
            className="px-6 py-3 bg-accent text-charcoal text-sm font-medium uppercase tracking-widest hover:opacity-90 transition-opacity"
          >
            Coba lagi
          </button>
          <Link
            href="/"
            className="px-6 py-3 border border-border text-primary-text text-sm font-medium uppercase tracking-widest hover:bg-elevated transition-colors"
          >
            Ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
