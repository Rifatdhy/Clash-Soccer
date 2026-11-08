interface ContentStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function LoadingState({ label = "Memuat konten..." }: { label?: string }) {
  return (
    <div className="flex min-h-[280px] items-center justify-center" role="status" aria-live="polite">
      <p className="text-sm uppercase tracking-[0.18em] text-secondary-text">{label}</p>
    </div>
  );
}

export function ErrorState({ title, description, actionLabel, onAction }: ContentStateProps) {
  return (
    <div className="border border-red-400/30 bg-red-400/5 p-6 text-center" role="alert">
      <h2 className="text-lg font-semibold text-primary-text">{title}</h2>
      {description && <p className="mt-2 text-sm text-secondary-text">{description}</p>}
      {actionLabel && onAction && (
        <button type="button" onClick={onAction} className="mt-5 border border-border px-4 py-2 text-xs uppercase tracking-[0.16em] text-primary-text transition-colors hover:border-accent hover:text-accent">
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, description }: ContentStateProps) {
  return (
    <div className="border border-dashed border-border p-10 text-center">
      <h2 className="text-lg font-semibold text-primary-text">{title}</h2>
      {description && <p className="mt-2 text-sm text-secondary-text">{description}</p>}
    </div>
  );
}

export function BrandFallback({ label = "CLASH / ARCHIVE" }: { label?: string }) {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-elevated" aria-hidden="true">
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(90deg,transparent_49%,rgba(255,255,255,0.18)_50%,transparent_51%),linear-gradient(0deg,transparent_49%,rgba(255,255,255,0.18)_50%,transparent_51%)] [background-size:42px_42px]" />
      <span className="relative font-display text-xs uppercase tracking-[0.28em] text-secondary-text">{label}</span>
    </div>
  );
}