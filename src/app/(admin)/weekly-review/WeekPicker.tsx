'use client';

import clsx from 'clsx';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { addDays, parseDayKey, periodLabel, todayDayKey, weekStartKey } from '@/lib/period';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
/** Mon-first, matching the ISO week the backend reports on. */
const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const monthKey = (year: number, month: number) =>
  `${year}-${String(month + 1).padStart(2, '0')}-01`;

/**
 * Every Mon–Sun row that touches the given month, as day keys.
 *
 * All stepping goes through `period.addDays`, which works on local calendar
 * fields. The obvious `new Date('2026-08-01')` shortcut parses as UTC
 * midnight, which is the previous day in Australia — enough to put a whole
 * calendar one row out of place for most of the working afternoon.
 */
function buildMonthWeeks(year: number, month: number): string[][] {
  const firstOfMonth = monthKey(year, month);
  let cursor = weekStartKey(firstOfMonth);

  const weeks: string[][] = [];
  for (let w = 0; w < 6; w += 1) {
    const week = Array.from({ length: 7 }, (_, d) => addDays(cursor, d));
    // Stop once a row has run entirely past the month.
    if (w > 0 && week.every((day) => parseDayKey(day)?.getMonth() !== month)) break;
    weeks.push(week);
    cursor = addDays(cursor, 7);
  }
  return weeks;
}

/**
 * Pick a week by clicking the week, not a day.
 *
 * A standard date picker asks for a date and then silently snaps it to a
 * Monday, so the thing you clicked and the thing you get are different. Here
 * the whole Mon–Sun row is one control that highlights as a unit, which makes
 * the selection granularity visible before you commit to it.
 */
export function WeekPicker({
  selectedMonday,
  onSelect,
}: {
  selectedMonday: string;
  onSelect: (mondayKey: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const selected = parseDayKey(selectedMonday);
  const [viewYear, setViewYear] = useState(() => selected?.getFullYear() ?? new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => selected?.getMonth() ?? new Date().getMonth());

  const today = todayDayKey();
  const currentMonday = weekStartKey(today);
  const todayDate = parseDayKey(today);
  // There is nothing to review in a month that hasn't started.
  const canGoNextMonth =
    todayDate !== null &&
    viewYear * 12 + viewMonth < todayDate.getFullYear() * 12 + todayDate.getMonth();

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      // Dismissing a popover must hand focus back to what opened it, or the
      // keyboard user is dropped at the top of the document.
      triggerRef.current?.focus();
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  // Follow the selection when it changes from outside — the prev/next week
  // arrows can walk the review into a month the calendar isn't showing.
  useEffect(() => {
    const date = parseDayKey(selectedMonday);
    if (!date) return;
    setViewYear(date.getFullYear());
    setViewMonth(date.getMonth());
  }, [selectedMonday]);

  const stepMonth = (delta: number) => {
    const next = viewMonth + delta;
    if (next < 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else if (next > 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth(next);
    }
  };

  const weeks = buildMonthWeeks(viewYear, viewMonth);

  return (
    <div className="relative" ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((isOpen) => !isOpen)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="btn-icon"
      >
        <CalendarDays size={14} strokeWidth={1.9} aria-hidden="true" />
        Choose week
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Choose a review week"
          className="absolute left-0 top-full z-30 mt-2 w-72 animate-pop-in rounded-panel border
                     border-ink-200 bg-white p-4 shadow-pop"
        >
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => stepMonth(-1)}
              aria-label="Previous month"
              className="inline-flex h-7 w-7 items-center justify-center rounded-control
                         text-ink-600 transition-colors hover:bg-ink-50 hover:text-ink-900"
            >
              <ChevronLeft size={15} strokeWidth={2} aria-hidden="true" />
            </button>
            <span aria-live="polite" className="text-data font-semibold text-ink-900">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={() => stepMonth(1)}
              disabled={!canGoNextMonth}
              aria-label="Next month"
              className="inline-flex h-7 w-7 items-center justify-center rounded-control
                         text-ink-600 transition-colors hover:bg-ink-50 hover:text-ink-900
                         disabled:cursor-not-allowed disabled:text-ink-300 disabled:hover:bg-transparent"
            >
              <ChevronRight size={15} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>

          <div aria-hidden="true" className="mb-1 grid grid-cols-7">
            {DAY_LABELS.map((day, i) => (
              <span key={i} className="label-micro py-1 text-center text-ink-400">
                {day}
              </span>
            ))}
          </div>

          <div className="space-y-0.5">
            {weeks.map((week) => {
              const monday = week[0];
              const isSelected = monday === selectedMonday;
              const isFuture = monday > currentMonday;

              return (
                <button
                  key={monday}
                  type="button"
                  disabled={isFuture}
                  aria-current={isSelected ? 'true' : undefined}
                  // Without this the row announces as seven loose numbers.
                  aria-label={`Week of ${periodLabel({ from: monday, to: addDays(monday, 6) })}`}
                  onClick={() => {
                    onSelect(monday);
                    setOpen(false);
                  }}
                  className={clsx(
                    'grid w-full grid-cols-7 rounded-control transition-colors',
                    isFuture && 'cursor-not-allowed opacity-30',
                    isSelected && 'bg-ink-900',
                    !isSelected && !isFuture && 'hover:bg-ink-100',
                  )}
                >
                  {week.map((day) => {
                    const date = parseDayKey(day);
                    return (
                      <span
                        key={day}
                        className={clsx(
                          'tnum py-1.5 text-center text-data leading-none',
                          isSelected
                            ? 'font-semibold text-white'
                            : date?.getMonth() === viewMonth
                              ? 'text-ink-800'
                              : 'text-ink-300',
                        )}
                      >
                        {date?.getDate()}
                      </span>
                    );
                  })}
                </button>
              );
            })}
          </div>

          <p className="mt-3 text-center text-2xs text-ink-400">
            Pick any row to review that week
          </p>
        </div>
      )}
    </div>
  );
}
