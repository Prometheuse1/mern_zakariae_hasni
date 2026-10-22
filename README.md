# Configuration du frontend

Le frontend appelle l’API avec `fetch()` sur `/api/items`. L’origine de l’API
est centralisée dans `front/config.js` :

```js
const apiBaseUrl = "";
window.APP_CONFIG = Object.freeze({
	apiBaseUrl,
	itemsUrl: new URL("/api/items", apiBaseUrl || window.location.origin).toString(),
});
```

Une valeur vide utilise la même origine que le site. Pour un déploiement
statique où l’API est hébergée séparément, fournissez ou générez
`front/config.js` au déploiement avec l’origine publique de l’API, par exemple
`https://api.example.com` (sans chemin), à la place de la chaîne vide. Le fichier
construit l’URL complète utilisée par les interfaces. La page `index.html` charge
ce fichier avant son code applicatif ; si `app.js` est utilisé séparément, chargez
également `config.js` avant lui. Ne placez aucun secret dans cette configuration :
elle est téléchargée et visible par tous les visiteurs.