export function getDaysUntilExpiry(expireDate: string): number {
  const diff = new Date(expireDate).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0);
  return Math.floor(diff / 86_400_000);
}

export function expireDateFromDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}
