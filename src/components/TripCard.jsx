import { Link } from 'react-router-dom';
import { countTripDays, formatTripDateRange } from '../utils/dateUtils.js';

export default function TripCard({ trip, onDelete }) {
  const days = countTripDays(trip.startDate, trip.endDate);
  const initials = trip.destination.slice(0, 2).toUpperCase();

  return (
    <article className="trip-card">
      <div className="trip-cover" style={{ backgroundColor: trip.coverColor }}>
        <span>{initials}</span>
      </div>
      <div className="trip-info">
        <div>
          <p className="trip-destination">{trip.destination}</p>
          <h3>{trip.name}</h3>
        </div>
        <dl className="trip-meta">
          <div>
            <dt>日期</dt>
            <dd>{formatTripDateRange(trip.startDate, trip.endDate)}</dd>
          </div>
          <div>
            <dt>天數</dt>
            <dd>{days || '未設定'} 天</dd>
          </div>
        </dl>
        <div className="trip-actions">
          <Link className="ghost-link" to={`/trip/${trip.id}`}>
            查看行程
          </Link>
          <button
            type="button"
            className="delete-button"
            onClick={() => onDelete(trip.id)}
          >
            刪除
          </button>
        </div>
      </div>
    </article>
  );
}
