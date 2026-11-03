import { getPosition, getTimes, getMoonPosition, getMoonIllumination } from './vendor/suncalc.js';

const osakaDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit' });
const osakaTime = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Tokyo', hour12: false, hour: '2-digit', minute: '2-digit' });
export const LATITUDE = 34.6937;
export const LONGITUDE = 135.5023;
export function dateInOsaka(date = new Date()) {
  const parts = Object.fromEntries(osakaDate.formatToParts(date).map(p => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}
export function minutesInOsaka(date = new Date()) {
  const parts = Object.fromEntries(osakaTime.formatToParts(date).map(p => [p.type, p.value]));
  return (Number(parts.hour) % 24) * 60 + Number(parts.minute);
}
export function timeLabel(minutes) {
  const m = (Math.round(minutes) % 1440 + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}
export function previewDate(minutes, now = new Date()) {
  return new Date(`${dateInOsaka(now)}T${timeLabel(minutes)}:00+09:00`);
}
// A chosen hour is an offset from real time, rather than a frozen timestamp.
export function startTimePreview(minutes, now = new Date()) {
  return { dateMs: previewDate(minutes, now).getTime(), startedMs: now.getTime() };
}
export function runningRoomDate(preview, now = new Date()) {
  return preview === null ? new Date(now) : new Date(preview.dateMs + now.getTime() - preview.startedMs);
}
export function sunState(date) {
  const sun = getPosition(date, LATITUDE, LONGITUDE);
  const times = getTimes(date, LATITUDE, LONGITUDE);
  const elevation = sun.altitude;
  const daytime = Math.max(0, Math.min(1, (elevation + 8) / 19));
  const golden = Math.max(0, 1 - Math.abs(elevation - 5) / 17);
  const hour = minutesInOsaka(date) / 60;
  const label = elevation < -7 ? 'After hours' : elevation < 1 ? (hour < 12 ? 'First light' : 'Blue hour') : elevation < 15 ? (hour < 12 ? 'Morning light' : 'Golden hour') : 'Daylight';
  return { ...sun, moon: { ...getMoonPosition(date,LATITUDE,LONGITUDE), ...getMoonIllumination(date) }, daytime, golden, label, sunrise: minutesInOsaka(times.sunrise), sunset: minutesInOsaka(times.sunset), hour };
}
