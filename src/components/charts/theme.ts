'use client';

import { formatCompact, formatMoney, formatNumber, formatPercent } from '@/lib/format';

/**
 * Palette and chrome for the MITE admin chart kit.
 *
 * Derived with the dataviz method rather than picked by eye:
 *
 * 1. Slot 1 is the MITE brand ink, `#ff4f40` (coral red), used unmodified.
 *    At OKLCH L 0.673 / C 0.215 / h 28.9 it measures 3.26:1 on the white card
 *    surface, so unlike most brand colours it already clears the 3:1 floor for
 *    marks and needs no stepping. (Note this is a FILL grade, not a text
 *    grade — the design system's brand-600 is the one that carries type.)
 * 2. The reference palette's red was RETIRED. At normal ΔE 5.8 / CVD ΔE 4.5
 *    from the brand coral it was the same colour wearing a second slot; a teal
 *    took its place, filling the real gap between aqua (h 162) and blue
 *    (h 255). The rest keep their hue families, re-stepped for OUR surface
 *    (`#ffffff`, brighter than the reference `#fcfcfb`) so every slot clears
 *    3:1 without leaning on the relief rule.
 * 3. The slot order is the CVD-safety mechanism, not decoration. Orderings were
 *    enumerated with coral pinned to slot 1 and ranked on the ALL-PAIRS floor
 *    at four series, because every series in a chart shares one legend — the
 *    adjacent-only test would have hidden that coral and yellow collapse to
 *    CVD ΔE 2.3. That is why yellow sits at slot 6 rather than slot 4.
 *
 * Validated with the skill's `validate_palette.js` (light, surface `#ffffff`):
 *   - all 8, adjacent: lightness band PASS · chroma floor PASS · CVD PASS
 *     (worst adjacent ΔE 13.4, target ≥ 8) · normal-vision PASS (worst
 *     adjacent ΔE 17.5, floor ≥ 15) · contrast PASS (all eight ≥ 3:1).
 *   - first 4, ALL-PAIRS: CVD ΔE 9.5 · normal ΔE 16.3 · all ≥ 3:1 — so any
 *     chart up to four series is safe with every pair on screen at once,
 *     which covers every chart this dashboard draws.
 *
 * Past four series no ordering of eight hues clears the all-pairs floors (the
 * pairlist stops depending on order), so a 5+ series chart should fold its tail
 * into "Other" or facet rather than reach further down this list.
 *
 * Every colour a chart paints comes from this file. There are no hex literals
 * anywhere else in src/components/charts.
 */

/**
 * Categorical slots, assigned in order and never cycled. Identity only — a
 * series takes the slot matching its position, and a filter that drops a series
 * must not repaint the survivors.
 */
export const seriesColors = [
  '#ff4f40', // 1 · brand coral   3.26:1 — the MITE brand ink, unmodified
  '#2a78d6', // 2 · blue          4.42:1
  '#08a974', // 3 · aqua          3.03:1
  '#4a3aa7', // 4 · violet        8.56:1
  '#0099a6', // 5 · teal          3.44:1 — replaces the retired reference red
  '#c98500', // 6 · yellow        3.07:1 — held back: CVD ΔE 2.3 from the coral
  '#dc7099', // 7 · magenta       3.08:1
  '#008300', // 8 · green         4.95:1
] as const;

/**
 * Slot lookup. Past the eighth series the palette is exhausted — the honest
 * answer is to fold the tail into "Other" or facet, so this clamps rather than
 * cycling (a generated ninth hue is indistinguishable from an existing slot
 * under CVD).
 */
export function seriesColor(index: number): string {
  if (!Number.isFinite(index) || index < 0) return seriesColors[0];
  return seriesColors[Math.min(Math.trunc(index), seriesColors.length - 1)];
}

