import { Loader } from '@googlemaps/js-api-loader';
import { getCityByDestination } from '../data/cities.js';

const GOOGLE_PLACES_API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;

const loader = new Loader({
  apiKey: GOOGLE_PLACES_API_KEY,
  version: 'weekly',
  libraries: ['places'],
});

function mapResultToPlace(result, category) {
  return {
    id: `google-${result.place_id}`,
    placeId: result.place_id,
    name: result.name,
    category,
    description: result.vicinity || result.types?.[0] || category,
    lat: result.geometry?.location?.lat(),
    lng: result.geometry?.location?.lng(),
  };
}

async function loadGoogleMaps() {
  if (!GOOGLE_PLACES_API_KEY) {
    throw new Error('缺少 Google Places API 金鑰，請在 .env.local 中設定 VITE_GOOGLE_PLACES_API_KEY。');
  }
  return loader.load();
}

function runNearbySearch(service, request) {
  return new Promise((resolve, reject) => {
    service.nearbySearch(request, (results, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK ||
          status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
        resolve(results || []);
      } else {
        reject(new Error(status));
      }
    });
  });
}

function runPlaceDetails(service, request) {
  return new Promise((resolve, reject) => {
    service.getDetails(request, (result, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK) {
        resolve(result);
      } else {
        reject(new Error(status));
      }
    });
  });
}

export async function fetchNearbyPlaces(destination, limit = 8) {
  const city = getCityByDestination(destination);
  if (!city) {
    return [];
  }

  await loadGoogleMaps();
  const service = new window.google.maps.places.PlacesService(document.createElement('div'));
  const requests = [
    { location: { lat: city.center[0], lng: city.center[1] }, radius: 4000, type: 'tourist_attraction' },
    { location: { lat: city.center[0], lng: city.center[1] }, radius: 4000, type: 'restaurant' },
  ];

  const results = await Promise.all(requests.map((request) => runNearbySearch(service, request)));
  const attractions = results[0].map((result) => mapResultToPlace(result, '景點'));
  const restaurants = results[1].map((result) => mapResultToPlace(result, '餐廳'));

  const combined = [];
  const maxCount = Math.max(attractions.length, restaurants.length);
  for (let i = 0; i < maxCount && combined.length < limit; i += 1) {
    if (attractions[i]) combined.push(attractions[i]);
    if (restaurants[i] && combined.length < limit) combined.push(restaurants[i]);
  }

  const unique = Array.from(new Map(combined.map((place) => [place.placeId, place])).values());
  return unique.slice(0, limit);
}

export async function fetchPlaceDetails(placeId) {
  await loadGoogleMaps();
  const service = new window.google.maps.places.PlacesService(document.createElement('div'));
  const result = await runPlaceDetails(service, {
    placeId,
    fields: [
      'place_id',
      'name',
      'formatted_address',
      'formatted_phone_number',
      'rating',
      'opening_hours',
      'website',
      'url',
      'geometry',
      'vicinity',
      'types',
    ],
  });

  return {
    placeId: result.place_id,
    name: result.name,
    address: result.formatted_address || result.vicinity || '',
    phoneNumber: result.formatted_phone_number || '',
    rating: result.rating || null,
    openingHours: result.opening_hours?.weekday_text || [],
    website: result.website || '',
    url: result.url || '',
    category: result.types?.[0] || '',
    lat: result.geometry?.location?.lat(),
    lng: result.geometry?.location?.lng(),
  };
}
