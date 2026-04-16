import { Sidebar } from '@/components/Sidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-page p-5 flex gap-5">
      <Sidebar />
      <div className="flex-1 min-w-0 card-shell flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}
