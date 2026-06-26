/** Mock traffic & geo analytics data. Backed by IP-geo + UA + referrer in prod. */

export interface CountryTraffic {
  code: string;
  country: string;
  lat: number;
  lng: number;
  users: number;
  sessions: number;
  pct: number;
  trend: number; // % change vs previous period
}

export const countryTraffic: CountryTraffic[] = [
  {
    code: "GH",
    country: "Ghana",
    lat: 7.95,
    lng: -1.02,
    users: 4120,
    sessions: 18240,
    pct: 62.4,
    trend: 8.1,
  },
  {
    code: "NG",
    country: "Nigeria",
    lat: 9.08,
    lng: 8.68,
    users: 1180,
    sessions: 5210,
    pct: 17.9,
    trend: 12.4,
  },
  {
    code: "GB",
    country: "United Kingdom",
    lat: 55.37,
    lng: -3.43,
    users: 412,
    sessions: 1840,
    pct: 6.2,
    trend: 3.2,
  },
  {
    code: "US",
    country: "United States",
    lat: 37.09,
    lng: -95.71,
    users: 308,
    sessions: 1290,
    pct: 4.7,
    trend: -1.4,
  },
  {
    code: "KE",
    country: "Kenya",
    lat: -0.02,
    lng: 37.9,
    users: 198,
    sessions: 870,
    pct: 3.0,
    trend: 5.6,
  },
  {
    code: "ZA",
    country: "South Africa",
    lat: -30.56,
    lng: 22.94,
    users: 142,
    sessions: 610,
    pct: 2.2,
    trend: 2.1,
  },
  {
    code: "CA",
    country: "Canada",
    lat: 56.13,
    lng: -106.35,
    users: 96,
    sessions: 420,
    pct: 1.5,
    trend: 0.8,
  },
  {
    code: "IN",
    country: "India",
    lat: 20.59,
    lng: 78.96,
    users: 78,
    sessions: 320,
    pct: 1.2,
    trend: 4.0,
  },
];

export interface CityTraffic {
  city: string;
  region: string;
  users: number;
  sessions: number;
  pct: number;
}

export const ghanaCities: CityTraffic[] = [
  { city: "Accra", region: "Greater Accra", users: 2140, sessions: 9820, pct: 51.9 },
  { city: "Kumasi", region: "Ashanti", users: 980, sessions: 4310, pct: 23.8 },
  { city: "Tamale", region: "Northern", users: 340, sessions: 1420, pct: 8.3 },
  { city: "Takoradi", region: "Western", users: 246, sessions: 1010, pct: 6.0 },
  { city: "Cape Coast", region: "Central", users: 198, sessions: 820, pct: 4.8 },
  { city: "Ho", region: "Volta", users: 116, sessions: 470, pct: 2.8 },
  { city: "Sunyani", region: "Bono", users: 100, sessions: 390, pct: 2.4 },
];

export const trafficSources = [
  { name: "Direct", value: 2840, fill: "#0E7C7B" },
  { name: "Google", value: 2210, fill: "#3B82F6" },
  { name: "Social", value: 980, fill: "#7C3AED" },
  { name: "Referral", value: 640, fill: "#E89A1A" },
  { name: "Email", value: 420, fill: "#2BC97F" },
];

export const deviceBreakdown = [
  { name: "Mobile", value: 3980, fill: "#0E7C7B" },
  { name: "Desktop", value: 2240, fill: "#3B82F6" },
  { name: "Tablet", value: 410, fill: "#E89A1A" },
];

export const browserBreakdown = [
  { name: "Chrome", value: 4120, fill: "#0E7C7B" },
  { name: "Safari", value: 1480, fill: "#3B82F6" },
  { name: "Edge", value: 620, fill: "#7C3AED" },
  { name: "Firefox", value: 290, fill: "#E89A1A" },
  { name: "Other", value: 120, fill: "#94A3B8" },
];

export const osBreakdown = [
  { name: "Android", value: 2980, fill: "#2BC97F" },
  { name: "Windows", value: 1840, fill: "#3B82F6" },
  { name: "iOS", value: 1120, fill: "#0E7C7B" },
  { name: "macOS", value: 520, fill: "#7C3AED" },
  { name: "Linux", value: 168, fill: "#E89A1A" },
];

export interface LiveActivity {
  id: string;
  city: string;
  country: string;
  action: string;
  ago: string;
}

export const liveActivity: LiveActivity[] = [
  { id: "1", city: "Accra", country: "GH", action: "started a Cardiology quiz", ago: "just now" },
  { id: "2", city: "Lagos", country: "NG", action: "signed up for a trial", ago: "12s ago" },
  {
    id: "3",
    city: "Kumasi",
    country: "GH",
    action: "completed Surgery Core — 78%",
    ago: "31s ago",
  },
  { id: "4", city: "London", country: "GB", action: "subscribed to 12-Month plan", ago: "1m ago" },
  { id: "5", city: "Tamale", country: "GH", action: "viewed High Yield Notes", ago: "2m ago" },
  { id: "6", city: "Nairobi", country: "KE", action: "started a Paediatrics quiz", ago: "3m ago" },
  { id: "7", city: "Accra", country: "GH", action: "answered 20 questions", ago: "4m ago" },
];

// Signups by location over the last 14 days (top 3 regions)
export const signupsByLocation = Array.from({ length: 14 }, (_, i) => ({
  day: `${i + 1}`,
  Ghana: 12 + Math.round(Math.sin(i / 2) * 5 + i * 0.6),
  Nigeria: 4 + Math.round(Math.cos(i / 3) * 3 + i * 0.3),
  Other: 2 + Math.round(Math.sin(i / 4) * 2),
}));

// Peak usage heatmap: 7 days x 24 hours, value = relative activity 0..100
const HOURS = Array.from({ length: 24 }, (_, h) => h);
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const usageHeatmap = DAYS.map((day, di) => ({
  day,
  hours: HOURS.map((h) => {
    // Busy in evenings (18-23) and lunch (12-14), quieter overnight; weekends lighter mornings.
    const evening = Math.max(0, 1 - Math.abs(h - 20) / 6);
    const lunch = Math.max(0, 1 - Math.abs(h - 13) / 4) * 0.6;
    const weekend = di >= 5 ? 0.8 : 1;
    const base = (evening + lunch) * weekend;
    const noise = ((di * 7 + h * 13) % 11) / 40;
    return Math.min(100, Math.round((base + noise) * 90));
  }),
}));

export const liveUserCount = 147;
