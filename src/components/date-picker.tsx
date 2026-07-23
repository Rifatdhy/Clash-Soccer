"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
}

const months = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function DatePicker({ value, onChange }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = value ? new Date(value + "T00:00:00") : new Date();
  const [viewYear, setViewYear] = useState(selected.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected.getMonth());

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const isSelected = (day: number) => {
    if (!value) return false;
    return value === `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };

  const isToday = (day: number) => {
    return `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}` === todayStr;
  };

  const selectDay = (day: number) => {
    const m = String(viewMonth + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    onChange(`${viewYear}-${m}-${d}`);
    setOpen(false);
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(viewYear - 1); setViewMonth(11); }
    else setViewMonth(viewMonth - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(viewYear + 1); setViewMonth(0); }
    else setViewMonth(viewMonth + 1);
  };

  const displayValue = value
    ? new Date(value + "T00:00:00").toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 bg-elevated border border-border px-4 py-3 text-sm text-left text-primary-text focus:outline-none focus:border-accent transition-colors"
      >
        <CalendarDays size={16} className="text-secondary-text shrink-0" />
        <span className={value ? "text-primary-text" : "text-secondary-text"}>
          {value ? displayValue : "Pilih tanggal"}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: [0.32, 0.72, 0, 1] }}
            className="absolute top-full mt-2 left-0 z-50 w-[300px] bg-surface border border-border shadow-xl"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="p-1 text-secondary-text hover:text-primary-text transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-sm font-semibold text-primary-text">
                  {months[viewMonth]} {viewYear}
                </span>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="p-1 text-secondary-text hover:text-primary-text transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-2">
                {dayNames.map((d) => (
                  <div key={d} className="text-center text-[10px] uppercase tracking-wider text-secondary-text font-medium py-1">
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                  const selected = isSelected(day);
                  const today = isToday(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => selectDay(day)}
                      className={`
                        aspect-square flex items-center justify-center text-sm rounded-sm transition-colors
                        ${selected
                          ? "bg-accent text-charcoal font-semibold"
                          : today
                          ? "border border-accent/50 text-primary-text hover:bg-elevated"
                          : "text-primary-text hover:bg-elevated"
                        }
                      `}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-border px-4 py-2 flex justify-between items-center">
              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  setViewYear(d.getFullYear());
                  setViewMonth(d.getMonth());
                }}
                className="text-[11px] uppercase tracking-wider text-secondary-text hover:text-accent transition-colors"
              >
                Hari Ini
              </button>
              <button
                type="button"
                onClick={() => { onChange(""); setOpen(false); }}
                className="text-[11px] uppercase tracking-wider text-secondary-text hover:text-accent transition-colors"
              >
                Hapus
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
