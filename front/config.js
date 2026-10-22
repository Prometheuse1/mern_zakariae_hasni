const apiBaseUrl = "";

window.APP_CONFIG = Object.freeze({
	apiBaseUrl,
	itemsUrl: new URL("/api/items", apiBaseUrl || window.location.origin).toString(),
});
