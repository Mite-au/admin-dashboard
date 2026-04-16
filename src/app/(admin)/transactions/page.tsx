import { Topbar } from '@/components/Topbar';
import { PageHeader } from '@/components/PageHeader';
import { getTransactions } from '@/lib/fetchers';
import { TransactionsClient } from './TransactionsClient';

export default async function TransactionsPage() {
  const data = await getTransactions(1, 15);
  return (
    <>
      <Topbar breadcrumbs={['Transactions']} />
      <PageHeader title="Transactions" />
      <TransactionsClient data={data} />
    </>
  );
}
