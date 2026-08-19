/**
 * Tab identity for the overview page, shared by the server page (which reads
 * the initial selection out of the URL) and the client shell (which writes it
 * back). Kept directive-free so both trees can import it.
 */

export type OverviewTab = 'overview' | 'engagement';
export type OverviewSection =
  | 'listings'
  | 'transactions'
  | 'reports'
  | 'chat'
  | 'threads'
  | 'activation';

const SECTIONS: Record<OverviewTab, readonly OverviewSection[]> = {
  overview: ['listings', 'transactions', 'reports'],
  engagement: ['chat', 'threads', 'activation'],
};

export const TAB_LABELS: Record<OverviewTab, string> = {
  overview: 'Marketplace',
  engagement: 'Engagement',
};

export const SECTION_LABELS: Record<OverviewSection, string> = {
  listings: 'Listings',
  transactions: 'Transactions',
  reports: 'Reports',
  chat: 'Chat',
  threads: 'Threads',
  activation: 'Activation',
};

/** Sections belonging to a tab. First entry is that tab's default. */
export function sectionsFor(tab: OverviewTab): readonly OverviewSection[] {
  return SECTIONS[tab];
}

export function resolveTab(value: unknown): OverviewTab {
  return value === 'engagement' ? 'engagement' : 'overview';
}

/**
 * A section is only valid inside its own tab — `?tab=engagement&section=reports`
 * comes from a hand-edited or stale URL and falls back to the tab's default
 * rather than rendering an empty panel.
 */
export function resolveSection(tab: OverviewTab, value: unknown): OverviewSection {
  const allowed = SECTIONS[tab];
  return allowed.includes(value as OverviewSection)
    ? (value as OverviewSection)
    : allowed[0];
}
