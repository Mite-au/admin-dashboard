import { Topbar } from '@/components/Topbar';
import { PageHeader } from '@/components/PageHeader';
import { getTransactions, type TransactionFilters } from '@/lib/fetchers';
import { TransactionsClient } from './TransactionsClient';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

/** A hand-edited `?page=abc` must not become `page=NaN` in the API call. */
function pageParam(v: string | string[] | undefined): number {
  const n = Number(first(v));
  return Number.isInteger(n) && n > 0 ? n : 1;
}

export default async function TransactionsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const filters: TransactionFilters = {
    page: pageParam(sp.page),
    postTitle: first(sp.postTitle),
    buyer: first(sp.buyer),
    seller: first(sp.seller),
    transactionId: first(sp.transactionId),
    status: first(sp.status),
  };
  const data = await getTransactions(filters);

  return (
    <>
      <Topbar breadcrumbs={[{ label: 'Transactions', href: '/transactions' }]} />
      <PageHeader
        title="Transactions"
        description="Every marketplace order and the state it settled in. Search by item, either party, or the transaction ID from a support ticket."
      />
      <TransactionsClient data={data} filters={filters} />
    </>
  );
}
