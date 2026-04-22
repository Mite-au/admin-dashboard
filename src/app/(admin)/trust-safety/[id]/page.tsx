import { Topbar } from '@/components/Topbar';
import { PageHeader } from '@/components/PageHeader';
import { getReport } from '@/lib/fetchers';
import { ReportDetailClient } from './ReportDetailClient';

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const report = await getReport(id);

  return (
    <>
      <Topbar
        breadcrumbs={[
          { label: 'Trust & Safety', href: '/trust-safety' },
          { label: report.id, href: `/trust-safety/${id}` },
        ]}
      />
      <PageHeader title="Report detail" />
      <ReportDetailClient report={report} />
    </>
  );
}
