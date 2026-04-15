import type {
  AdminPost,
  AdminThread,
  AdminTransaction,
  AdminUser,
  OverviewStats,
  Paged,
} from './types';

/**
 * Deterministic mock data so the dashboard renders before the backend has
 * admin endpoints wired up. Swap each `mock*` call for an `api(...)` call
 * once the corresponding endpoint exists.
 */
const names = [
  'Alice Johnson', 'Bob Smith', 'Carla Nguyen', 'Diego Perez', 'Emma Brown',
  'Farah Khan', 'George Lee', 'Hanna Kim', 'Isaac Tan', 'Julia Davis',
  'Karim Hassan', 'Lina Park', 'Miguel Ortiz', 'Nora Green', 'Omar Singh',
];

const categories = ['Electronics', 'Furniture', 'Clothing', 'Books', 'Sports', 'Home'];
const conditions = ['new', 'like-new', 'used', 'for-parts'];
const statuses: AdminPost['status'][] = ['published', 'sold', 'paused', 'archived', 'draft'];

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
    totals: {
      users: 12_483,
      posts: 48_210,
      sales: 9_812,
      revenue: 1_284_500,
      reportsOpen: 27,
    },
  };
}

export function mockUsers(page = 1, pageSize = 12): Paged<AdminUser> {
  const total = 137;
  const start = (page - 1) * pageSize;
  const items: AdminUser[] = Array.from({ length: Math.min(pageSize, total - start) }, (_, i) => {
    const idx = start + i;
    return {
      id: `u_${1000 + idx}`,
      name: names[idx % names.length],
      email: `user${idx}@example.com`,
      phone: `+61 4${String(10_000_000 + idx).slice(0, 8)}`,
      createdAt: new Date(Date.now() - idx * 86_400_000).toISOString(),
      lastActiveAt: new Date(Date.now() - (idx % 7) * 3_600_000).toISOString(),
      status: idx % 17 === 0 ? 'banned' : idx % 9 === 0 ? 'suspended' : 'active',
      postsCount: (idx * 3) % 42,
      reportsCount: idx % 11 === 0 ? (idx % 5) + 1 : 0,
    };
  });
  return { items, total, page, pageSize };
}

export function mockUser(id: string): AdminUser {
  const idx = parseInt(id.split('_')[1] ?? '1000', 10) - 1000;
  return {
    id,
    name: names[Math.abs(idx) % names.length],
    email: `user${idx}@example.com`,
    phone: `+61 4${String(10_000_000 + idx).slice(0, 8)}`,
    createdAt: new Date(Date.now() - idx * 86_400_000).toISOString(),
    lastActiveAt: new Date(Date.now() - 3_600_000).toISOString(),
    status: 'active',
    postsCount: 12,
    reportsCount: 0,
  };
}

export function mockPosts(page = 1, pageSize = 12): Paged<AdminPost> {
  const total = 212;
  const start = (page - 1) * pageSize;
  const items: AdminPost[] = Array.from({ length: Math.min(pageSize, total - start) }, (_, i) => {
    const idx = start + i;
    return {
      id: `p_${2000 + idx}`,
      title: `${categories[idx % categories.length]} item #${idx + 1}`,
      price: 20 + ((idx * 37) % 800),
      currency: 'AUD',
      category: categories[idx % categories.length],
      condition: conditions[idx % conditions.length],
      status: statuses[idx % statuses.length],
      seller: { id: `u_${1000 + (idx % names.length)}`, name: names[idx % names.length] },
      createdAt: new Date(Date.now() - idx * 3_600_000).toISOString(),
      photos: Array.from({ length: (idx % 4) + 1 }, (_, j) => `https://picsum.photos/seed/${idx}-${j}/600/600`),
      reportsCount: idx % 13 === 0 ? 1 + (idx % 3) : 0,
    };
  });
  return { items, total, page, pageSize };
}

export function mockPost(id: string): AdminPost {
  const idx = parseInt(id.split('_')[1] ?? '2000', 10) - 2000;
  return mockPosts(1, 1000).items[idx] ?? mockPosts().items[0];
}

export function mockTransactions(page = 1, pageSize = 12): Paged<AdminTransaction> {
  const total = 96;
  const start = (page - 1) * pageSize;
  const statuses: AdminTransaction['status'][] = ['pending', 'completed', 'cancelled', 'disputed'];
  const items: AdminTransaction[] = Array.from({ length: Math.min(pageSize, total - start) }, (_, i) => {
    const idx = start + i;
    return {
      id: `t_${3000 + idx}`,
      postId: `p_${2000 + (idx % 50)}`,
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

export function mockThreads(page = 1, pageSize = 12): Paged<AdminThread> {
  const total = 54;
  const start = (page - 1) * pageSize;
  const items: AdminThread[] = Array.from({ length: Math.min(pageSize, total - start) }, (_, i) => {
    const idx = start + i;
    return {
      id: `th_${4000 + idx}`,
      name: idx % 2 === 0 ? `Suburb: ${['Surry Hills', 'Newtown', 'Bondi', 'Manly'][idx % 4]}` : `Interest: ${['Cycling', 'Plants', 'Vintage', 'Tools'][idx % 4]}`,
      type: idx % 2 === 0 ? 'suburb' : 'interest',
      memberCount: 50 + ((idx * 11) % 1200),
      messageCount: 100 + ((idx * 17) % 5000),
      createdAt: new Date(Date.now() - idx * 172_800_000).toISOString(),
      status: idx % 13 === 0 ? 'flagged' : idx % 19 === 0 ? 'archived' : 'active',
    };
  });
  return { items, total, page, pageSize };
}
