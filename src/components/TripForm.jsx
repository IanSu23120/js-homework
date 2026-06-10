import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { coverColors } from '../data/starterTrips.js';
import { attractions } from '../data/attractions.js';
import { destinationCities } from '../data/cities.js';
import { createTripDays } from '../utils/dateUtils.js';
import TripSetupAssistant from './TripSetupAssistant.jsx';

const initialForm = {
  name: '',
  destination: '',
  startDate: '',
  endDate: '',
  coverColor: coverColors[0],
  group: '',
};

function makeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `trip-${Date.now()}`;
}

export default function TripForm({ onClose, onSubmit }) {
  const { authFetch, user } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [selectedAttractionIds, setSelectedAttractionIds] = useState([]);
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    let active = true;

    async function loadGroups() {
      if (!user) return;
      try {
        const data = await authFetch('/api/groups/');
        if (active) setGroups(data);
      } catch (err) {
        console.error('Failed to load groups:', err);
      }
    }

    loadGroups();
    return () => {
      active = false;
    };
  }, [authFetch, user]);

  const isValid =
    form.name.trim() &&
    form.destination.trim() &&
    form.startDate &&
    form.endDate &&
    new Date(form.startDate) <= new Date(form.endDate);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function submitForm(event) {
    event.preventDefault();
    if (!isValid) return;

    const selectedAttractions = attractions.filter((attraction) =>
      selectedAttractionIds.includes(attraction.id),
    );
    const days = createTripDays(form.startDate, form.endDate);
    const daysWithRecommendations = days.map((day, index) => {
      if (index !== 0) return day;

      return {
        ...day,
        items: selectedAttractions.map((attraction) => ({
          id: `item-${attraction.id}-${Date.now()}`,
          time: '',
          title: attraction.name,
          category: attraction.category,
          note: attraction.description,
          lat: attraction.lat,
          lng: attraction.lng,
        })),
      };
    });

    onSubmit({
      trip: {
        id: makeId(),
        name: form.name.trim(),
        destination: form.destination.trim(),
        startDate: form.startDate,
        endDate: form.endDate,
        coverColor: form.coverColor,
        group: form.group || null,
        days: daysWithRecommendations,
        expenses: [],
      },
      selectedAttractions,
    });
  }

  function toggleAttraction(id) {
    setSelectedAttractionIds((current) =>
      current.includes(id)
        ? current.filter((attractionId) => attractionId !== id)
        : [...current, id],
    );
  }

  return (
    <div className="modal-backdrop">
      <section
        className="trip-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="trip-form-title"
      >
        <div className="modal-header">
          <h2 id="trip-form-title">新增旅程</h2>
          <button className="icon-button" onClick={onClose} aria-label="關閉">
            ×
          </button>
        </div>

        <form className="trip-form" onSubmit={submitForm}>
          <label>
            旅程名稱
            <input
              name="name"
              value={form.name}
              onChange={updateField}
              placeholder="東京五日遊"
              required
            />
          </label>

          <label>
            目的地城市
            <select
              name="destination"
              value={form.destination}
              onChange={updateField}
              required
            >
              <option value="">請選擇城市</option>
              {destinationCities.map((city) => (
                <option key={city.value} value={city.value}>
                  {city.label}
                </option>
              ))}
            </select>
          </label>

          <div className="form-row">
            <label>
              出發日期
              <input
                type="date"
                name="startDate"
                value={form.startDate}
                onChange={updateField}
                required
              />
            </label>
            <label>
              回程日期
              <input
                type="date"
                name="endDate"
                value={form.endDate}
                min={form.startDate}
                onChange={updateField}
                required
              />
            </label>
          </div>

          <fieldset>
            <legend>封面顏色</legend>
            <div className="color-options">
              {coverColors.map((color) => (
                <label className="color-option" key={color}>
                  <input
                    type="radio"
                    name="coverColor"
                    value={color}
                    checked={form.coverColor === color}
                    onChange={updateField}
                  />
                  <span style={{ backgroundColor: color }} />
                </label>
              ))}
            </div>
          </fieldset>

          {groups.length > 0 && (
            <label>
              群組旅程（選填）
              <select name="group" value={form.group} onChange={updateField}>
                <option value="">獨立旅程</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <TripSetupAssistant
            destination={form.destination}
            startDate={form.startDate}
            endDate={form.endDate}
            selectedAttractionIds={selectedAttractionIds}
            onToggleAttraction={toggleAttraction}
          />

          <button className="primary-button form-submit" disabled={!isValid}>
            儲存旅程
          </button>
        </form>
      </section>
    </div>
  );
}
