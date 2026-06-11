import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet';
import { useAuth } from '../context/AuthContext.jsx';
import { useTrips } from '../context/TripContext.jsx';
import { fetchNearbyPlaces, fetchPlaceDetails } from '../api/places.js';
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
  const { authFetch, user } = useAuth();
  const {
    trips,
    addScheduleItem,
    addManualScheduleItem,
    updateScheduleItem,
    deleteScheduleItem,
  } = useTrips();
  const trip = trips.find((item) => item.id === tripId);
  const [selectedDate, setSelectedDate] = useState(trip?.days[0]?.date || '');
  const [activeItemId, setActiveItemId] = useState('');
  const [activePoint, setActivePoint] = useState(null);
  const [nearbyRecommendations, setNearbyRecommendations] = useState([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [selectedRecommendationId, setSelectedRecommendationId] = useState(null);
  const [selectedPlaceDetails, setSelectedPlaceDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [recommendationFilter, setRecommendationFilter] = useState('all');
  const [form, setForm] = useState(emptyForm);
  const [copyStatus, setCopyStatus] = useState('');

  if (!trip) return <Navigate to="/" replace />;

  const selectedDay = trip.days.find((day) => day.date === selectedDate) || trip.days[0];
  const dayItems = selectedDay?.items || [];
  const sortedDayItems = [...dayItems].sort((a, b) => {
    const timeA = a.time || '23:59';
    const timeB = b.time || '23:59';
    return timeA.localeCompare(timeB);
  });
  const activeItem = sortedDayItems.find((item) => item.id === activeItemId);
  const city = getCityByDestination(trip.destination);
  const mapCenter = city?.center || [35.6812, 139.7671];
  const itemsWithLocation = dayItems.filter((item) => item.lat && item.lng);

  useEffect(() => {
    let active = true;

    async function loadRecommendations() {
      if (!trip.destination) {
        setNearbyRecommendations([]);
        return;
      }

      setRecommendationsLoading(true);
      try {
        const places = await fetchNearbyPlaces(trip.destination, 8);
        if (active) {
          setNearbyRecommendations(places);
        }
      } catch (err) {
        console.error('Failed to load nearby places:', err);
        if (active) {
          setNearbyRecommendations([]);
        }
      } finally {
        if (active) setRecommendationsLoading(false);
      }
    }

    loadRecommendations();
    return () => {
      active = false;
    };
  }, [trip.destination]);

  const activeMapPoint = activePoint || activeItem || null;
  const filteredRecommendations = nearbyRecommendations.filter((place) =>
    recommendationFilter === 'all' ? true : place.category === recommendationFilter,
  );

  async function addRecommendedPlace(place) {
    if (!selectedDay) return;

    const scheduleItem = await addScheduleItem(trip.id, selectedDay.date, {
      name: place.name,
      category: place.category || '景點',
      description: place.description || '',
      lat: place.lat,
      lng: place.lng,
    });

    if (!scheduleItem) return;

    setActiveItemId(scheduleItem.id);
    setActivePoint({
      ...scheduleItem,
      type: 'schedule',
    });
  }

  async function loadPlaceDetails(place) {
    if (!place?.placeId) return;
    if (selectedPlaceDetails?.placeId === place.placeId) return;

    setDetailsLoading(true);
    setSelectedPlaceDetails(null);
    try {
      const details = await fetchPlaceDetails(place.placeId);
      setSelectedPlaceDetails(details);
    } catch (err) {
      console.error('Failed to load place details:', err);
    } finally {
      setDetailsLoading(false);
    }
  }

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submitItem(event) {
    event.preventDefault();
    if (!form.title.trim() || !selectedDay) return;

    const scheduleData = {
      time: form.time,
      title: form.title.trim(),
      category: '景點',
      note: form.note.trim(),
      lat: form.lat,
      lng: form.lng,
    };

    addManualScheduleItem(trip.id, selectedDay.date, scheduleData);

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
        <div className="detail-actions">
          <Link className="ghost-link" to="/">
            回到首頁
          </Link>
          <Link className="ghost-link" to={`/trip/${trip.id}/expenses`}>
            費用管理
          </Link>
          <Link className="ghost-link" to={`/trip/${trip.id}/suggestions`}>
            提案與投票
          </Link>
          <button className="primary-button detail-copy-button" onClick={copySummary}>
            複製行程摘要
          </button>
        </div>
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
              <p>點選行程會同步移動地圖；時間與備註可直接修改，費用請在下方快速記帳區新增。</p>
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
            <button className="primary-button">新增</button>
          </form>

          <div className="schedule-list schedule-card-list">
            {sortedDayItems.length > 0 ? (
              sortedDayItems.map((item) => (
                <ScheduleItem
                  key={item.id}
                  item={item}
                  tripId={trip.id}
                  tripDate={selectedDay.date}
                  tripExpenses={trip.expenses}
                  isActive={item.id === activeItemId}
                  onFocus={() => {
                    setActiveItemId(item.id);
                    setActivePoint({ ...item, type: 'schedule' });
                  }}
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

          <section className="recommendation-panel">
            <div className="section-title">
              <div>
                <h2>附近推薦</h2>
                <p>點選推薦地點即可同步移動地圖，幫你直接預覽附近可加的景點或餐廳。</p>
              </div>
              <div className="recommendation-controls">
                {['all', '景點', '餐廳'].map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={
                      recommendationFilter === option
                        ? 'secondary-button is-active'
                        : 'secondary-button'
                    }
                    onClick={() => setRecommendationFilter(option)}
                  >
                    {option === 'all' ? '全部' : option}
                  </button>
                ))}
              </div>
            </div>

            {recommendationsLoading ? (
              <div className="empty-state compact-empty">
                <h3>載入中...</h3>
                <p>正在從 Google Places 擷取附近景點與餐廳。</p>
              </div>
            ) : filteredRecommendations.length > 0 ? (
              <div className="recommendation-list">
                {filteredRecommendations.map((place) => (
                  <article
                    key={place.id}
                    className={
                      activePoint?.type === 'recommendation' && activePoint?.id === `recommend-${place.id}`
                        ? 'recommendation-card is-active'
                        : 'recommendation-card'
                    }
                  >
                    <button
                      type="button"
                      className="recommendation-select"
                      onClick={() => {
                        setActiveItemId('');
                        setSelectedRecommendationId(place.placeId);
                        setSelectedPlaceDetails(null);
                        setActivePoint({
                          id: `recommend-${place.placeId}`,
                          type: 'recommendation',
                          title: place.name,
                          note: place.description,
                          category: place.category,
                          lat: place.lat,
                          lng: place.lng,
                          placeId: place.placeId,
                        });
                      }}
                    >
                      <div>
                        <strong>{place.name}</strong>
                        <span>{place.category}</span>
                      </div>
                      <p>{place.description}</p>
                    </button>
                    <div className="recommendation-actions">
                      <button
                        type="button"
                        className="secondary-button recommendation-add-button"
                        onClick={() => addRecommendedPlace(place)}
                      >
                        加入行程
                      </button>
                      <button
                        type="button"
                        className="secondary-button recommendation-details-button"
                        onClick={() => loadPlaceDetails(place)}
                        disabled={detailsLoading && selectedRecommendationId === place.placeId}
                      >
                        {detailsLoading && selectedRecommendationId === place.placeId
                          ? '載入中...'
                          : '更多資訊'}
                      </button>
                    </div>
                    {selectedPlaceDetails?.placeId === place.placeId && (
                      <div className="place-details-card">
                        <p><strong>地址：</strong>{selectedPlaceDetails.address}</p>
                        {selectedPlaceDetails.phoneNumber && (
                          <p><strong>電話：</strong>{selectedPlaceDetails.phoneNumber}</p>
                        )}
                        {selectedPlaceDetails.rating && (
                          <p><strong>評分：</strong>{selectedPlaceDetails.rating}</p>
                        )}
                        {selectedPlaceDetails.website && (
                          <p>
                            <strong>網站：</strong>
                            <a href={selectedPlaceDetails.website} target="_blank" rel="noreferrer">
                              前往官網
                            </a>
                          </p>
                        )}
                        {selectedPlaceDetails.url && (
                          <p>
                            <strong>Google Maps：</strong>
                            <a href={selectedPlaceDetails.url} target="_blank" rel="noreferrer">
                              查看地圖頁面
                            </a>
                          </p>
                        )}
                        {selectedPlaceDetails.openingHours.length > 0 && (
                          <div>
                            <strong>營業時間：</strong>
                            <ul>
                              {selectedPlaceDetails.openingHours.map((line) => (
                                <li key={line}>{line}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state compact-empty">
                <h3>目前沒有推薦</h3>
                <p>這個目的地暫時還沒有可顯示的推薦地點。</p>
              </div>
            )}
          </section>
        </section>

        <section className="detail-map-panel">
          <MapContainer center={mapCenter} zoom={11} scrollWheelZoom className="detail-map">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <DetailMapFocus item={activeMapPoint} center={mapCenter} />
            {itemsWithLocation.map((item) => (
              <CircleMarker
                key={`schedule-${item.id}`}
                center={[item.lat, item.lng]}
                radius={item.id === activeItemId ? 11 : 8}
                pathOptions={{
                  color: item.id === activeItemId ? '#1d252c' : categoryColors[item.category] || '#2F80ED',
                  fillColor: categoryColors[item.category] || '#2F80ED',
                  fillOpacity: 0.86,
                }}
                eventHandlers={{
                  click: () => {
                    setActiveItemId(item.id);
                    setActivePoint({ ...item, type: 'schedule' });
                  },
                }}
              >
                <Popup>
                  <strong>{item.title}</strong>
                  <p>{item.note || item.category}</p>
                </Popup>
              </CircleMarker>
            ))}
            {nearbyRecommendations.map((place) => (
              <CircleMarker
                key={`recommend-${place.id}`}
                center={[place.lat, place.lng]}
                radius={activePoint?.id === `recommend-${place.id}` ? 11 : 8}
                pathOptions={{
                  color: activePoint?.id === `recommend-${place.id}` ? '#d35400' : '#f2994a',
                  fillColor: '#f5b577',
                  fillOpacity: 0.75,
                }}
                eventHandlers={{
                  click: () => {
                    setActiveItemId('');
                    setActivePoint({
                      id: `recommend-${place.id}`,
                      type: 'recommendation',
                      title: place.name,
                      note: place.description,
                      category: place.category,
                      lat: place.lat,
                      lng: place.lng,
                    });
                  },
                }}
              >
                <Popup>
                  <strong>{place.name}</strong>
                  <p>{place.description}</p>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </section>
      </section>
    </main>
  );
}

function ScheduleItem({
  item,
  tripId,
  tripDate,
  tripExpenses,
  isActive,
  onFocus,
  onUpdate,
  onDelete,
}) {
  const { authFetch, user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [titleDraft, setTitleDraft] = useState(item.title || '');
  const [comments, setComments] = useState(item.comments || []);
  const [additionalNote, setAdditionalNote] = useState('');
  const [isNoteFormOpen, setIsNoteFormOpen] = useState(false);
  const [noteError, setNoteError] = useState('');
  const [expenseDraft, setExpenseDraft] = useState({
    amount: '',
    currency: 'TWD',
    note: '',
  });
  const [expenses, setExpenses] = useState(() =>
    tripExpenses.filter((expense) => expense.schedule_item === item.id),
  );

  useEffect(() => {
    setTitleDraft(item.title || '');
  }, [item.title]);

  useEffect(() => {
    setComments(item.comments || []);
  }, [item.comments]);

  useEffect(() => {
    setExpenses(tripExpenses.filter((expense) => expense.schedule_item === item.id));
  }, [tripExpenses, item.id]);

  function saveTitle() {
    const nextTitle = titleDraft.trim();

    if (!nextTitle) {
      setTitleDraft(item.title || '');
      return;
    }

    if (nextTitle === item.title) return;
    onUpdate({ title: nextTitle });
  }

  function handleTitleKeyDown(event) {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    saveTitle();
    event.currentTarget.blur();
  }

  async function submitAdditionalNote(event) {
    event.preventDefault();
    const nextNote = additionalNote.trim();
    if (!nextNote) return;

    setNoteError('');
    try {
      const createdComment = await authFetch('/api/schedule-item-comments/', {
        method: 'POST',
        body: {
          schedule_item: item.id,
          content: nextNote,
        },
      });
      setComments((current) => [...current, createdComment]);
      setAdditionalNote('');
      setIsNoteFormOpen(false);
    } catch (err) {
      console.error('Failed to save note:', err);
      setNoteError(
        err.status === 404
          ? '找不到備註 API，請重新啟動 Django 後端後再試。'
          : err.detail || '新增備註失敗，請稍後再試。',
      );
    }
  }

  async function submitExpense(event) {
    event.preventDefault();
    if (!expenseDraft.amount || !user) return;

    try {
      const createdExpense = await authFetch('/api/expenses/', {
        method: 'POST',
        body: {
          trip: tripId,
          schedule_item: item.id,
          amount: Number(expenseDraft.amount),
          currency: expenseDraft.currency,
          category: '其他',
          date: tripDate,
          note: expenseDraft.note.trim(),
          shared: false,
        },
      });
      setExpenses((current) => [...current, createdExpense]);
      setExpenseDraft({ amount: '', currency: 'TWD', note: '' });
    } catch (err) {
      console.error('Failed to save expense:', err);
    }
  }

  return (
    <article
      className={`${isActive ? 'schedule-item is-active' : 'schedule-item'} ${
        isExpanded ? 'is-expanded' : 'is-collapsed'
      }`}
      onClick={onFocus}
    >
      <div className="schedule-collapse-header">
        <button
          type="button"
          className="schedule-collapse-button"
          aria-expanded={isExpanded}
          onClick={(event) => {
            event.stopPropagation();
            setIsExpanded((current) => !current);
            onFocus();
          }}
        >
          <span className="schedule-collapse-time">{item.time || '未設定時間'}</span>
          <strong>{item.title || '未命名行程'}</strong>
          <span aria-hidden="true">{isExpanded ? '收合' : '展開'}</span>
        </button>
      </div>
      {isExpanded && (
        <div className="schedule-item-details">
          <div className="schedule-main">
            <input
              type="time"
              value={item.time || ''}
              onChange={(event) => onUpdate({ time: event.target.value })}
              aria-label="修改時間"
              onClick={(event) => event.stopPropagation()}
            />
            <input
              value={titleDraft}
              onChange={(event) => setTitleDraft(event.target.value)}
              onBlur={saveTitle}
              onKeyDown={handleTitleKeyDown}
              placeholder="行程名稱"
              aria-label="修改標題"
              onClick={(event) => event.stopPropagation()}
            />
            <button type="button" className="delete-button" onClick={onDelete}>
              刪除
            </button>
          </div>
          {(item.note?.trim() || comments.length > 0) && (
            <div className="item-comment-list" onClick={(event) => event.stopPropagation()}>
              {item.note?.trim() && (
                <article className="item-comment">
                  <strong>{item.creator?.username || '原始備註'}</strong>
                  <p>{item.note}</p>
                </article>
              )}
              {comments.map((comment) => (
                <article className="item-comment" key={comment.id}>
                  <strong>{comment.author?.username || '使用者'}</strong>
                  <p>{comment.content}</p>
                </article>
              ))}
            </div>
          )}
          {isNoteFormOpen ? (
            <form
              className="item-note-form"
              onSubmit={submitAdditionalNote}
              onClick={(event) => event.stopPropagation()}
            >
              <label>
                新增備註
                <input
                  value={additionalNote}
                  onChange={(event) => setAdditionalNote(event.target.value)}
                  placeholder="輸入備註"
                  autoFocus
                />
              </label>
              <button className="secondary-button" type="submit" disabled={!additionalNote.trim()}>
                儲存備註
              </button>
              <button
                className="ghost-link"
                type="button"
                onClick={() => {
                  setAdditionalNote('');
                  setIsNoteFormOpen(false);
                }}
              >
                取消
              </button>
              {noteError && <p className="form-error item-note-error">{noteError}</p>}
            </form>
          ) : (
            <button
              className="secondary-button add-note-button"
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setIsNoteFormOpen(true);
              }}
            >
              新增備註
            </button>
          )}
          {expenses.length > 0 && (
            <div className="item-expense-list" onClick={(event) => event.stopPropagation()}>
              {expenses.map((expense) => (
                <div className="item-expense-record" key={expense.id}>
                  <div>
                    <span>記帳者：{expense.payer?.username || '使用者'}</span>
                    {expense.note && <p>{expense.note}</p>}
                  </div>
                  <strong>
                    {expense.amount} {expense.currency}
                  </strong>
                </div>
              ))}
            </div>
          )}
          <form className="item-expense-form" onSubmit={submitExpense} onClick={(event) => event.stopPropagation()}>
            <label>
              金額
              <input
                name="amount"
                type="number"
                min="0"
                step="0.01"
                value={expenseDraft.amount}
                onChange={(event) => setExpenseDraft((current) => ({ ...current, amount: event.target.value }))}
                placeholder="費用"
              />
            </label>
            <label>
              幣別
              <select
                name="currency"
                value={expenseDraft.currency}
                onChange={(event) => setExpenseDraft((current) => ({ ...current, currency: event.target.value }))}
              >
                <option value="TWD">TWD</option>
                <option value="JPY">JPY</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </label>
            <label className="expense-note-field">
              費用備註
              <input
                name="note"
                value={expenseDraft.note}
                onChange={(event) =>
                  setExpenseDraft((current) => ({ ...current, note: event.target.value }))
                }
                placeholder="例如：午餐、車票"
              />
            </label>
            <button className="secondary-button" type="submit" disabled={!user || !expenseDraft.amount}>
              記帳
            </button>
          </form>
        </div>
      )}
    </article>
  );
}
