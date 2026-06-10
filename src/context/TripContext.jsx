import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { starterTrips } from '../data/starterTrips.js';
import useLocalStorage from '../hooks/useLocalStorage.js';
import { createTripDays } from '../utils/dateUtils.js';
import { useAuth } from './AuthContext.jsx';

const STORAGE_KEY = 'travel-planner-trips';
const TripContext = createContext(null);

function normalizeDays(days, fallbackDays) {
  const sourceDays = days.length > 0 ? days : fallbackDays;

  return sourceDays.map((day) => ({
    date: day.date,
    items: Array.isArray(day.items) ? day.items : [],
  }));
}

function normalizeBackendTrip(trip) {
  const generatedDays = createTripDays(trip.start_date, trip.end_date);
  const dayMap = new Map();

  (trip.schedule_items || []).forEach((item) => {
    const date = item.date || trip.start_date;
    const existing = dayMap.get(date) || { date, items: [] };
    existing.items.push({
      id: item.id,
      time: item.time ? item.time.slice(0, 5) : '',
      title: item.title,
      category: item.category,
      note: item.note || '',
      lat: item.lat,
      lng: item.lng,
    });
    dayMap.set(date, existing);
  });

  const days = Array.from(dayMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  return {
    id: trip.id,
    name: trip.name,
    destination: trip.destination,
    startDate: trip.start_date,
    endDate: trip.end_date,
    coverColor: trip.cover_color || '#2F80ED',
    group: trip.group || null,
    days: normalizeDays(days, generatedDays),
    expenses: Array.isArray(trip.expenses) ? trip.expenses : [],
  };
}

function normalizeLocalTrip(trip, index) {
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

export function TripProvider({ children }) {
  const [storedTrips, setStoredTrips] = useLocalStorage(STORAGE_KEY, starterTrips);
  const [backendTrips, setBackendTrips] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { authFetch, user } = useAuth();

  useEffect(() => {
    if (!user) {
      setBackendTrips([]);
      return;
    }

    let active = true;
    async function loadTrips() {
      setIsLoading(true);
      try {
        const data = await authFetch('/api/trips/');
        if (!active) return;
        setBackendTrips(data.map(normalizeBackendTrip));
      } catch (err) {
        console.error('Failed to load backend trips:', err);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadTrips();
    return () => {
      active = false;
    };
  }, [authFetch, user]);

  const trips = useMemo(() => {
    if (user) {
      return backendTrips;
    }
    if (!Array.isArray(storedTrips)) return starterTrips;
    return storedTrips.map(normalizeLocalTrip).filter(Boolean);
  }, [backendTrips, storedTrips, user]);

  async function addTrip(trip, selectedAttractions = []) {
    if (!user) {
      setStoredTrips([trip, ...trips]);
      return;
    }

    try {
      const body = {
        name: trip.name,
        destination: trip.destination,
        start_date: trip.startDate,
        end_date: trip.endDate,
        cover_color: trip.coverColor,
        ...(trip.group ? { group: trip.group } : {}),
      };
      const created = await authFetch('/api/trips/', {
        method: 'POST',
        body,
      });
      const normalized = normalizeBackendTrip(created);
      setBackendTrips((current) => [normalized, ...current]);

      if (selectedAttractions.length > 0) {
        await Promise.all(
          selectedAttractions.map((attraction) =>
            authFetch('/api/schedule-items/', {
              method: 'POST',
              body: {
                trip: created.id,
                date: trip.startDate,
                time: '',
                title: attraction.name,
                category: attraction.category,
                note: attraction.description,
                lat: attraction.lat,
                lng: attraction.lng,
              },
            }),
          ),
        );
        const updated = await authFetch(`/api/trips/${created.id}/`);
        setBackendTrips((current) => [normalizeBackendTrip(updated), ...current.filter((item) => item.id !== updated.id)]);
      }
    } catch (err) {
      console.error('Failed to add trip:', err);
    }
  }

  async function deleteTrip(id) {
    if (!user) {
      setStoredTrips(trips.filter((trip) => trip.id !== id));
      return;
    }

    try {
      await authFetch(`/api/trips/${id}/`, { method: 'DELETE' });
      setBackendTrips((current) => current.filter((trip) => trip.id !== id));
    } catch (err) {
      console.error('Failed to delete trip:', err);
    }
  }

  async function addScheduleItem(tripId, date, attraction) {
    if (!user) {
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
      return nextItem;
    }

    try {
      const created = await authFetch('/api/schedule-items/', {
        method: 'POST',
        body: {
          trip: tripId,
          date,
          time: '',
          title: attraction.name,
          category: attraction.category,
          note: attraction.description,
          lat: attraction.lat,
          lng: attraction.lng,
        },
      });

      setBackendTrips((current) =>
        current.map((trip) =>
          trip.id !== tripId
            ? trip
            : {
                ...trip,
                days: trip.days.map((day) =>
                  day.date === date
                    ? { ...day, items: [...day.items, created] }
                    : day,
                ),
              },
        ),
      );
      return created;
    } catch (err) {
      console.error('Failed to add schedule item:', err);
      return null;
    }
  }

  async function addManualScheduleItem(tripId, date, item) {
    if (!user) {
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
      return nextItem;
    }

    try {
      const created = await authFetch('/api/schedule-items/', {
        method: 'POST',
        body: {
          trip: tripId,
          date,
          time: item.time || '',
          title: item.title,
          category: item.category,
          note: item.note || '',
          lat: item.lat ? Number(item.lat) : null,
          lng: item.lng ? Number(item.lng) : null,
        },
      });

      setBackendTrips((current) =>
        current.map((trip) =>
          trip.id !== tripId
            ? trip
            : {
                ...trip,
                days: trip.days.map((day) =>
                  day.date === date
                    ? { ...day, items: [...day.items, created] }
                    : day,
                ),
              },
        ),
      );
      return created;
    } catch (err) {
      console.error('Failed to add manual schedule item:', err);
      return null;
    }
  }

  async function updateScheduleItem(tripId, date, itemId, updates) {
    if (!user) {
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
      return;
    }

    try {
      await authFetch(`/api/schedule-items/${itemId}/`, {
        method: 'PATCH',
        body: updates,
      });
      setBackendTrips((current) =>
        current.map((trip) =>
          trip.id !== tripId
            ? trip
            : {
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
              },
        ),
      );
    } catch (err) {
      console.error('Failed to update schedule item:', err);
    }
  }

  async function deleteScheduleItem(tripId, date, itemId) {
    if (!user) {
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
      return;
    }

    try {
      await authFetch(`/api/schedule-items/${itemId}/`, { method: 'DELETE' });
      setBackendTrips((current) =>
        current.map((trip) =>
          trip.id !== tripId
            ? trip
            : {
                ...trip,
                days: trip.days.map((day) =>
                  day.date === date
                    ? { ...day, items: day.items.filter((item) => item.id !== itemId) }
                    : day,
                ),
              },
        ),
      );
    } catch (err) {
      console.error('Failed to delete schedule item:', err);
    }
  }

  const value = useMemo(
    () => ({
      trips,
      isLoading,
      addTrip,
      deleteTrip,
      addScheduleItem,
      addManualScheduleItem,
      updateScheduleItem,
      deleteScheduleItem,
    }),
    [trips, isLoading, authFetch],
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
