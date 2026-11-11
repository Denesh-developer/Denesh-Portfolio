/** Lifetime scoreboard for the tic-tac-toe easter egg, kept in localStorage. */
export type TttRecord = { you: number; house: number; draws: number }

const KEY = 'denesh-ttt-record-v1'

export const EMPTY_RECORD: TttRecord = { you: 0, house: 0, draws: 0 }

export function readRecord(): TttRecord {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return EMPTY_RECORD
    const r = JSON.parse(raw) as Partial<TttRecord>
    const n = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0)
    return { you: n(r.you), house: n(r.house), draws: n(r.draws) }
  } catch {
    return EMPTY_RECORD
  }
}

export function writeRecord(r: TttRecord) {
  try {
    localStorage.setItem(KEY, JSON.stringify(r))
  } catch {
    /* ignore — private mode / quota */
  }
}

export const gamesPlayed = (r: TttRecord) => r.you + r.house + r.draws
