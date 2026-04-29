'use client';

import { usePathname } from 'next/navigation';
import {
  DetailPageSkeleton,
  OverviewPageSkeleton,
  StubPageSkeleton,
  TablePageSkeleton,
} from '@/components/Skeleton';

function isDetailPath(pathname: string) {
  return /^\/(users|listings|threads|trust-safety)\/[^/]+$/.test(pathname);
}

export default function AdminLoading() {
  const pathname = usePathname();

  if (pathname === '/overview') {
    return <OverviewPageSkeleton />;
  }

  if (pathname === '/weekly-review') {
    return <OverviewPageSkeleton />;
  }

  if (pathname === '/notification' || pathname === '/ads') {
    return <StubPageSkeleton />;
  }

  if (isDetailPath(pathname)) {
    return <DetailPageSkeleton />;
  }

  if (pathname === '/trust-safety') {
    return <TablePageSkeleton cols={7} filters={2} headerWidth="w-40" />;
  }

  if (pathname === '/transactions') {
    return <TablePageSkeleton cols={6} filters={4} headerWidth="w-36" />;
  }

  if (pathname === '/threads') {
    return <TablePageSkeleton cols={6} filters={3} headerWidth="w-24" />;
  }

  if (pathname === '/listings') {
    return <TablePageSkeleton cols={8} filters={5} headerWidth="w-24" />;
  }

  return <TablePageSkeleton cols={7} filters={4} headerWidth="w-24" />;
}
