import { useEffect, useState } from 'react';
import { getCityByDestination } from '../data/cities.js';

const weatherLabels = {
  0: '晴朗',
  1: '大致晴朗',
  2: '局部多雲',
  3: '陰天',
  45: '霧',
  48: '霧淞',
  51: '毛毛雨',
  53: '毛毛雨',
  55: '毛毛雨',
  61: '小雨',
  63: '雨',
  65: '大雨',
  71: '小雪',
  73: '雪',
  75: '大雪',
  80: '陣雨',
  81: '陣雨',
  82: '強陣雨',
  95: '雷雨',
};

function buildForecastUrl(location, startDate, endDate) {
  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
    timezone: 'auto',
    start_date: startDate,
    end_date: endDate,
  });

  return `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
}

export default function useWeather(destination, startDate, endDate) {
  const [state, setState] = useState({
    status: 'idle',
    location: null,
    forecast: [],
    error: '',
  });

  useEffect(() => {
    if (!destination.trim() || !startDate || !endDate) {
      setState({ status: 'idle', location: null, forecast: [], error: '' });
      return;
    }

    const controller = new AbortController();

    async function fetchWeather() {
      setState((current) => ({ ...current, status: 'loading', error: '' }));

      try {
        const selectedCity = getCityByDestination(destination);
        const geocodeParams = new URLSearchParams({
          name: selectedCity?.weatherName || destination.trim(),
          count: '1',
          language: 'zh',
          format: 'json',
        });
        const geocodeResponse = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?${geocodeParams.toString()}`,
          { signal: controller.signal },
        );
        const geocodeData = await geocodeResponse.json();
        const location = geocodeData.results?.[0];

        if (!location) {
          setState({
            status: 'error',
            location: null,
            forecast: [],
            error: '找不到目的地座標',
          });
          return;
        }

        const forecastResponse = await fetch(buildForecastUrl(location, startDate, endDate), {
          signal: controller.signal,
        });
        const forecastData = await forecastResponse.json();

        if (!forecastResponse.ok || forecastData.error) {
          setState({
            status: 'error',
            location,
            forecast: [],
            error: forecastData.reason || '目前無法取得這段日期的天氣預測',
          });
          return;
        }

        const daily = forecastData.daily;
        const forecast = (daily?.time || []).map((date, index) => ({
          date,
          code: daily.weather_code[index],
          label: weatherLabels[daily.weather_code[index]] || '天氣資料',
          maxTemp: Math.round(daily.temperature_2m_max[index]),
          minTemp: Math.round(daily.temperature_2m_min[index]),
          rainChance: daily.precipitation_probability_max[index],
        }));

        setState({ status: 'success', location, forecast, error: '' });
      } catch (error) {
        if (error.name === 'AbortError') return;
        setState({
          status: 'error',
          location: null,
          forecast: [],
          error: '天氣服務暫時無法連線',
        });
      }
    }

    fetchWeather();

    return () => controller.abort();
  }, [destination, startDate, endDate]);

  return state;
}
