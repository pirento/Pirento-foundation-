// Small hooks shared by the donor dashboard and the admin desk.
import { useCallback, useEffect, useState } from 'react';
import { api } from './api.js';

/**
 * Loads JSON from the API and gives back `[data, reload]`.
 * `data` is null while loading and `{ error }` if the request failed, so pages can render all three states.
 */
export function useLoad(path) {
  const [data, setData] = useState(null);
  const reload = useCallback(() => api(path).then(setData, (e) => setData({ error: e.message })), [path]);
  useEffect(() => {
    reload();
  }, [reload]);
  return [data, reload];
}

/** Sets the browser tab title, e.g. "Donations · Admin · Pirento Foundation". */
export function useTitle(title, section) {
  useEffect(() => {
    document.title = `${title} · ${section} · Pirento Foundation`;
  }, [title, section]);
}
