// Production: put your Vercel backend URL here, e.g. "https://my-back.vercel.app" (no trailing slash, no path).
// Leave "" only when the backend also serves this front (local npm start).
const apiBaseUrl = "https://mern-zakariae-hasni.vercel.app";

window.APP_CONFIG = Object.freeze({
	apiBaseUrl,
	itemsUrl: new URL("/api/items", (apiBaseUrl || window.location.origin).replace(/\/+$/, "")).toString(),
});
