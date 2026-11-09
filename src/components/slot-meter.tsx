import { slotStatus } from "@/lib/schedule-layout";

interface SlotMeterProps {
  available: number;
  total: number;
}

/**
 * Remaining places for one fixture, as a number and a progress bar.
 *
 * The widget is exposed to assistive technology as a single image with one
 * accessible name. Children of a `role="img"` element are presentational by
 * ARIA, so the name is the only channel a screen reader has: it must carry the
 * count *and* the state, otherwise "penuh" would be visible text that never
 * reaches anyone using a screen reader. The visible parts still say the same
 * thing in text, so the state never depends on colour alone.
 */
export function SlotMeter({ available, total }: SlotMeterProps) {
  const { state, percent } = slotStatus(available, total);

  // `slotStatus` deliberately does not clamp, so a negative count would come
  // back as a negative percentage. Availability should never fall below zero,
  // but clamping at the render site keeps an impossible value from producing an
  // invalid CSS width — and an invalid width is not harmless: the browser drops
  // the declaration, leaving the inner block at `width: auto`, which fills the
  // track and would show a *full* bar. A full fixture renders an empty track
  // regardless of the number the helper returns, so the bar can never
  // contradict the text.
  const width = state === "full" ? 0 : Math.min(100, Math.max(0, percent));

  const label =
    state === "full"
      ? `${available} dari ${total} slot tersedia, penuh`
      : `${available} dari ${total} slot tersedia`;

  return (
    // Children of a `role="img"` are presentational, so this name is the only
    // channel AT receives — it has to carry both the count and the state.
    <div role="img" aria-label={label}>
      <p>
        <span
          className={
            state === "full"
              ? "font-condensed text-2xl text-bone-dim"
              : "font-condensed text-2xl text-bone"
          }
        >
          {available}
        </span>
        <span className="text-sm text-bone-dim">/{total}</span>
      </p>
      <div className="mt-1 h-1 w-full bg-ink-line">
        <div className="h-full bg-pitch" style={{ width: `${width}%` }} />
      </div>
      {state === "full" && <p className="mt-1 text-sm text-bone-dim">penuh</p>}
    </div>
  );
}
