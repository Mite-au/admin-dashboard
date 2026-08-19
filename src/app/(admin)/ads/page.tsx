import { Megaphone } from 'lucide-react';
import { StubPage } from '@/components/StubPage';

export default function AdsPage() {
  return (
    <StubPage
      breadcrumb="Ads"
      href="/ads"
      title="Ads"
      icon={Megaphone}
      description="Promoted listings, campaign budgets and placement performance will be managed here. No ad inventory is wired to the admin API yet."
    />
  );
}
