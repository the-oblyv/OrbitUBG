const SETTINGS_KEY = "orbitSettings";

const defaultSettings = {
  cloak: true,
  cloakTitle: "Google Classroom",
  cloakIcon: "https://ssl.gstatic.com/classroom/favicon.png",
  panic: true,
  panicKey: "`"
};

function getSettings() {
  const s = localStorage.getItem(SETTINGS_KEY);
  return s ? JSON.parse(s) : structuredClone(defaultSettings);
}

function saveSettings(s) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

const settings = getSettings();
const SJ_PREFIX = "/sj/";

const defaultTitle = document.title;
let defaultIcon = document.querySelector("link[rel='icon']");
defaultIcon = defaultIcon ? defaultIcon.href : null;

let cloakInterval = null;

function applyCloak() {
  document.title = settings.cloakTitle;
  let l = document.querySelector("link[rel='icon']");
  if (!l) {
    l = document.createElement("link");
    l.rel = "icon";
    document.head.appendChild(l);
  }
  l.href = settings.cloakIcon;
}

function removeCloak() {
  document.title = defaultTitle;
  if (defaultIcon) {
    let l = document.querySelector("link[rel='icon']");
    if (!l) {
      l = document.createElement("link");
      l.rel = "icon";
      document.head.appendChild(l);
    }
    l.href = defaultIcon;
  }
  if (cloakInterval) {
    clearInterval(cloakInterval);
    cloakInterval = null;
  }
}

if (settings.cloak) {
  applyCloak();
  cloakInterval = setInterval(applyCloak, 500);
} else {
  removeCloak();
}