/**
 * Ordinal ramp for funnel stages. Funnel steps are ordered — swapping two
 * changes the meaning — so they take a one-hue ramp on the brand hue rather
 * than categorical slots. Light at the mouth, deepest at the outcome.
 *
 * Steps are 0.07 apart in OKLCH L rather than the 0.06 minimum: the brand
 * coral's high chroma (C 0.215) clips the sRGB gamut at the dark end, which
 * compresses the last gap: at 0.065 the final pair landed exactly on 0.060 and
 * failed the check.
 *
 * Validated with `--ordinal` (light, surface `#ffffff`): monotone lightness
 * PASS · adjacent ΔL ≥ 0.06 PASS · light-end contrast 2.32:1 PASS (floor 2.0)
 * · single hue PASS (0° spread).
 */
export const funnelRamp = ['#ff8877', '#ff5a4a', '#eb3b2e', '#d21913', '#b50000'] as const;

/** Sample the ramp evenly so a 3-stage funnel spans it as fully as a 5-stage one. */
export function funnelStageColor(index: number, total: number): string {
  const last = funnelRamp.length - 1;
  if (!Number.isFinite(index) || index < 0) return funnelRamp[0];
  if (total <= 1) return funnelRamp[Math.min(last, 2)];
  const step = Math.round((Math.min(index, total - 1) / (total - 1)) * last);
  return funnelRamp[Math.min(Math.max(step, 0), last)];
}

/**
 * Chart chrome. Greys track the app's `ink` scale so charts sit inside a card
 * without introducing a second neutral language.
 */
export const chartTheme = {
  /** Card background — every chart renders on white. */
  surface: '#ffffff',
  /** Horizontal gridlines: hairline, solid, one step off the surface. */
  grid: '#e5e7eb', // ink-200 · 1.24:1, recessive by design
  /** Crosshair / baseline rules. */
  rule: '#d1d5db', // ink-300
  /** Axis tick text. */
  axisText: '#6b7280', // ink-500 · 4.83:1
  /** Body-weight chart text (series labels, stage names). */
  labelText: '#3f3f3f', // ink-700 · 10.53:1
  /** De-emphasised text (shares, footnotes). */
  mutedText: '#9ca3af', // ink-400
  /** Values and headline figures. */
  strongText: '#111111', // ink-900
  /** Hovered bar / segment wash. */
  hoverFill: '#f7f7f7', // ink-50
  /** Empty track behind a funnel bar. */
  track: '#f0f0f0', // ink-100

  /**
   * Previous-period / comparison series. Reads as secondary through lightness
   * AND chroma (a desaturated slate against a saturated brand orange), never
   * through hue alone — ΔE 22.6 from the primary under normal vision, 16.6
   * under simulated CVD, so the two never merge.
   */
  comparison: '#94a3b8', // 2.56:1 — deliberately quiet
  /** The same grey at marker weight, for prev-period ticks on a filled bar. */
  comparisonRule: '#94a3b8',

  /** Semantic anchors, shared with the design system. Always icon + label. */
  positive: '#059669',
  negative: '#dc2626',
  warning: '#b45309',

  /** Tooltip surface. */
  tooltipBorder: '#e5e7eb',
} as const;

/** Shared tick/label typography. 12px with tabular figures so ticks align. */
export const axisTick = {
  fontSize: 12,
  fill: chartTheme.axisText,
  style: { fontVariantNumeric: 'tabular-nums' as const },
} as const;

export type ValueKind = 'number' | 'compact' | 'percent' | 'currency';

/**
 * Tooltip / label formatter. Takes whatever the backend sent — nulls and
 * non-finite numbers render as an em dash rather than "NaN".
 */
export function formatValue(value: unknown, kind: ValueKind = 'number'): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  switch (kind) {
    case 'compact':
      return formatCompact(value);
    case 'percent':
      return formatPercent(value);
    case 'currency':
      return formatMoney(value);
    default:
      return formatNumber(value);
  }
}

/**
 * Axis-tick formatter. Ticks get much less room than a tooltip, so counts and
 * money always compact; rates keep their unit.
 */
export function formatAxisValue(value: unknown, kind: ValueKind = 'number'): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '';
  switch (kind) {
    case 'percent':
      return formatPercent(value);
    case 'currency':
      return `$${formatCompact(value)}`;
    default:
      return formatCompact(value);
  }
}
