// Organisation settings (registration numbers, fees, links) fetched once and shared through context.
import { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api.js';

// Organisation details (registration numbers, fees, links) edited by the admin in Settings.
const SettingsContext = createContext({});

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({});
  useEffect(() => {
    api('/settings').then(
      (d) => setSettings(d.settings),
      () => {},
    );
  }, []);
  return <SettingsContext value={{ ...settings, setSettings }}>{children}</SettingsContext>;
}

export const useSettings = () => useContext(SettingsContext);

/** Registrations that have a number filled in, for badges and legal lines. */
export const registrationList = (s) =>
  [
    ['Section 8 company', s.cin && `CIN ${s.cin}`],
    ['12A', s.reg12A],
    ['80G', s.reg80G],
    ['CSR-1', s.csr1],
    ['FCRA', s.fcra],
    ['NGO Darpan', s.darpan],
  ].map(([name, number]) => ({ name, number }));
