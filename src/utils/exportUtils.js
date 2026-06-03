import { formatDate, formatTripDateRange } from './dateUtils.js';

export function buildTripSummary(trip) {
  const lines = [
    trip.name,
    `${trip.destination} · ${formatTripDateRange(trip.startDate, trip.endDate)}`,
    '',
  ];

  trip.days.forEach((day, index) => {
    lines.push(`Day ${index + 1} - ${formatDate(day.date)}`);

    if (day.items.length === 0) {
      lines.push('尚未安排');
    } else {
      day.items.forEach((item) => {
        const time = item.time ? `${item.time} ` : '';
        const note = item.note ? ` - ${item.note}` : '';
        lines.push(`${time}${item.title}（${item.category}）${note}`);
      });
    }

    lines.push('');
  });

  return lines.join('\n').trim();
}
