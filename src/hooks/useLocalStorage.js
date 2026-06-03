import { useState } from 'react';

export default function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const savedValue = localStorage.getItem(key);
      return savedValue ? JSON.parse(savedValue) : initialValue;
    } catch {
      return initialValue;
    }
  });

  function updateValue(nextValue) {
    setValue(nextValue);

    try {
      localStorage.setItem(key, JSON.stringify(nextValue));
    } catch {
      // localStorage may be unavailable in private browsing or restricted contexts.
    }
  }

  return [value, updateValue];
}
