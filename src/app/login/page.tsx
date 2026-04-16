import { Sidebar } from '@/components/Sidebar';
import { LoginForm } from './LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-page p-5 flex gap-5">
      <Sidebar />
      <div className="flex-1 card-shell flex flex-col overflow-hidden">
        <header className="flex items-center gap-3 px-8 pt-7 pb-5 text-sm font-medium">
          <span className="text-brand-600 font-bold tracking-wide">MITE Admin</span>
          <span className="text-ink-300">/</span>
          <span className="text-ink-700">Sign in</span>
        </header>

        <main className="flex-1 flex items-center justify-center px-8 pb-24">
          <LoginForm />
        </main>
      </div>
    </div>
  );
}
