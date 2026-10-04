import type { ReactNode } from 'react'

/** Personagens extras (ex.: inventores da Fase 1): nome, cor e retrato. */
export const SPEAKERS: Record<string, { name: string; color?: string; face?: () => ReactNode }> = {}

export const Ico = {
  voiceOn: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" fillOpacity=".25" /><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" /></svg>,
  voiceOff: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" fillOpacity=".25" /><path d="M17 9.5l5 5M22 9.5l-5 5" /></svg>,
  book: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z" /><path d="M4 5.5v16M9 7h7M9 11h5" /></svg>,
  map: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z" /><path d="M9 4v14M15 6v14" /></svg>,
  menu: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>,
  close: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>,
  arrow: <svg viewBox="0 0 40 40"><path d="M20 3 35 33 20 25 5 33z" fill="#ffd27a" stroke="#5a3a0a" strokeWidth="2" strokeLinejoin="round" /></svg>,
  hand: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V12M11 11V4.5a1.5 1.5 0 0 1 3 0V12M14 11.5V6a1.5 1.5 0 0 1 3 0v8a6 6 0 0 1-6 6h-.5a6 6 0 0 1-4.6-2.2L3.6 15a1.6 1.6 0 0 1 2.4-2l2 2" /></svg>,
}

export function Face({ who }: { who: string }) {
  const sp = SPEAKERS[who]
  if (sp?.face) return <>{sp.face()}</>
  if (who === 'NEX') return (
    <svg viewBox="0 0 64 64"><rect width="64" height="64" fill="#1a2440" /><circle cx="32" cy="38" r="17" fill="#f0c49c" /><path d="M14 33c0-14 9-20 18-20s19 6 19 19c-4-6-8-9-13-10l-3 5-3-5c-5 1-12 5-18 11z" fill="#3a2314" /><ellipse cx="26" cy="39" rx="3.4" ry="4.2" fill="#fff" /><ellipse cx="38" cy="39" rx="3.4" ry="4.2" fill="#fff" /><circle cx="26.5" cy="39.5" r="2.2" fill="#3a2314" /><circle cx="38.5" cy="39.5" r="2.2" fill="#3a2314" /><path d="M28 47q4 3 8 0" stroke="#8a3b2e" strokeWidth="1.8" fill="none" strokeLinecap="round" /><rect x="15" y="54" width="34" height="12" rx="6" fill="#1f3366" /></svg>
  )
  if (who === 'ENGINE') return (
    <svg viewBox="0 0 64 64"><rect width="64" height="64" fill="#050a14" /><circle cx="32" cy="32" r="20" fill="none" stroke="#2a5d86" strokeWidth="3" /><circle cx="32" cy="32" r="12" fill="#3fc4ff" opacity=".35" /><circle cx="32" cy="32" r="6" fill="#bff3ff" /><path d="M32 6v8M32 50v8M6 32h8M50 32h8" stroke="#3fc4ff" strokeWidth="2" /></svg>
  )
  if (who === 'HALLUCINO') return (
    <svg viewBox="0 0 64 64"><rect width="64" height="64" fill="#1a0b22" /><path d="M14 30c4-12 32-12 36 0-4 14-32 14-36 0z" fill="#ff8ad8" opacity=".85" /><circle cx="25" cy="30" r="4" fill="#1a0b22" /><circle cx="39" cy="30" r="4" fill="#1a0b22" /><path d="M24 42q8 6 16 0" stroke="#ff8ad8" strokeWidth="2.5" fill="none" /></svg>
  )
  if (who === 'SISTEMA') return (
    <svg viewBox="0 0 64 64"><rect width="64" height="64" fill="#0c1426" /><path d="M20 22h24v20H20z" fill="none" stroke="#e8b65a" strokeWidth="3" /><path d="M26 30h12M26 36h8" stroke="#e8b65a" strokeWidth="3" /></svg>
  )
  return (
    <svg viewBox="0 0 64 64"><rect width="64" height="64" fill="#0f1830" /><circle cx="32" cy="34" r="20" fill="#eef1f6" /><path d="M15 33a17 11 0 0 1 34 0 17 10 0 0 1-34 0z" fill="#0c1220" /><ellipse cx="25" cy="33" rx="4.2" ry="4.6" fill="#59d7ff" /><ellipse cx="39" cy="33" rx="4.2" ry="4.6" fill="#59d7ff" /><circle cx="12" cy="34" r="4" fill="#3fb8ff" /><circle cx="52" cy="34" r="4" fill="#3fb8ff" /></svg>
  )
}
