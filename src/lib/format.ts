export function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-AU', { year: 'numeric', month: 'short', day: '2-digit' });
}
export function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' });
}
export function formatMoney(value: number, currency = 'AUD') {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency }).format(value);
}
export function formatNumber(value: number) {
  return new Intl.NumberFormat('en-AU').format(value);
}
