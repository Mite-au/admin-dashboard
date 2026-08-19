import { Brandmark } from '@/components/Brandmark';
import { LoginForm } from './LoginForm';

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-page px-5 py-12">
      {/* The one atmospheric element in the product: a warm bloom behind the
          mark, so the entry screen reads as brand space before it reads as a
          form. Everything past sign-in is neutral.

          Kept small and faint on purpose — the real coral is far more
          saturated than a soft orange, so a large or strong bloom stops
          reading as a glow and turns the whole page pink. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[12%] h-[220px] w-[380px] -translate-x-1/2 rounded-full bg-brand-200/25 blur-[90px]"
      />

      <div className="relative w-full max-w-[384px]">
        {/* The wordmark artwork already says "MITE", so the qualifier is the
            only type here — stacked rather than the sidebar's inline rule,
            because a centred hero has the vertical room for it. */}
        <div className="mb-7 flex flex-col items-center">
          <Brandmark size={34} />
          <p className="mt-3 text-2xs font-semibold uppercase tracking-[0.18em] text-ink-400">
            Admin
          </p>
        </div>

        <div className="card-shell p-8">
          <LoginForm />
        </div>

        <p className="mt-5 text-center text-xs text-ink-500">
          Restricted to MITE staff accounts.
        </p>
      </div>
    </div>
  );
}
