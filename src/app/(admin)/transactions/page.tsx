import { Topbar } from '@/components/Topbar';
import { PageHeader } from '@/components/PageHeader';
import { getTransactions, type TransactionFilters } from '@/lib/fetchers';
import { TransactionsClient } from './TransactionsClient';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

export default async function TransactionsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const filters: TransactionFilters = {
    page: Number(first(sp.page) ?? 1),
    postTitle: first(sp.postTitle),
    buyer: first(sp.buyer),
    seller: first(sp.seller),
    transactionId: first(sp.transactionId),
  };
  const data = await getTransactions(filters);

  return (
    <>
      <Topbar breadcrumbs={['Transactions']} />
      <PageHeader title="Transactions" />
      <TransactionsClient data={data} filters={filters} />
    </>
  );
}
