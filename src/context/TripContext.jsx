import { createContext, useContext, useMemo } from 'react';
import { starterTrips } from '../data/starterTrips.js';
import useLocalStorage from '../hooks/useLocalStorage.js';
import { createTripDays } from '../utils/dateUtils.js';

const STORAGE_KEY = 'travel-planner-trips';
const TripContext = createContext(null);

function normalizeTrip(trip, index) {
  if (!trip || typeof trip !== 'object') return null;
  const generatedDays = createTripDays(trip.startDate, trip.endDate);

  return {
    id: trip.id || `trip-${index}`,
    name: trip.name || '未命名旅程',
    destination: trip.destination || '未設定目的地',
    startDate: trip.startDate || '',
    endDate: trip.endDate || trip.startDate || '',
    coverColor: trip.coverColor || '#2F80ED',
    days: normalizeDays(Array.isArray(trip.days) ? trip.days : generatedDays, generatedDays),
    expenses: Array.isArray(trip.expenses) ? trip.expenses : [],
  };
}

function normalizeDays(days, fallbackDays) {
  const sourceDays = days.length > 0 ? days : fallbackDays;

  return sourceDays.map((day) => ({
    date: day.date,
    items: Array.isArray(day.items) ? day.items : [],
  }));
}

export function TripProvider({ children }) {
  const [storedTrips, setStoredTrips] = useLocalStorage(STORAGE_KEY, starterTrips);

  const trips = useMemo(() => {
    if (!Array.isArray(storedTrips)) return starterTrips;
    return storedTrips.map(normalizeTrip).filter(Boolean);
  }, [storedTrips]);

  function addTrip(trip) {
    setStoredTrips([trip, ...trips]);
  }

  function deleteTrip(id) {
    setStoredTrips(trips.filter((trip) => trip.id !== id));
  }

  function addScheduleItem(tripId, date, attraction) {
    setStoredTrips(
      trips.map((trip) => {
        if (trip.id !== tripId) return trip;

        const nextItem = {
          id: `item-${Date.now()}`,
          time: '',
          title: attraction.name,
          category: attraction.category,
          note: attraction.description,
          lat: attraction.lat,
          lng: attraction.lng,
        };

        const hasDay = trip.days.some((day) => day.date === date);
        const days = hasDay
          ? trip.days.map((day) =>
              day.date === date
                ? { ...day, items: [...day.items, nextItem] }
                : day,
            )
          : [...trip.days, { date, items: [nextItem] }];

        return { ...trip, days };
      }),
    );
  }

  function addManualScheduleItem(tripId, date, item) {
    setStoredTrips(
      trips.map((trip) => {
        if (trip.id !== tripId) return trip;

        const nextItem = {
          id: `item-${Date.now()}`,
          time: item.time || '',
          title: item.title,
          category: item.category,
          note: item.note || '',
          lat: item.lat ? Number(item.lat) : null,
          lng: item.lng ? Number(item.lng) : null,
        };

        return {
          ...trip,
          days: trip.days.map((day) =>
            day.date === date ? { ...day, items: [...day.items, nextItem] } : day,
          ),
        };
      }),
    );
  }

  function updateScheduleItem(tripId, date, itemId, updates) {
    setStoredTrips(
      trips.map((trip) => {
        if (trip.id !== tripId) return trip;

        return {
          ...trip,
          days: trip.days.map((day) =>
            day.date === date
              ? {
                  ...day,
                  items: day.items.map((item) =>
                    item.id === itemId ? { ...item, ...updates } : item,
                  ),
                }
              : day,
          ),
        };
      }),
    );
  }

  function deleteScheduleItem(tripId, date, itemId) {
    setStoredTrips(
      trips.map((trip) => {
        if (trip.id !== tripId) return trip;

        return {
          ...trip,
          days: trip.days.map((day) =>
            day.date === date
              ? { ...day, items: day.items.filter((item) => item.id !== itemId) }
              : day,
          ),
        };
      }),
    );
  }

  const value = useMemo(
    () => ({
      trips,
      addTrip,
      deleteTrip,
      addScheduleItem,
      addManualScheduleItem,
      updateScheduleItem,
      deleteScheduleItem,
    }),
    [trips],
  );

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

export function useTrips() {
  const context = useContext(TripContext);
  if (!context) {
    throw new Error('useTrips must be used inside TripProvider.');
  }

  return context;
}
