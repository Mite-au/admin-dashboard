import type {
  AdminPost,
  AdminThread,
  AdminTransaction,
  AdminUser,
  OverviewStats,
  Paged,
  UserStatus,
} from './types';

/**
 * Deterministic mock data so the dashboard renders before the backend has
 * admin endpoints wired up. Swap each `mock*` call for an `api(...)` call
 * once the corresponding endpoint exists.
 */
const names = [
  'Yejin Kang', 'Bob Smith', 'Carla Nguyen', 'Diego Perez', 'Emma Brown',
  'Farah Khan', 'George Lee', 'Hanna Kim', 'Isaac Tan', 'Julia Davis',
  'Karim Hassan', 'Lina Park', 'Miguel Ortiz', 'Nora Green', 'Omar Singh',
];
// ISO 3166-1 alpha-2 country codes — matches `user_profiles.nationality`.
const nationalities = ['KR', 'AU', 'JP', 'US', 'GB', 'DE'];
const suburbs = ['Ultimo', 'Surry Hills', 'Newtown', 'Bondi', 'Manly', 'Chatswood'];

const categories = ['Electronics', 'Furniture', 'Clothing', 'Books', 'Sports', 'Home appliances', 'Mobile'];
const conditions = ['new', 'like-new', 'used', 'for-parts'];
const statuses: AdminPost['status'][] = ['published', 'sold', 'paused', 'archived', 'draft'];
// Real `users.status` values, plus `banned` which is synthesised from user_penalties.
const userStatuses: UserStatus[] = ['active', 'suspended', 'banned', 'pending_profile'];

export function mockOverview(): OverviewStats {
  const today = new Date();
  const activityByDay = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (13 - i));
    const seed = d.getDate();
    return {
      date: d.toISOString().slice(5, 10),
      posts: 30 + ((seed * 7) % 60),
      sales: 5 + ((seed * 3) % 25),
    };
  });
  return {
    activityByDay,
    totals: { users: 12_483, posts: 48_210, sales: 9_812, revenue: 1_284_500, reportsOpen: 27 },
  };
}

export function mockUsers(page = 1, pageSize = 15): Paged<AdminUser> {
  const total = 137;
  const start = (page - 1) * pageSize;
  const items: AdminUser[] = Array.from({ length: Math.min(pageSize, total - start) }, (_, i) => {
    const idx = start + i;
    return {
      id: `${1242400 + idx}`,
      name: names[idx % names.length],
      email: idx % 5 === 0 ? 'yeahjin.d@gmail.com' : `user${idx}@mite.com`,
      phone: '0475 402 129',
      createdAt: new Date(Date.now() - idx * 86_400_000).toISOString(),
      lastActiveAt: new Date(Date.now() - (idx % 7) * 3_600_000).toISOString(),
      status: userStatuses[idx % userStatuses.length],
      postsCount: (idx * 3) % 42,
      reportsCount: idx % 11 === 0 ? (idx % 5) + 1 : 0,
      nationality: nationalities[idx % nationalities.length],
      suburb: suburbs[idx % suburbs.length],
      emailVerified: idx % 3 !== 0,
      phoneVerified: idx % 2 === 0,
      suburbVerified: false,
      signUpAt: new Date(Date.now() - idx * 86_400_000).toISOString(),
      signInAt: new Date(Date.now() - (idx % 3) * 86_400_000).toISOString(),
      totalPurchases: 24_900 + idx * 100,
      totalSales: 23_500 + idx * 90,
    };
  });
  return { items, total, page, pageSize };
}

export function mockUser(id: string): AdminUser {
  const mocks = mockUsers(1, 100).items;
  return mocks.find((u) => u.id === id) ?? {
    ...mocks[0],
    id,
  };
}

export function mockPosts(page = 1, pageSize = 15): Paged<AdminPost> {
  const total = 212;
  const start = (page - 1) * pageSize;
  const items: AdminPost[] = Array.from({ length: Math.min(pageSize, total - start) }, (_, i) => {
    const idx = start + i;
    return {
      id: `${1023940 + idx}`,
      title: 'iphone 17',
      description:
        'This is an iPhone that is practically brand new. I received it as a gift but never opened it.',
      price: 500,
      currency: 'AUD',
      category: categories[idx % categories.length],
      condition: conditions[idx % conditions.length],
      status: statuses[idx % statuses.length],
      seller: { id: `${1242400 + (idx % names.length)}`, name: names[idx % names.length] },
      createdAt: new Date(Date.now() - idx * 3_600_000).toISOString(),
      photos: Array.from({ length: 9 }, (_, j) => `https://picsum.photos/seed/${idx}-${j}/600/600`),
      reportsCount: idx % 13 === 0 ? 1 + (idx % 3) : 0,
    };
  });
  return { items, total, page, pageSize };
}

export function mockPost(id: string): AdminPost {
  const mocks = mockPosts(1, 100).items;
  return mocks.find((p) => p.id === id) ?? { ...mocks[0], id };
}

export function mockTransactions(page = 1, pageSize = 15): Paged<AdminTransaction> {
  const total = 96;
  const start = (page - 1) * pageSize;
  const statuses: AdminTransaction['status'][] = ['pending', 'completed', 'cancelled', 'disputed'];
  const items: AdminTransaction[] = Array.from({ length: Math.min(pageSize, total - start) }, (_, i) => {
    const idx = start + i;
    return {
      id: `${3000 + idx}`,
      postId: `${1023940 + (idx % 50)}`,
      postTitle: `${categories[idx % categories.length]} item #${(idx % 50) + 1}`,
      buyer: names[idx % names.length],
      seller: names[(idx + 3) % names.length],
      amount: 20 + ((idx * 41) % 900),
      currency: 'AUD',
      status: statuses[idx % statuses.length],
      createdAt: new Date(Date.now() - idx * 7_200_000).toISOString(),
    };
  });
  return { items, total, page, pageSize };
}

export function mockThreads(page = 1, pageSize = 15): Paged<AdminThread> {
  const total = 54;
  const start = (page - 1) * pageSize;
  const items: AdminThread[] = Array.from({ length: Math.min(pageSize, total - start) }, (_, i) => {
    const idx = start + i;
    return {
      id: `${4000 + idx}`,
      name:
        idx % 2 === 0
          ? `Suburb: ${['Surry Hills', 'Newtown', 'Bondi', 'Manly'][idx % 4]}`
          : `Interest: ${['Cycling', 'Plants', 'Vintage', 'Tools'][idx % 4]}`,
      type: idx % 2 === 0 ? 'suburb' : 'interest',
      memberCount: 50 + ((idx * 11) % 1200),
      messageCount: 100 + ((idx * 17) % 5000),
      createdAt: new Date(Date.now() - idx * 172_800_000).toISOString(),
      status: idx % 13 === 0 ? 'flagged' : idx % 19 === 0 ? 'archived' : 'active',
    };
  });
  return { items, total, page, pageSize };
}
