import AsyncStorage from '@react-native-async-storage/async-storage';
import type { List, Snapshot } from './types';

const KEY = 'packit:v1';

export type Persisted = { list: List | null; hist: Snapshot[] };

export async function load(): Promise<Persisted | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Persisted>;
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      list: parsed.list ?? null,
      hist: Array.isArray(parsed.hist) ? parsed.hist : [],
    };
  } catch {
    // Corrupt payload: start clean rather than trapping the user on a crash.
    return null;
  }
}

export async function save(data: Persisted): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // Persistence is best-effort; the in-memory session keeps working.
  }
}
