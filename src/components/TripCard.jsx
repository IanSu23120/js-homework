import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { countTripDays, formatTripDateRange } from '../utils/dateUtils.js';

export default function TripCard({
  trip,
  groups,
  currentUserId,
  onDelete,
  onChangeGroup,
}) {
  const days = countTripDays(trip.startDate, trip.endDate);
  const initials = trip.destination.slice(0, 2).toUpperCase();
  const [selectedGroup, setSelectedGroup] = useState(trip.group || '');
  const [isSavingGroup, setIsSavingGroup] = useState(false);
  const isOwner = trip.ownerId === currentUserId;

  useEffect(() => {
    setSelectedGroup(trip.group || '');
  }, [trip.group]);

  async function changeGroup(event) {
    const nextGroup = event.target.value;
    const previousGroup = selectedGroup;
    setSelectedGroup(nextGroup);
    setIsSavingGroup(true);

    const saved = await onChangeGroup(trip.id, nextGroup);
    if (!saved) {
      setSelectedGroup(previousGroup);
    }
    setIsSavingGroup(false);
  }

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
        <label className="trip-share-control">
          分享設定
          {isOwner ? (
            <select
              value={selectedGroup}
              onChange={changeGroup}
              disabled={isSavingGroup}
            >
              <option value="">不分享給群組</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  分享至 {group.name}
                </option>
              ))}
            </select>
          ) : (
            <span>
              {groups.find((group) => group.id === trip.group)?.name || '群組共享行程'}
            </span>
          )}
        </label>
        <div className="trip-actions">
          <Link className="ghost-link" to={`/trip/${trip.id}`}>
            查看行程
          </Link>
          {isOwner && (
            <button
              type="button"
              className="delete-button"
              onClick={() => onDelete(trip.id)}
            >
              刪除
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
