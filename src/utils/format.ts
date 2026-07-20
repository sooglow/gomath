export function formatTime(date: Date) {
  return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}
