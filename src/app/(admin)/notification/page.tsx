import { BellRing } from 'lucide-react';
import { StubPage } from '@/components/StubPage';

export default function NotificationPage() {
  return (
    <StubPage
      breadcrumb="Notification"
      href="/notification"
      title="Notification"
      icon={BellRing}
      description="Composing a push or email broadcast, choosing who receives it, and reading back delivery and open rates will happen here. Nothing can be sent from the admin dashboard yet."
    />
  );
}
