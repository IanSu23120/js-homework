function parseDate(date) {
  if (!date) return null;

  const parsed = new Date(`${date}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toDateInputValue(date) {
  return date.toISOString().slice(0, 10);
}

export function formatDate(date) {
  const parsed = parseDate(date);
  if (!parsed) return '未設定';

  return new Intl.DateTimeFormat('zh-TW', {
    month: 'short',
    day: 'numeric',
  }).format(parsed);
}

export function formatTripDateRange(startDate, endDate) {
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
}

export function countTripDays(startDate, endDate) {
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  if (!start || !end || start > end) return 0;

  return Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
}

export function createTripDays(startDate, endDate) {
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  if (!start || !end || start > end) return [];

  const days = [];
  const current = new Date(start);

  while (current <= end) {
    days.push({
      date: toDateInputValue(current),
      items: [],
    });
    current.setDate(current.getDate() + 1);
  }

  return days;
}

export function getNextTrip(trips) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return [...trips]
    .filter((trip) => {
      const start = parseDate(trip.startDate);
      return start && start >= today;
    })
    .sort((a, b) => parseDate(a.startDate) - parseDate(b.startDate))[0];
}
