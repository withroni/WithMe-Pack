import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import * as Haptics from 'expo-haptics';
import { PACKS, RECOGNIZED } from './data/packs';
import { recognizeItems, scanConfigured } from './scan';
import { load, save } from './storage';
import type { Item, List, PackKey, Snapshot } from './types';

/** How long the check "pop" runs before the row settles. */
const BUMP_MS = 420;
const TOAST_MS = 5000;
const FAKE_SCAN_MS = 1500;

export type Screen = 'ob' | 'list';

let seq = 1;
const uid = (p: string) => `${p}${seq++}_${(Math.random() * 1e6) | 0}`;

const today = () => {
  const d = new Date();
  return `${d.getMonth() + 1}월 ${d.getDate()}일 짐`;
};
const stamp = () => new Date().toISOString().slice(2, 10).replace(/-/g, '.');

const mkList = (labels: string[]): List => ({
  id: uid('L'),
  name: today(),
  created: stamp(),
  items: labels.map((label) => ({ id: uid('i'), label, done: false })),
});

const rehydrate = (items: { label: string; done: boolean }[]): Item[] =>
  items.map((i) => ({ id: uid('i'), label: i.label, done: i.done }));

export function usePacking() {
  const [ready, setReady] = useState(false);
  const [screen, setScreen] = useState<Screen>('ob');
  const [list, setListState] = useState<List | null>(null);
  const [hist, setHistState] = useState<Snapshot[]>([]);

  const [sheet, setSheet] = useState(false);
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [bump, setBump] = useState<string | null>(null);

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [undo, setUndo] = useState<(() => void) | null>(null);

  const [scan, setScan] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  /** What the scan turned up — from the backend, or the canned demo list. */
  const [candidates, setCandidates] = useState<string[]>([]);
  const [sel, setSel] = useState<string[]>([]);

  // Mirrors of list/hist kept in sync synchronously, so an action can read the
  // current value without doing side effects inside a setState updater
  // (updaters must stay pure — StrictMode runs them twice).
  const listRef = useRef<List | null>(null);
  const histRef = useRef<Snapshot[]>([]);

  const setList = useCallback((next: List | null) => {
    listRef.current = next;
    setListState(next);
  }, []);
  const setHist = useCallback((next: Snapshot[]) => {
    histRef.current = next;
    setHistState(next);
  }, []);

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bumpTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scanTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Bumped per scan so a late network result for an abandoned scan is dropped. */
  const scanRun = useRef(0);

  // ---- hydrate ------------------------------------------------------------
  useEffect(() => {
    let alive = true;
    load().then((data) => {
      if (!alive) return;
      if (data?.list) {
        setList(data.list);
        setHist(data.hist);
        setScreen('list');
      }
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, [setList, setHist]);

  // ---- persist ------------------------------------------------------------
  // Debounced: checking items off fires a write per tap otherwise.
  useEffect(() => {
    if (!ready) return;
    const id = setTimeout(() => save({ list, hist }), 300);
    return () => clearTimeout(id);
  }, [ready, list, hist]);

  // A debounced write is still pending for up to 300ms, and Android can kill the
  // process the moment the app leaves the foreground — swipe it out of recents
  // right after checking something and that write never lands. Flush on the way
  // out. Reads the refs so it always writes the newest values, not this render's.
  useEffect(() => {
    if (!ready) return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') save({ list: listRef.current, hist: histRef.current });
    });
    return () => sub.remove();
  }, [ready]);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      if (bumpTimer.current) clearTimeout(bumpTimer.current);
      if (scanTimer.current) clearTimeout(scanTimer.current);
    },
    [],
  );

  // ---- toast --------------------------------------------------------------
  const hideToast = useCallback(() => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMsg(null);
    setUndo(null);
  }, []);

  const toast = useCallback((msg: string, undoFn?: () => void) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMsg(msg);
    // Wrapped in a thunk — React would otherwise treat the function as an updater.
    setUndo(() => undoFn ?? null);
    toastTimer.current = setTimeout(() => {
      setToastMsg(null);
      setUndo(null);
    }, TOAST_MS);
  }, []);

  const doUndo = useCallback(() => {
    const fn = undo;
    hideToast();
    fn?.();
  }, [undo, hideToast]);

  // ---- derived ------------------------------------------------------------
  const items = list?.items ?? [];
  const n = items.length;
  const p = items.filter((i) => i.done).length;
  const left = n - p;
  const pct = n ? (p / n) * 100 : 0;
  const allDone = n > 0 && left === 0;
  // Saving stays available once everything is checked — a fully packed list is
  // the most natural thing to archive. Only 전부 has nothing left to do.
  const canSave = n > 0 && !sheet;
  const canCheckAll = n > 0 && !allDone && !sheet;

  // ---- mutations ----------------------------------------------------------
  const flashBump = useCallback((id: string) => {
    setBump(id);
    if (bumpTimer.current) clearTimeout(bumpTimer.current);
    bumpTimer.current = setTimeout(() => setBump(null), BUMP_MS);
  }, []);

  const seed = useCallback(
    (labels: string[], note?: string) => {
      const prev = listRef.current;
      setList(mkList(labels));
      setScreen('list');
      setSheet(false);
      setDraft('');
      setEditing(null);
      if (prev) toast(note ?? '목록을 바꿨어요', () => setList(prev));
    },
    [setList, toast],
  );

  const startPack = useCallback(
    (key: PackKey) => seed(PACKS[key].items, `'${PACKS[key].n}' 목록으로 바꿨어요`),
    [seed],
  );

  const toggle = useCallback(
    (id: string) => {
      const cur = listRef.current;
      if (!cur) return;
      setList({ ...cur, items: cur.items.map((i) => (i.id === id ? { ...i, done: !i.done } : i)) });
      flashBump(id);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    },
    [setList, flashBump],
  );

  const remove = useCallback(
    (id: string) => {
      const cur = listRef.current;
      if (!cur) return;
      const idx = cur.items.findIndex((x) => x.id === id);
      if (idx < 0) return;
      const gone = cur.items[idx];
      setList({ ...cur, items: cur.items.filter((x) => x.id !== id) });
      toast(`'${gone.label}' 지웠어요`, () => {
        const c = listRef.current;
        if (!c) return;
        const back = [...c.items];
        back.splice(idx, 0, gone);
        setList({ ...c, items: back });
      });
    },
    [setList, toast],
  );

  const addItem = useCallback(() => {
    const v = draft.trim();
    const cur = listRef.current;
    if (!v || !cur) return;
    setList({ ...cur, items: [...cur.items, { id: uid('i'), label: v, done: false }] });
    setDraft('');
  }, [draft, setList]);

  const startEdit = useCallback((it: Item) => {
    setEditing(it.id);
    setEditDraft(it.label);
  }, []);

  const commitEdit = useCallback(() => {
    const id = editing;
    const v = editDraft.trim();
    const cur = listRef.current;
    if (id && v && cur) {
      setList({ ...cur, items: cur.items.map((i) => (i.id === id ? { ...i, label: v } : i)) });
    }
    setEditing(null);
    setEditDraft('');
  }, [editing, editDraft, setList]);

  const startRename = useCallback(() => {
    setNameDraft(listRef.current?.name ?? '');
    setRenaming(true);
  }, []);

  const commitName = useCallback(() => {
    const v = nameDraft.trim();
    const cur = listRef.current;
    if (v && cur) setList({ ...cur, name: v });
    setRenaming(false);
  }, [nameDraft, setList]);

  /** Archive the current list, then start the same set over, unchecked. */
  const restart = useCallback(
    (msg?: string) => {
      const cur = listRef.current;
      if (!cur) return;
      const snap: Snapshot = {
        name: cur.name,
        created: cur.created,
        n: cur.items.length,
        p: cur.items.filter((i) => i.done).length,
        items: cur.items.map((i) => ({ label: i.label, done: i.done })),
      };
      const prevHist = histRef.current;
      setHist([snap, ...prevHist]);
      setList({
        id: uid('L'),
        name: today(),
        created: stamp(),
        items: cur.items.map((i) => ({ id: uid('i'), label: i.label, done: false })),
      });
      toast(msg ?? '보관함에 넣고 새로 시작했어요', () => {
        setHist(prevHist);
        setList({ id: uid('L'), name: snap.name, created: snap.created, items: rehydrate(snap.items) });
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    },
    [setHist, setList, toast],
  );

  const saveNow = useCallback(() => {
    if (!canSave) return;
    restart(left > 0 ? `${left}개 남긴 채로 저장했어요` : '다 챙긴 목록을 보관함에 넣었어요');
  }, [canSave, left, restart]);

  const checkAll = useCallback(() => {
    const cur = listRef.current;
    if (!canCheckAll || !cur) return;
    setList({ ...cur, items: cur.items.map((i) => ({ ...i, done: true })) });
    flashBump('all');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }, [canCheckAll, setList, flashBump]);

  const restoreSnapshot = useCallback(
    (h: Snapshot) => {
      const cur = listRef.current;
      if (!cur) return;
      const keep = cur.items.map((i) => ({ label: i.label, done: i.done }));
      setSheet(false);
      setList({ ...cur, items: h.items.map((i) => ({ id: uid('i'), label: i.label, done: false })) });
      toast(`'${h.name}' 항목으로 되돌렸어요`, () => {
        const c = listRef.current;
        if (c) setList({ ...c, items: rehydrate(keep) });
      });
    },
    [setList, toast],
  );

  // ---- photo scan ---------------------------------------------------------
  const beginScan = useCallback((uri: string | null) => {
    const run = ++scanRun.current;
    setScan(true);
    setSheet(false);
    setScanning(true);
    setSel([]);
    setCandidates([]);
    setPhoto(uri);
    if (scanTimer.current) clearTimeout(scanTimer.current);

    // Ignore a slow response the user already walked away from.
    const finish = (found: string[], selected: string[]) => {
      if (scanRun.current !== run) return;
      setCandidates(found);
      setSel(selected);
      setScanning(false);
    };
    const demo = () => finish(RECOGNIZED, RECOGNIZED.slice(0, 9));

    if (uri && scanConfigured) {
      recognizeItems(uri).then((items) => (items ? finish(items, items) : demo()), demo);
      return;
    }

    // No photo, or no backend configured: keep the prototype's simulated scan.
    scanTimer.current = setTimeout(demo, FAKE_SCAN_MS);
  }, []);

  const closeScan = useCallback(() => {
    scanRun.current++;
    if (scanTimer.current) clearTimeout(scanTimer.current);
    setScan(false);
    setScanning(false);
    setPhoto(null);
  }, []);

  const toggleToken = useCallback((label: string) => {
    setSel((cur) => (cur.includes(label) ? cur.filter((x) => x !== label) : [...cur, label]));
  }, []);

  const acceptScan = useCallback(() => {
    if (!sel.length) return;
    setScan(false);
    seed([...sel], '사진에서 만든 목록으로 바꿨어요');
  }, [sel, seed]);

  const cancelEdit = useCallback(() => setEditing(null), []);
  const cancelRename = useCallback(() => setRenaming(false), []);

  return useMemo(
    () => ({
      ready, screen, list, hist, items,
      n, p, left, pct, allDone, canSave, canCheckAll,
      sheet, setSheet,
      draft, setDraft, addItem,
      editing, editDraft, setEditDraft, startEdit, commitEdit, cancelEdit,
      renaming, nameDraft, setNameDraft, startRename, commitName, cancelRename,
      bump,
      toastMsg, undo, doUndo, hideToast,
      seed, startPack, toggle, remove, restart, saveNow, checkAll, restoreSnapshot,
      scan, scanning, photo, candidates, sel, beginScan, closeScan, toggleToken, acceptScan,
    }),
    [
      ready, screen, list, hist, items, n, p, left, pct, allDone, canSave, canCheckAll, sheet, draft,
      editing, editDraft, renaming, nameDraft, bump, toastMsg, undo, doUndo, hideToast,
      addItem, commitEdit, startEdit, cancelEdit, startRename, commitName, cancelRename,
      seed, startPack, toggle, remove, restart, saveNow, checkAll, restoreSnapshot,
      scan, scanning, photo, candidates, sel, beginScan, closeScan, toggleToken, acceptScan,
    ],
  );
}

export type Packing = ReturnType<typeof usePacking>;