if (settings.panic) {
  document.addEventListener("keydown", e => {
    if (e.key === settings.panicKey) {
      location.href = "https://classroom.google.com";
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const menuBtn = document.getElementById("menuBtn");
  const menu = document.getElementById("menu");
  if (menuBtn) menuBtn.onclick = () => menu.classList.toggle("open");

  const search = document.getElementById("proxySearch");
  if (search) {
    search.addEventListener("keydown", e => {
      if (e.key !== "Enter") return;
      let q = search.value.trim();
      if (!q) return;
    });
  }

  const gamesGrid = document.getElementById("gamesGrid");
  if (gamesGrid) {
    fetch("/games.json")
      .then(r => r.json())
      .then(games => {
        games.sort((a, b) => a.name.localeCompare(b.name));

        const renderGames = list => {
          gamesGrid.innerHTML = "";

          const requestCard = document.createElement("div");
          requestCard.className = "card";
          requestCard.onclick = () => window.open("https://forms.gle/WdSBv4jkFo3nwvFz8", "_blank");
          requestCard.innerHTML = `
            <img class="thumb" src="/res/googleform.webp">
            <div class="card-title">!! Request a Game</div>
          `;
          gamesGrid.appendChild(requestCard);

          list.forEach(game => {
            const c = document.createElement("div");
            c.className = "card";
            c.onclick = () => location.href = `/p?id=${game.id}`;
            c.innerHTML = `
              <img class="thumb" src="${game.image}">
              <div class="card-title">${game.name}</div>
            `;
            gamesGrid.appendChild(c);
          });
        };

        renderGames(games);

        const gameSearchInput = document.getElementById("gameSearch");
        if (gameSearchInput) {
          gameSearchInput.oninput = () =>
            renderGames(games.filter(game =>
              game.name.toLowerCase().includes(gameSearchInput.value.toLowerCase())
            ));
        }
      });
  }

  const gameFrame = document.getElementById("gameFrame");
  if (gameFrame) {
    fetch("/games.json")
      .then(r => r.json())
      .then(games => {
        const id = new URLSearchParams(location.search).get("id");
        const game = games.find(x => x.id === id);
        if (game) gameFrame.src = game.url;
      });
  }

  const fsBtn = document.getElementById("fullscreenBtn");
  if (fsBtn && gameFrame) fsBtn.onclick = () => gameFrame.requestFullscreen?.();

  const blankBtn = document.getElementById("blankBtn");
  if (blankBtn && gameFrame) {
    blankBtn.onclick = () => {
      const w = window.open("about:blank", "_blank");
      if (!w) return;
      const i = w.document.createElement("iframe");
      i.src = gameFrame.src;
      i.style.border = "none";
      i.style.width = "100%";
      i.style.height = "100%";
      w.document.body.style.margin = "0";
      w.document.body.appendChild(i);
    };
  }

  const cloakToggle = document.getElementById("cloakToggle");
  const cloakTitleInput = document.getElementById("cloakTitleInput");
  const cloakIconInput = document.getElementById("cloakIconInput");
  const panicToggle = document.getElementById("panicToggle");
  const panicKeyInput = document.getElementById("panicKeyInput");

  if (cloakToggle) {
    cloakToggle.checked = settings.cloak;
    cloakTitleInput.value = settings.cloakTitle;
    cloakIconInput.value = settings.cloakIcon;
    panicToggle.checked = settings.panic;
    panicKeyInput.value = settings.panicKey;

    cloakToggle.onchange = () => {
      settings.cloak = cloakToggle.checked;
      saveSettings(settings);
      location.reload();
    };

    cloakTitleInput.oninput = () => {
      settings.cloakTitle = cloakTitleInput.value || "Google Classroom";
      saveSettings(settings);
      if (settings.cloak) applyCloak();
    };

    cloakIconInput.oninput = () => {
      settings.cloakIcon = cloakIconInput.value || "https://ssl.gstatic.com/classroom/favicon.png";
      saveSettings(settings);
      if (settings.cloak) applyCloak();
    };

    panicToggle.onchange = () => {
      settings.panic = panicToggle.checked;
      saveSettings(settings);
    };

    panicKeyInput.onkeydown = e => {
      e.preventDefault();
      settings.panicKey = e.key;
      panicKeyInput.value = e.key;
      saveSettings(settings);
    };
  }

  const aboutBtn = document.getElementById("aboutBlankBtn");
  if (aboutBtn) {
    aboutBtn.onclick = () => {
      const w = window.open("about:blank", "_blank");
      if (!w) return;
      const i = w.document.createElement("iframe");
      i.src = location.href;
      i.style.border = "none";
      i.style.width = "100%";
      i.style.height = "100%";
      w.document.body.style.margin = "0";
      w.document.body.appendChild(i);
    };
  }

  const appsGrid = document.getElementById("appsGrid");
  if (appsGrid) {
    fetch("/apps.json")
      .then(r => r.json())
      .then(apps => {
        apps.sort((a, b) => a.name.localeCompare(b.name));

        const renderApps = list => {
          appsGrid.innerHTML = "";

          const requestCard = document.createElement("div");
          requestCard.className = "card";
          requestCard.onclick = () => window.open("https://forms.gle/WdSBv4jkFo3nwvFz8", "_blank");
          requestCard.innerHTML = `
            <img class="thumb" src="/res/googleform.webp">
            <div class="card-title">!! Request an App</div>
          `;
          appsGrid.appendChild(requestCard);

          list.forEach(app => {
            const c = document.createElement("div");
            c.className = "card";
            c.onclick = () => location.href = `/a?id=${app.id}`;
            c.innerHTML = `
              <img class="thumb" src="${app.image}">
              <div class="card-title">${app.name}</div>
            `;
            appsGrid.appendChild(c);
          });
        };

        renderApps(apps);

        const appSearchInput = document.getElementById("appSearch");
        if (appSearchInput) {
          appSearchInput.oninput = () =>
            renderApps(apps.filter(app =>
              app.name.toLowerCase().includes(appSearchInput.value.toLowerCase())
            ));
        }
      });
  }

  const appFrame = document.getElementById("appFrame");
  if (appFrame) {
    fetch("/apps.json")
      .then(r => r.json())
      .then(apps => {
        const id = new URLSearchParams(location.search).get("id");
        const app = apps.find(x => x.id === id);
        if (app) appFrame.src = app.url;
      });
  }
});
