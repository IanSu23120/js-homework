import { useEffect, useMemo, useState } from 'react';
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet';
import { attractions } from '../data/attractions.js';
import { formatDate } from '../utils/dateUtils.js';

const categoryColors = {
  景點: '#2F80ED',
  餐廳: '#F2994A',
  交通: '#7B61FF',
  住宿: '#00A676',
};

function MapFocus({ attraction }) {
  const map = useMap();

  useEffect(() => {
    if (attraction) {
      map.flyTo([attraction.lat, attraction.lng], 13, { duration: 0.6 });
    }
  }, [attraction, map]);

  return null;
}

export default function AttractionExplorer({ trips, onAddAttraction }) {
  const [selectedTripId, setSelectedTripId] = useState(trips[0]?.id || '');
  const selectedTrip = trips.find((trip) => trip.id === selectedTripId) || trips[0];
  const [selectedDate, setSelectedDate] = useState(selectedTrip?.days[0]?.date || '');
  const [selectedAttractionId, setSelectedAttractionId] = useState(attractions[0].id);

  const selectedAttraction =
    attractions.find((attraction) => attraction.id === selectedAttractionId) || attractions[0];

  const filteredAttractions = useMemo(() => {
    if (!selectedTrip) return attractions;

    const destination = selectedTrip.destination.toLowerCase();
    const cityMatches = attractions.filter((attraction) =>
      destination.includes(attraction.city.toLowerCase()),
    );

    return cityMatches.length > 0 ? cityMatches : attractions;
  }, [selectedTrip]);

  function changeTrip(event) {
    const nextTrip = trips.find((trip) => trip.id === event.target.value);
    setSelectedTripId(event.target.value);
    setSelectedDate(nextTrip?.days[0]?.date || nextTrip?.startDate || '');
  }

  function addToSchedule(attraction = selectedAttraction) {
    if (!selectedTrip || !selectedDate || !attraction) return;
    onAddAttraction(selectedTrip.id, selectedDate, attraction);
  }

  if (trips.length === 0) {
    return (
      <section className="content-section">
        <div className="empty-state">
          <h3>先建立旅程，再開始探索地圖</h3>
          <p>地圖推薦會依旅程目的地篩選，並可加入指定日期。</p>
        </div>
      </section>
    );
  }

  return (
    <section className="content-section">
      <div className="section-title">
        <div>
          <h2>地圖探索</h2>
          <p>從推薦景點挑選地點，直接加入旅程的每日行程。</p>
        </div>
      </div>

      <div className="explorer-layout">
        <div className="map-panel">
          <MapContainer
            center={[selectedAttraction.lat, selectedAttraction.lng]}
            zoom={12}
            scrollWheelZoom
            className="leaflet-map"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapFocus attraction={selectedAttraction} />
            {filteredAttractions.map((attraction) => (
              <CircleMarker
                key={attraction.id}
                center={[attraction.lat, attraction.lng]}
                pathOptions={{
                  color: categoryColors[attraction.category] || '#2F80ED',
                  fillColor: categoryColors[attraction.category] || '#2F80ED',
                  fillOpacity: 0.88,
                }}
                radius={10}
                eventHandlers={{
                  click: () => setSelectedAttractionId(attraction.id),
                }}
              >
                <Popup>
                  <strong>{attraction.name}</strong>
                  <p>{attraction.description}</p>
                  <button type="button" onClick={() => addToSchedule(attraction)}>
                    加入行程
                  </button>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>

        <aside className="recommendation-panel">
          <div className="planner-controls">
            <label>
              旅程
              <select value={selectedTrip?.id || ''} onChange={changeTrip}>
                {trips.map((trip) => (
                  <option key={trip.id} value={trip.id}>
                    {trip.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              加入日期
              <select value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)}>
                {(selectedTrip?.days || []).map((day) => (
                  <option key={day.date} value={day.date}>
                    {formatDate(day.date)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="selected-attraction">
            <span>{selectedAttraction.category}</span>
            <h3>{selectedAttraction.name}</h3>
            <p>{selectedAttraction.description}</p>
            <button className="primary-button" onClick={() => addToSchedule()}>
              <span aria-hidden="true">+</span>
              加入行程
            </button>
          </div>

          <div className="recommendation-list">
            {filteredAttractions.map((attraction) => (
              <button
                className={
                  attraction.id === selectedAttraction.id
                    ? 'recommendation-item is-active'
                    : 'recommendation-item'
                }
                key={attraction.id}
                onClick={() => setSelectedAttractionId(attraction.id)}
              >
                <strong>{attraction.name}</strong>
                <span>{attraction.category}</span>
              </button>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}
