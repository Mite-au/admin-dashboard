import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Topbar } from '@/components/Topbar';
import { PageHeader } from '@/components/PageHeader';
import { getReport } from '@/lib/fetchers';
import { formatReportReason, targetMeta } from '../ReportTarget';
import { ReportDetailClient } from './ReportDetailClient';

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const report = await getReport(id);
  const { label } = targetMeta(report.targetType);

  return (
    <>
      <Topbar
        breadcrumbs={[
          { label: 'Trust & Safety', href: '/trust-safety' },
          { label: 'Report', href: `/trust-safety/${id}` },
        ]}
      />
      <PageHeader
        title="Report detail"
        description={
          report.reason
            ? `${label} reported for ${formatReportReason(report.reason).toLowerCase()}.`
            : `${label} reported without a stated reason.`
        }
        actions={
          <Link href="/trust-safety" className="btn-icon">
            <ArrowLeft size={14} strokeWidth={1.9} />
            All reports
          </Link>
        }
      />
      <ReportDetailClient report={report} />
    </>
  );
}
