export function todayKey(now: Date = new Date()): string {
  return now.toDateString();
}
