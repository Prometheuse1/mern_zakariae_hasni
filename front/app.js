(() => {
	const API_URL = window.APP_CONFIG.itemsUrl;

	const styles = `
		:root { color-scheme: light; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #172033; background: #f4f7fb; }
		* { box-sizing: border-box; }
		body { margin: 0; min-width: 320px; }
		.app { width: min(100% - 32px, 900px); margin: 0 auto; padding: 40px 0; }
		h1 { margin: 0 0 8px; font-size: clamp(1.7rem, 4vw, 2.25rem); }
		.intro { margin: 0 0 28px; color: #596579; }
		.panel { padding: 24px; margin-bottom: 24px; background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; box-shadow: 0 8px 24px #1720330a; }
		h2 { margin: 0 0 18px; font-size: 1.2rem; }
		.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
		label { display: grid; gap: 7px; font-weight: 600; font-size: .94rem; }
		input, textarea { width: 100%; padding: 11px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font: inherit; color: inherit; }
		input:focus, textarea:focus { outline: 3px solid #2563eb33; border-color: #2563eb; }
		textarea { min-height: 44px; resize: vertical; }
		button { min-height: 42px; padding: 9px 16px; border: 0; border-radius: 8px; background: #2563eb; color: #fff; font: inherit; font-weight: 650; cursor: pointer; }
		button:hover { background: #1d4ed8; }
		button:disabled { opacity: .65; cursor: wait; }
		.form-actions { display: flex; align-items: center; gap: 12px; margin-top: 16px; }
		.message { margin: 0; font-size: .94rem; }
		.error { color: #b42318; }
		.success { color: #18794e; }
		.list-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
		.list-head h2 { margin: 0; }
		.refresh { min-height: 36px; padding: 6px 12px; background: #eaf0ff; color: #1d4ed8; }
		.refresh:hover { background: #dbe7ff; }
		.items { display: grid; gap: 12px; }
		.item { padding: 16px; border: 1px solid #e2e8f0; border-radius: 10px; overflow-wrap: anywhere; }
		.item h3 { margin: 0 0 6px; font-size: 1rem; }
		.item p { margin: 0; color: #596579; white-space: pre-wrap; }
		.empty { margin: 0; color: #596579; }
		@media (max-width: 600px) { .app { padding: 24px 0; } .panel { padding: 18px; } .form-grid { grid-template-columns: 1fr; } .list-head { align-items: flex-start; } }
	`;

	document.head.insertAdjacentHTML("beforeend", `<style>${styles}</style>`);
	document.body.innerHTML = `
		<main class="app">
			<h1>Gestion des éléments</h1>
			<p class="intro">Consultez les éléments et ajoutez-en de nouveaux.</p>
			<section class="panel" aria-labelledby="form-title">
				<h2 id="form-title">Ajouter un élément</h2>
				<form id="element-form">
					<div class="form-grid">
						<label for="element-name">Nom <input id="element-name" name="name" required maxlength="120" autocomplete="off"></label>
						<label for="element-description">Description <textarea id="element-description" name="description" maxlength="1000"></textarea></label>
					</div>
					<div class="form-actions">
						<button id="submit-button" type="submit">Ajouter</button>
						<p id="form-message" class="message" role="status" aria-live="polite"></p>
					</div>
				</form>
			</section>
			<section class="panel" aria-labelledby="list-title">
				<div class="list-head"><h2 id="list-title">Éléments</h2><button class="refresh" id="refresh-button" type="button">Actualiser</button></div>
				<p id="list-message" class="message" role="status" aria-live="polite">Chargement…</p>
				<div id="items" class="items"></div>
			</section>
		</main>`;

	const form = document.querySelector("#element-form");
	const formMessage = document.querySelector("#form-message");
	const listMessage = document.querySelector("#list-message");
	const itemsContainer = document.querySelector("#items");
	const submitButton = document.querySelector("#submit-button");

	function showMessage(node, text, type = "") {
		node.textContent = text;
		node.className = `message${type ? ` ${type}` : ""}`;
	}

	async function readResponse(response) {
		const text = await response.text();
		let data;
		try { data = text ? JSON.parse(text) : null; } catch { data = text; }
		if (!response.ok) {
			const detail = data && typeof data === "object" ? (data.message || data.error) : data;
			throw new Error(detail || `Erreur HTTP ${response.status}`);
		}
		return data;
	}

	function renderItems(data) {
		const elements = Array.isArray(data) ? data : data && (data.elements || data.items);
		itemsContainer.replaceChildren();
		if (!Array.isArray(elements) || elements.length === 0) {
			showMessage(listMessage, Array.isArray(elements) ? "Aucun élément pour le moment." : "La réponse du serveur est invalide.", Array.isArray(elements) ? "" : "error");
			return;
		}
		listMessage.textContent = "";
		elements.forEach((element) => {
			const card = document.createElement("article");
			card.className = "item";
			const title = document.createElement("h3");
			title.textContent = element && (element.name || element.title) ? (element.name || element.title) : "Élément sans nom";
			card.append(title);
			const description = element && (element.description || element.content);
			if (description) {
				const paragraph = document.createElement("p");
				paragraph.textContent = description;
				card.append(paragraph);
			}
			itemsContainer.append(card);
		});
	}

	async function loadItems() {
		showMessage(listMessage, "Chargement…");
		try {
			renderItems(await readResponse(await fetch(API_URL, { headers: { Accept: "application/json" } })));
		} catch (error) {
			showMessage(listMessage, `Impossible de charger les éléments : ${error.message}`, "error");
		}
	}

	form.addEventListener("submit", async (event) => {
		event.preventDefault();
		const values = new FormData(form);
		const payload = { name: String(values.get("name")).trim(), description: String(values.get("description")).trim() };
		if (!payload.name) {
			showMessage(formMessage, "Le nom est obligatoire.", "error");
			return;
		}
		submitButton.disabled = true;
		showMessage(formMessage, "Envoi…");
		try {
			await readResponse(await fetch(API_URL, {
				method: "POST",
				headers: { "Content-Type": "application/json", Accept: "application/json" },
				body: JSON.stringify(payload)
			}));
			form.reset();
			showMessage(formMessage, "Élément ajouté.", "success");
			await loadItems();
		} catch (error) {
			showMessage(formMessage, `Impossible d’ajouter l’élément : ${error.message}`, "error");
		} finally {
			submitButton.disabled = false;
		}
	});

	document.querySelector("#refresh-button").addEventListener("click", loadItems);
	loadItems();
})();
