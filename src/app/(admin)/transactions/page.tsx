import { Topbar } from '@/components/Topbar';
import { getTransactions } from '@/lib/fetchers';
import { TransactionsClient } from './TransactionsClient';

export default async function TransactionsPage() {
  const data = await getTransactions(1, 12);
  return (
    <>
      <Topbar title="Transactions" />
      <main className="flex-1 p-6"><TransactionsClient data={data} /></main>
    </>
  );
}
