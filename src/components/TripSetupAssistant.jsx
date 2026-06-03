import { useEffect, useMemo, useState } from 'react';
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet';
import { getAttractionsForDestination } from '../data/attractions.js';
import { getCityByDestination } from '../data/cities.js';
import useWeather from '../hooks/useWeather.js';
import { formatDate } from '../utils/dateUtils.js';

const fallbackCenter = [35.6812, 139.7671];

const categoryColors = {
  景點: '#2F80ED',
  餐廳: '#F2994A',
  交通: '#7B61FF',
  住宿: '#00A676',
};

function MapCenter({ center }) {
  const map = useMap();

  useEffect(() => {
    map.flyTo(center, 12, { duration: 0.6 });
  }, [center, map]);

  return null;
}

export default function TripSetupAssistant({
  destination,
  startDate,
  endDate,
  selectedAttractionIds,
  onToggleAttraction,
}) {
  const recommendations = useMemo(
    () => getAttractionsForDestination(destination),
    [destination],
  );
  const [focusedId, setFocusedId] = useState(recommendations[0]?.id || '');
  const weather = useWeather(destination, startDate, endDate);
  const selectedCity = getCityByDestination(destination);

  useEffect(() => {
    setFocusedId(recommendations[0]?.id || '');
  }, [recommendations]);

  const focusedAttraction =
    recommendations.find((attraction) => attraction.id === focusedId) || recommendations[0];
  const center = selectedCity?.center || (focusedAttraction ? [focusedAttraction.lat, focusedAttraction.lng] : fallbackCenter);

  return (
    <div className="trip-assistant">
      <section className="assistant-card">
        <div className="assistant-heading">
          <h3>推薦景點</h3>
          <span>{recommendations.length} 個地點</span>
        </div>

        <div className="form-map">
          <MapContainer center={center} zoom={12} scrollWheelZoom={false} className="form-leaflet-map">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapCenter center={center} />
            {recommendations.map((attraction) => {
              const isSelected = selectedAttractionIds.includes(attraction.id);

              return (
                <CircleMarker
                  key={attraction.id}
                  center={[attraction.lat, attraction.lng]}
                  pathOptions={{
                    color: isSelected ? '#1d252c' : categoryColors[attraction.category] || '#2F80ED',
                    fillColor: categoryColors[attraction.category] || '#2F80ED',
                    fillOpacity: isSelected ? 0.95 : 0.72,
                  }}
                  radius={isSelected ? 11 : 8}
                  eventHandlers={{
                    click: () => setFocusedId(attraction.id),
                  }}
                >
                  <Popup>
                    <strong>{attraction.name}</strong>
                    <p>{attraction.description}</p>
                    <button type="button" onClick={() => onToggleAttraction(attraction.id)}>
                      {isSelected ? '取消加入' : '加入候選'}
                    </button>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>

        <div className="compact-recommendations">
          {recommendations.map((attraction) => {
            const isSelected = selectedAttractionIds.includes(attraction.id);

            return (
              <button
                type="button"
                key={attraction.id}
                className={isSelected ? 'compact-place is-selected' : 'compact-place'}
                onClick={() => {
                  setFocusedId(attraction.id);
                  onToggleAttraction(attraction.id);
                }}
              >
                <strong>{attraction.name}</strong>
                <span>{isSelected ? '已加入' : attraction.category}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="assistant-card">
        <div className="assistant-heading">
          <h3>天氣預測</h3>
          <span>Open-Meteo</span>
        </div>

        <WeatherPreview weather={weather} />
      </section>
    </div>
  );
}

function WeatherPreview({ weather }) {
  if (weather.status === 'idle') {
    return <p className="assistant-note">填入目的地與日期後顯示預測。</p>;
  }

  if (weather.status === 'loading') {
    return <p className="assistant-note">讀取天氣中...</p>;
  }

  if (weather.status === 'error') {
    return <p className="assistant-note">{weather.error}</p>;
  }

  return (
    <div className="weather-list">
      {weather.forecast.slice(0, 6).map((day) => (
        <article className="weather-day" key={day.date}>
          <span>{formatDate(day.date)}</span>
          <strong>{day.label}</strong>
          <p>
            {day.minTemp}° - {day.maxTemp}° · 降雨 {day.rainChance ?? 0}%
          </p>
        </article>
      ))}
    </div>
  );
}
