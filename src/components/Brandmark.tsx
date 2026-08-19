/* eslint-disable @next/next/no-img-element --
   These are fixed-size static brand PNGs shipped from /public. next/image
   buys nothing here (no responsive sizing, no remote host, no art direction)
   and would not work in global-error.tsx, which renders outside the app
   shell. Plain <img> with explicit width/height is zero-CLS and portable. */

import clsx from 'clsx';

/** Intrinsic size of public/brand/mite-wordmark.png — flat #ff4f40 on alpha. */
const WORDMARK = { src: '/brand/mite-wordmark.png', w: 344, h: 105 };
const RATIO = WORDMARK.w / WORDMARK.h; // 3.276

/**
 * The real MITE wordmark artwork.
 *
 * `size` is the rendered HEIGHT in px (the wordmark is 3.28:1, so a square
 * dimension would be meaningless); the width is derived so the aspect ratio
 * can never drift. Both attributes are set on the element, so the space is
 * reserved before the PNG decodes.
 *
 * The app icon (public/brand/mite-icon.png) is deliberately not used in
 * chrome: it is an opaque #f6f6f6 tile, which reads as a mis-tinted square
 * against both the warm canvas and white card surfaces. It serves as the
 * favicon via src/app/icon.png instead.
 */
export function Brandmark({
  size = 22,
  className,
}: {
  size?: number;
  className?: string;
}) {
  const height = size;
  const width = Math.round(RATIO * height);
  return (
    <img
      src={WORDMARK.src}
      alt="MITE"
      width={width}
      height={height}
      draggable={false}
      className={clsx('block shrink-0 select-none', className)}
    />
  );
}

/**
 * Wordmark + the "Admin" qualifier, split by a hairline.
 *
 * The artwork has no admin variant, so the qualifier stays typographic and
 * deliberately subordinate — small, tracked-out, ink-400 — so it reads as a
 * note on the logo rather than part of it.
 */
export function BrandLockup({
  size = 20,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span className={clsx('inline-flex items-center gap-2.5', className)}>
      <Brandmark size={size} />
      <span aria-hidden="true" className="h-4 w-px shrink-0 bg-ink-200" />
      <span className="text-2xs font-semibold uppercase tracking-[0.14em] text-ink-400">
        Admin
      </span>
    </span>
  );
}
