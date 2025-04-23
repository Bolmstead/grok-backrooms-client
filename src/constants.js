export const BACKROOMS_DATABASE_URL =
  import.meta.env.VITE_APP_ENV === "production" &&
  import.meta.env.VITE_BACKROOMS_DATABASE_URL
    ? import.meta.env.VITE_BACKROOMS_DATABASE_URL
    : "http://localhost:3000/api";

export const LIVE_BACKROOMS_URL =
  import.meta.env.VITE_APP_ENV === "production" &&
  import.meta.env.VITE_LIVE_BACKROOMS_URL
    ? import.meta.env.VITE_LIVE_BACKROOMS_URL
    : "http://localhost:6969";
