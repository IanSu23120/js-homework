import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import { fetchNearbyPlaces } from '../api/places.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useTrips } from '../context/TripContext.jsx';
import { getCityByDestination } from '../data/cities.js';
import { formatDate, formatTripDateRange } from '../utils/dateUtils.js';

const categories = ['景點', '餐廳', '交通', '住宿', '其他'];
const emptyForm = {
  title: '',
  category: '景點',
  description: '',
  placeId: '',
  lat: null,
  lng: null,
};

function MapFocus({ point, center }) {
  const map = useMap();

  useEffect(() => {
    if (Number.isFinite(point?.lat) && Number.isFinite(point?.lng)) {
      map.flyTo([point.lat, point.lng], 14, { duration: 0.5 });
      return;
    }
    map.flyTo(center, 12, { duration: 0.5 });
  }, [center, map, point]);

  return null;
}

function MapClickSelector({ onSelect }) {
  useMapEvents({
    click(event) {
      onSelect({
        placeId: '',
        lat: event.latlng.lat,
        lng: event.latlng.lng,
      });
    },
  });
  return null;
}

export default function TripSuggestionsPage() {
  const { tripId } = useParams();
  const { authFetch, user } = useAuth();
  const { trips, isLoading: tripsLoading, refreshTrip } = useTrips();
  const trip = trips.find((item) => item.id === tripId);
  const [group, setGroup] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [acceptDates, setAcceptDates] = useState({});
  const [acceptTimes, setAcceptTimes] = useState({});
  const [activePoint, setActivePoint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [placesLoading, setPlacesLoading] = useState(false);
  const [placesError, setPlacesError] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const city = useMemo(
    () => getCityByDestination(trip?.destination || ''),
    [trip?.destination],
  );
  const mapCenter = city?.center || [25.033, 121.5654];

  useEffect(() => {
    if (!trip?.group) {
      setLoading(false);
      return;
    }

    let active = true;
    async function loadData() {
      setLoading(true);
      try {
        const [groupData, suggestionData] = await Promise.all([
          authFetch(`/api/groups/${trip.group}/`),
          authFetch(`/api/suggestions/?trip=${trip.id}`),
        ]);
        if (!active) return;
        setGroup(groupData);
        setSuggestions(suggestionData);
      } catch (err) {
        if (active) setError(err.detail || '讀取提案失敗。');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();
    return () => {
      active = false;
    };
  }, [authFetch, trip?.group, trip?.id]);

  useEffect(() => {
    if (!trip?.destination) return undefined;

    let active = true;
    async function loadPlaces() {
      setPlacesLoading(true);
      setPlacesError('');
      try {
        const places = await fetchNearbyPlaces(trip.destination, 10);
        if (active) setRecommendations(places);
      } catch (err) {
        if (active) {
          setRecommendations([]);
          setPlacesError('目前無法載入景點推薦，仍可直接點擊地圖設定位置。');
        }
      } finally {
        if (active) setPlacesLoading(false);
      }
    }

    loadPlaces();
    return () => {
      active = false;
    };
  }, [trip?.destination]);

  if (tripsLoading) {
    return <div className="loading-screen">載入旅程中...</div>;
  }

  if (!trip) return <Navigate to="/planner" replace />;

  const isLeader = group?.leader?.id === user?.id;
  const locatedSuggestions = suggestions.filter(
    (item) => Number.isFinite(item.lat) && Number.isFinite(item.lng),
  );

  function clearFeedback() {
    setError('');
    setMessage('');
  }

  function updateForm(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function selectLocation(location) {
    clearFeedback();
    setForm((current) => ({
      ...current,
      title: location.name || current.title,
      category: location.category || current.category,
      description: location.description || current.description,
      placeId: location.placeId || '',
      lat: location.lat,
      lng: location.lng,
    }));
    setActivePoint(location);
  }

  async function createSuggestion(event) {
    event.preventDefault();
    if (!form.title.trim()) return;
    clearFeedback();

    try {
      const created = await authFetch('/api/suggestions/', {
        method: 'POST',
        body: {
          trip: trip.id,
          title: form.title.trim(),
          category: form.category,
          description: form.description.trim(),
          place_id: form.placeId,
          lat: form.lat,
          lng: form.lng,
        },
      });
      setSuggestions((current) => [created, ...current]);
      setForm(emptyForm);
      setActivePoint(created);
      setMessage(`已送出「${created.title}」提案。`);
    } catch (err) {
      setError(err.detail || '新增提案失敗。');
    }
  }

  async function vote(suggestion) {
    clearFeedback();
    try {
      const updated = await authFetch(
        `/api/suggestions/${suggestion.id}/vote/`,
        { method: 'POST' },
      );
      setSuggestions((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (err) {
      setError(err.detail || '投票失敗。');
    }
  }

  function beginEdit(suggestion) {
    setEditingId(suggestion.id);
    setEditForm({
      title: suggestion.title,
      category: suggestion.category,
      description: suggestion.description || '',
    });
  }

  async function saveEdit(suggestion) {
    clearFeedback();
    try {
      const updated = await authFetch(`/api/suggestions/${suggestion.id}/`, {
        method: 'PATCH',
        body: {
          title: editForm.title.trim(),
          category: editForm.category,
          description: editForm.description.trim(),
        },
      });
      setSuggestions((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setEditingId(null);
      setMessage(`已更新「${updated.title}」。`);
    } catch (err) {
      setError(err.detail || '更新提案失敗。');
    }
  }

  async function deleteSuggestion(suggestion) {
    if (!window.confirm(`確定刪除「${suggestion.title}」提案嗎？`)) return;
    clearFeedback();
    try {
      await authFetch(`/api/suggestions/${suggestion.id}/`, {
        method: 'DELETE',
      });
      setSuggestions((current) =>
        current.filter((item) => item.id !== suggestion.id),
      );
    } catch (err) {
      setError(err.detail || '刪除提案失敗。');
    }
  }

  async function acceptSuggestion(suggestion) {
    const selectedDate = acceptDates[suggestion.id] || trip.days[0]?.date;
    if (!selectedDate) {
      setError('請先選擇要加入的行程日期。');
      return;
    }
    clearFeedback();

    try {
      const updated = await authFetch(
        `/api/suggestions/${suggestion.id}/accept/`,
        {
          method: 'POST',
          body: {
            date: selectedDate,
            time: acceptTimes[suggestion.id] || '',
          },
        },
      );
      setSuggestions((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      await refreshTrip(trip.id);
      setMessage(`已將「${updated.title}」加入 ${selectedDate} 行程。`);
    } catch (err) {
      setError(err.detail || '接受提案失敗。');
    }
  }

  return (
    <main className="app-shell suggestions-page">
      <header className="detail-header suggestions-page-header">
        <Link className="back-link" to={`/trip/${trip.id}`}>
          ← 回到行程
        </Link>
        <div>
          <p className="eyebrow">{trip.destination}</p>
          <h1>提案與投票</h1>
          <p>{trip.name} · {formatTripDateRange(trip.startDate, trip.endDate)}</p>
        </div>
        <div className="detail-actions">
          <Link className="ghost-link" to={`/trip/${trip.id}/expenses`}>
            費用管理
          </Link>
          <Link className="primary-button" to={`/trip/${trip.id}`}>
            查看正式行程
          </Link>
        </div>
      </header>

      {!trip.group ? (
        <section className="content-section suggestion-unavailable">
          <h2>此旅程尚未分享至群組</h2>
          <p>請先在功能頁將旅程分享至群組，群組成員才能共同提案與投票。</p>
          <Link className="primary-button" to="/planner">
            前往功能頁
          </Link>
        </section>
      ) : (
        <>
          {error && <p className="form-error suggestion-feedback">{error}</p>}
          {message && <p className="form-success suggestion-feedback">{message}</p>}

          <section className="suggestion-map-layout">
            <div className="suggestion-map-panel">
              <div className="section-title">
                <div>
                  <h2>從地圖挑選地點</h2>
                  <p>選擇推薦景點，或直接點擊地圖設定提案位置。</p>
                </div>
              </div>

              <MapContainer
                center={mapCenter}
                zoom={12}
                scrollWheelZoom
                className="suggestion-map"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapFocus point={activePoint} center={mapCenter} />
                <MapClickSelector onSelect={selectLocation} />

                {recommendations.map((place) => (
                  <CircleMarker
                    key={place.id}
                    center={[place.lat, place.lng]}
                    radius={8}
                    pathOptions={{ color: '#2563eb', fillOpacity: 0.85 }}
                    eventHandlers={{ click: () => selectLocation(place) }}
                  >
                    <Popup>
                      <strong>{place.name}</strong>
                      <p>{place.category}</p>
                      <button type="button" onClick={() => selectLocation(place)}>
                        選為提案
                      </button>
                    </Popup>
                  </CircleMarker>
                ))}

                {locatedSuggestions.map((suggestion) => (
                  <CircleMarker
                    key={`suggestion-${suggestion.id}`}
                    center={[suggestion.lat, suggestion.lng]}
                    radius={suggestion.accepted ? 10 : 7}
                    pathOptions={{
                      color: suggestion.accepted ? '#20733a' : '#f2994a',
                      fillOpacity: 0.9,
                    }}
                    eventHandlers={{ click: () => setActivePoint(suggestion) }}
                  >
                    <Popup>
                      <strong>{suggestion.title}</strong>
                      <p>{suggestion.accepted ? '已加入行程' : `${suggestion.vote_count} 票`}</p>
                    </Popup>
                  </CircleMarker>
                ))}

                {Number.isFinite(form.lat) && Number.isFinite(form.lng) && (
                  <CircleMarker
                    center={[form.lat, form.lng]}
                    radius={11}
                    pathOptions={{ color: '#111827', fillOpacity: 0.35 }}
                  />
                )}
              </MapContainer>
            </div>

            <aside className="suggestion-recommendations">
              <div className="section-title">
                <div>
                  <h2>附近推薦</h2>
                  <p>{placesLoading ? '正在搜尋...' : `${recommendations.length} 個可提案地點`}</p>
                </div>
              </div>
              {placesError && <p className="map-notice">{placesError}</p>}
              <div className="suggestion-place-list">
                {recommendations.map((place) => (
                  <button
                    type="button"
                    className={
                      activePoint?.placeId === place.placeId
                        ? 'suggestion-place is-active'
                        : 'suggestion-place'
                    }
                    key={place.id}
                    onClick={() => selectLocation(place)}
                  >
                    <span>{place.category}</span>
                    <strong>{place.name}</strong>
                    <small>{place.description}</small>
                  </button>
                ))}
              </div>
            </aside>
          </section>

          <section className="suggestion-content-layout">
            <form className="suggestion-form suggestion-create-form" onSubmit={createSuggestion}>
              <div>
                <h2>新增提案</h2>
                <p>
                  {Number.isFinite(form.lat)
                    ? '已設定地圖位置，送出後成員可在地圖查看。'
                    : '未設定位置，也可以送出一般文字提案。'}
                </p>
              </div>
              <label>
                名稱
                <input
                  name="title"
                  value={form.title}
                  onChange={updateForm}
                  placeholder="例如：景福宮"
                  required
                />
              </label>
              <label>
                類別
                <select name="category" value={form.category} onChange={updateForm}>
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </label>
              <label>
                說明
                <textarea
                  name="description"
                  value={form.description}
                  onChange={updateForm}
                  placeholder="推薦原因、建議時段或注意事項"
                />
              </label>
              {Number.isFinite(form.lat) && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    setForm((current) => ({
                      ...current,
                      placeId: '',
                      lat: null,
                      lng: null,
                    }));
                    setActivePoint(null);
                  }}
                >
                  清除地圖位置
                </button>
              )}
              <button className="primary-button">送出提案</button>
            </form>

            <div className="suggestion-voting-panel">
              <div className="section-title">
                <div>
                  <h2>群組提案</h2>
                  <p>依票數討論；群組創立者可選擇日期後加入正式行程。</p>
                </div>
              </div>

              <div className="suggestion-list">
                {loading ? (
                  <article className="suggestion-card"><p>讀取提案中...</p></article>
                ) : suggestions.length === 0 ? (
                  <article className="suggestion-card">
                    <h3>還沒有提案</h3>
                    <p>從地圖選個地點，成為第一位提案者。</p>
                  </article>
                ) : (
                  suggestions.map((suggestion) => {
                    const canEdit =
                      !suggestion.accepted &&
                      (suggestion.author?.id === user?.id || isLeader);
                    const isEditing = editingId === suggestion.id;

                    return (
                      <article
                        className={
                          suggestion.accepted
                            ? 'suggestion-card is-accepted'
                            : 'suggestion-card'
                        }
                        key={suggestion.id}
                      >
                        {isEditing ? (
                          <div className="suggestion-edit-form">
                            <input
                              name="title"
                              value={editForm.title}
                              onChange={(event) =>
                                setEditForm((current) => ({
                                  ...current,
                                  title: event.target.value,
                                }))
                              }
                            />
                            <select
                              name="category"
                              value={editForm.category}
                              onChange={(event) =>
                                setEditForm((current) => ({
                                  ...current,
                                  category: event.target.value,
                                }))
                              }
                            >
                              {categories.map((category) => (
                                <option key={category} value={category}>{category}</option>
                              ))}
                            </select>
                            <textarea
                              name="description"
                              value={editForm.description}
                              onChange={(event) =>
                                setEditForm((current) => ({
                                  ...current,
                                  description: event.target.value,
                                }))
                              }
                            />
                            <div>
                              <button
                                type="button"
                                className="primary-button"
                                onClick={() => saveEdit(suggestion)}
                              >
                                儲存
                              </button>
                              <button
                                type="button"
                                className="secondary-button"
                                onClick={() => setEditingId(null)}
                              >
                                取消
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="suggestion-card-header">
                              <div>
                                <span>{suggestion.category}</span>
                                <h3>{suggestion.title}</h3>
                              </div>
                              <strong>
                                {suggestion.accepted
                                  ? '已加入行程'
                                  : `${suggestion.vote_count} 票`}
                              </strong>
                            </div>
                            <p>{suggestion.description || '沒有補充說明。'}</p>
                            <p className="suggestion-meta">
                              提案者：{suggestion.author?.username || '未知'}
                            </p>

                            <div className="suggestion-actions">
                              {Number.isFinite(suggestion.lat) && (
                                <button
                                  type="button"
                                  className="secondary-button"
                                  onClick={() => setActivePoint(suggestion)}
                                >
                                  地圖查看
                                </button>
                              )}
                              {!suggestion.accepted && (
                                <button
                                  type="button"
                                  className={
                                    suggestion.has_voted
                                      ? 'secondary-button vote-button is-voted'
                                      : 'secondary-button vote-button'
                                  }
                                  onClick={() => vote(suggestion)}
                                >
                                  {suggestion.has_voted ? '取消投票' : '投贊成票'}
                                </button>
                              )}
                              {canEdit && (
                                <>
                                  <button
                                    type="button"
                                    className="secondary-button"
                                    onClick={() => beginEdit(suggestion)}
                                  >
                                    編輯
                                  </button>
                                  <button
                                    type="button"
                                    className="danger-button"
                                    onClick={() => deleteSuggestion(suggestion)}
                                  >
                                    刪除
                                  </button>
                                </>
                              )}
                            </div>

                            {!suggestion.accepted && isLeader && (
                              <div className="accept-suggestion-panel">
                                <p>選擇加入正式行程的日期與時間</p>
                                <select
                                  value={
                                    acceptDates[suggestion.id]
                                    || trip.days[0]?.date
                                    || ''
                                  }
                                  onChange={(event) =>
                                    setAcceptDates((current) => ({
                                      ...current,
                                      [suggestion.id]: event.target.value,
                                    }))
                                  }
                                  aria-label={`${suggestion.title} 加入日期`}
                                >
                                  {trip.days.map((day, index) => (
                                    <option key={day.date} value={day.date}>
                                      Day {index + 1} · {formatDate(day.date)}
                                    </option>
                                  ))}
                                </select>
                                <input
                                  type="time"
                                  value={acceptTimes[suggestion.id] || ''}
                                  onChange={(event) =>
                                    setAcceptTimes((current) => ({
                                      ...current,
                                      [suggestion.id]: event.target.value,
                                    }))
                                  }
                                  aria-label={`${suggestion.title} 行程時間`}
                                />
                                <button
                                  type="button"
                                  className="primary-button"
                                  onClick={() => acceptSuggestion(suggestion)}
                                >
                                  接受並加入
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </article>
                    );
                  })
                )}
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
