// Camp Zones
export const CAMP_ZONES = [
  { id: "lisungwi", name: "Lisungwi", icon: "home" },
  { id: "kawale", name: "Kawale 1 & 2", icon: "home" },
  { id: "likuni", name: "Likuni 1 & 2", icon: "building" },
  { id: "zomba", name: "Zomba", icon: "store" },
  { id: "blantyre", name: "Blantyre", icon: "building-2" },
  { id: "katubza", name: "Katubza", icon: "home" },
  { id: "new-katubza", name: "New Katubza", icon: "home" },
  { id: "dzaleka-hill", name: "Dzaleka Hill", icon: "mountain" },
] as const;

// Points of Interest
export const POINTS_OF_INTEREST = [
  { id: "community-life", name: "Community Life", category: "experience" },
  { id: "cultural-heritage", name: "Cultural Heritage Sites", category: "culture" },
  { id: "history", name: "History of Dzaleka", category: "history" },
  { id: "local-markets", name: "Local Markets", category: "commerce" },
  { id: "cultural-activities", name: "Cultural Activities", category: "culture" },
  { id: "educational-programs", name: "Educational Programs", category: "education" },
  { id: "community-projects", name: "Community Projects", category: "community" },
] as const;

// Meeting Points
export const MEETING_POINTS = [
  { id: "unhcr", name: "UNHCR Office" },
  { id: "appfactory", name: "Appfactory" },
  { id: "jrs", name: "JRS (Jesuit Refugee Service)" },
] as const;

// Tour Types
export const TOUR_TYPES = [
  { id: "standard", name: "Standard (2 hrs)", duration: 2 },
  { id: "extended", name: "Extended (3-4 hrs)", duration: 3.5 },
  { id: "custom", name: "Custom", duration: null },
] as const;

// Group Sizes
export const GROUP_SIZES = [
  { id: "individual", name: "1 person", min: 1, max: 1 },
  { id: "small_group", name: "2-5 people", min: 2, max: 5 },
  { id: "large_group", name: "6-10 people", min: 6, max: 10 },
  { id: "custom", name: "10+ people", min: 10, max: null },
] as const;

// Pricing in MWK
export const PRICING = {
  individual: 15000,
  small_group: 50000,
  large_group: 80000,
  custom: 100000,
  additional_hour: 10000,
} as const;

// Payment Methods
export const PAYMENT_METHODS = [
  { id: "airtel_money", name: "Airtel Money" },
  { id: "tnm_mpamba", name: "TNM Mpamba" },
  { id: "cash", name: "Cash" },
] as const;

// Referral Sources
export const REFERRAL_SOURCES = [
  { id: "social_media", name: "Social Media" },
  { id: "word_of_mouth", name: "Word of Mouth" },
  { id: "website", name: "Website" },
  { id: "other", name: "Other" },
] as const;

// Status colors
export const STATUS_COLORS = {
  pending: { bg: "bg-yellow-100", text: "text-yellow-800", dark: "dark:bg-yellow-900/30 dark:text-yellow-400" },
  confirmed: { bg: "bg-green-100", text: "text-green-800", dark: "dark:bg-green-900/30 dark:text-green-400" },
  in_progress: { bg: "bg-purple-100", text: "text-purple-800", dark: "dark:bg-purple-900/30 dark:text-purple-400" },
  completed: { bg: "bg-blue-100", text: "text-blue-800", dark: "dark:bg-blue-900/30 dark:text-blue-400" },
  cancelled: { bg: "bg-red-100", text: "text-red-800", dark: "dark:bg-red-900/30 dark:text-red-400" },
} as const;

// Payment status colors
export const PAYMENT_STATUS_COLORS = {
  pending: { bg: "bg-yellow-100", text: "text-yellow-800", dark: "dark:bg-yellow-900/30 dark:text-yellow-400" },
  paid: { bg: "bg-green-100", text: "text-green-800", dark: "dark:bg-green-900/30 dark:text-green-400" },
  refunded: { bg: "bg-gray-100", text: "text-gray-800", dark: "dark:bg-gray-900/30 dark:text-gray-400" },
} as const;

// Standard tour times
export const STANDARD_TOUR_TIMES = ["10:00", "14:00"] as const;

// Languages available
export const LANGUAGES = [
  "English",
  "French",
  "Swahili",
  "Kirundi",
  "Kinyarwanda",
  "Lingala",
  "Chichewa",
  "Somali",
  "Amharic",
] as const;

// Format currency
export function formatCurrency(amount: number, currency = "MWK"): string {
  return new Intl.NumberFormat("en-MW", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format date
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

// Format time
export function formatTime(time: string | Date): string {
  if (time instanceof Date) {
    return new Intl.DateTimeFormat("en-GB", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(time);
  }
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}
