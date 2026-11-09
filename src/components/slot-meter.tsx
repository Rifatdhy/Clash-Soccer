import { slotStatus } from "@/lib/schedule-layout";

interface SlotMeterProps {
  available: number;
  total: number;
}

/**
 * Remaining places for one fixture, as a number and a progress bar.
 *
 * The widget is exposed to assistive technology as a single image with one
 * accessible name. Its visible parts are hidden from the accessibility tree so
 * the count is announced once — "5 dari 10 slot tersedia" — instead of as a
 * label followed by the bare "5" and "/10" fragments, which inside the row's
 * link would read as three unrelated numbers. A full fixture also says "penuh"
 * in text, so the state never depends on colour alone.
 */
export function SlotMeter({ available, total }: SlotMeterProps) {
  const { state, percent } = slotStatus(available, total);

  // `slotStatus` deliberately does not clamp, so a negative count would come
  // back as a negative percentage. Availability should never fall below zero,
  // but clamping at the render site keeps an impossible value from producing an
  // invalid CSS width. A full fixture renders an empty track regardless of the
  // number the helper returns, so the bar can never contradict the text.
  const width = state === "full" ? 0 : Math.min(100, Math.max(0, percent));

  return (
    <div role="img" aria-label={`${available} dari ${total} slot tersedia`}>
      <p aria-hidden="true">
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
      <div className="mt-1 h-1 w-full bg-ink-line" aria-hidden="true">
        <div className="h-full bg-pitch" style={{ width: `${width}%` }} />
      </div>
      {state === "full" && (
        <p className="mt-1 text-sm text-bone-dim" aria-hidden="true">
          penuh
        </p>
      )}
    </div>
  );
}
