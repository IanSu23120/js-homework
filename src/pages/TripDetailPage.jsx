import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet';
import { useTrips } from '../context/TripContext.jsx';
import { getCityByDestination } from '../data/cities.js';
import { formatDate, formatTripDateRange } from '../utils/dateUtils.js';
import { buildTripSummary } from '../utils/exportUtils.js';

const categories = ['景點', '餐廳', '交通', '住宿'];
const categoryColors = {
  景點: '#2F80ED',
  餐廳: '#F2994A',
  交通: '#7B61FF',
  住宿: '#00A676',
};

const emptyForm = {
  time: '',
  title: '',
  category: '景點',
  note: '',
  lat: '',
  lng: '',
};

function DetailMapFocus({ item, center }) {
  const map = useMap();

  useEffect(() => {
    if (item?.lat && item?.lng) {
      map.flyTo([item.lat, item.lng], 14, { duration: 0.5 });
      return;
    }
    map.flyTo(center, 11, { duration: 0.5 });
  }, [item, center, map]);

  return null;
}

export default function TripDetailPage() {
  const { tripId } = useParams();
  const {
    trips,
    addManualScheduleItem,
    updateScheduleItem,
    deleteScheduleItem,
  } = useTrips();
  const trip = trips.find((item) => item.id === tripId);
  const [selectedDate, setSelectedDate] = useState(trip?.days[0]?.date || '');
  const [activeItemId, setActiveItemId] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [copyStatus, setCopyStatus] = useState('');

  if (!trip) return <Navigate to="/" replace />;

  const selectedDay = trip.days.find((day) => day.date === selectedDate) || trip.days[0];
  const dayItems = selectedDay?.items || [];
  const activeItem = dayItems.find((item) => item.id === activeItemId);
  const city = getCityByDestination(trip.destination);
  const mapCenter = city?.center || [35.6812, 139.7671];
  const itemsWithLocation = dayItems.filter((item) => item.lat && item.lng);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function submitItem(event) {
    event.preventDefault();
    if (!form.title.trim() || !selectedDay) return;
    addManualScheduleItem(trip.id, selectedDay.date, {
      ...form,
      title: form.title.trim(),
      note: form.note.trim(),
    });
    setForm(emptyForm);
  }

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(buildTripSummary(trip));
      setCopyStatus('已複製');
    } catch {
      setCopyStatus('複製失敗');
    }

    window.setTimeout(() => setCopyStatus(''), 1800);
  }

  return (
    <main className="app-shell">
      <header className="detail-header">
        <Link className="back-link" to="/planner">
          ← 回功能頁
        </Link>
        <div>
          <p className="eyebrow">{trip.destination}</p>
          <h1>{trip.name}</h1>
          <p>{formatTripDateRange(trip.startDate, trip.endDate)}</p>
        </div>
        <button className="primary-button detail-copy-button" onClick={copySummary}>
          複製行程摘要
        </button>
        {copyStatus && <span className="copy-status">{copyStatus}</span>}
      </header>

      <section className="detail-layout">
        <aside className="day-sidebar">
          <h2>日期</h2>
          <div className="day-tabs">
            {trip.days.map((day, index) => (
              <button
                className={day.date === selectedDate ? 'day-tab is-active' : 'day-tab'}
                key={day.date}
                onClick={() => {
                  setSelectedDate(day.date);
                  setActiveItemId('');
                }}
              >
                <strong>Day {index + 1}</strong>
                <span>{formatDate(day.date)}</span>
              </button>
            ))}
          </div>
        </aside>

        <section className="schedule-panel">
          <div className="section-title">
            <div>
              <h2>{formatDate(selectedDay?.date)} 行程</h2>
              <p>點選行程會同步移動地圖；時間、類別與備註可直接修改。</p>
            </div>
          </div>

          <form className="schedule-form" onSubmit={submitItem}>
            <input
              type="time"
              name="time"
              value={form.time}
              onChange={updateField}
              aria-label="時間"
            />
            <input
              name="title"
              value={form.title}
              onChange={updateField}
              placeholder="新增行程項目"
              required
            />
            <select name="category" value={form.category} onChange={updateField}>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <button className="primary-button">新增</button>
            <textarea
              name="note"
              value={form.note}
              onChange={updateField}
              placeholder="備註"
            />
          </form>

          <div className="schedule-list">
            {dayItems.length > 0 ? (
              dayItems.map((item) => (
                <ScheduleItem
                  key={item.id}
                  item={item}
                  isActive={item.id === activeItemId}
                  onFocus={() => setActiveItemId(item.id)}
                  onUpdate={(updates) =>
                    updateScheduleItem(trip.id, selectedDay.date, item.id, updates)
                  }
                  onDelete={() => deleteScheduleItem(trip.id, selectedDay.date, item.id)}
                />
              ))
            ) : (
              <div className="empty-state compact-empty">
                <h3>這天還沒有行程</h3>
                <p>可以新增自訂項目，或回首頁從地圖探索加入推薦景點。</p>
              </div>
            )}
          </div>
        </section>

        <section className="detail-map-panel">
          <MapContainer center={mapCenter} zoom={11} scrollWheelZoom className="detail-map">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <DetailMapFocus item={activeItem} center={mapCenter} />
            {itemsWithLocation.map((item) => (
              <CircleMarker
                key={item.id}
                center={[item.lat, item.lng]}
                radius={item.id === activeItemId ? 11 : 8}
                pathOptions={{
                  color: item.id === activeItemId ? '#1d252c' : categoryColors[item.category] || '#2F80ED',
                  fillColor: categoryColors[item.category] || '#2F80ED',
                  fillOpacity: 0.86,
                }}
                eventHandlers={{
                  click: () => setActiveItemId(item.id),
                }}
              >
                <Popup>
                  <strong>{item.title}</strong>
                  <p>{item.note || item.category}</p>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </section>
      </section>
    </main>
  );
}

function ScheduleItem({ item, isActive, onFocus, onUpdate, onDelete }) {
  return (
    <article className={isActive ? 'schedule-item is-active' : 'schedule-item'} onClick={onFocus}>
      <div className="schedule-main">
        <input
          type="time"
          value={item.time || ''}
          onChange={(event) => onUpdate({ time: event.target.value })}
          aria-label="修改時間"
        />
        <input
          value={item.title}
          onChange={(event) => onUpdate({ title: event.target.value })}
          aria-label="修改標題"
        />
        <select
          value={item.category}
          onChange={(event) => onUpdate({ category: event.target.value })}
          aria-label="修改類別"
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <button type="button" className="delete-button" onClick={onDelete}>
          刪除
        </button>
      </div>
      <textarea
        value={item.note || ''}
        onChange={(event) => onUpdate({ note: event.target.value })}
        placeholder="備註"
      />
    </article>
  );
}
