import { Topbar } from '@/components/Topbar';
import { PageHeader } from '@/components/PageHeader';

export async function StubPage({
  breadcrumb,
  href,
  title,
  description,
}: {
  breadcrumb: string;
  href: string;
  title: string;
  description: string;
}) {
  return (
    <>
      <Topbar breadcrumbs={[{ label: breadcrumb, href }]} />
      <PageHeader title={title} />
      <div className="px-8 pb-8">
        <div className="card-inner p-10 text-center">
          <p className="text-ink-500">{description}</p>
        </div>
      </div>
    </>
  );
}
