const SETTINGS_KEY = "orbitSettings";

const defaultSettings = {
  autoBlank: false,
  cloak: false,
  panic: false,
  proxy: true
};

function getSettings() {
  const saved = localStorage.getItem(SETTINGS_KEY);
  return saved ? JSON.parse(saved) : defaultSettings;
}

function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

const settings = getSettings();

function cloak(title, icon) {
  document.title = title;
  let link = document.querySelector("link[rel='icon']");
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.href = icon;
}

if(settings.cloak){
  const cloakTitle="Google Classroom"
  const cloakIcon="https://ssl.gstatic.com/classroom/favicon.png"

  const applyCloak=()=>{
    document.title=cloakTitle
    let icon=document.querySelector("link[rel='icon']")
    if(!icon){
      icon=document.createElement("link")
      icon.rel="icon"
      document.head.appendChild(icon)
    }
    icon.href=cloakIcon
  }

  applyCloak()
  setInterval(applyCloak,500)
}

if (settings.autoBlank && location.protocol !== "about:" && !location.search.includes("noblank")) {
  const w = window.open("about:blank", "_blank");
  const i = w.document.createElement("iframe");
  i.src = location.href + "?noblank=1";
  i.style.border = "none";
  i.style.width = "100%";
  i.style.height = "100%";
  w.document.body.style.margin = "0";
  w.document.body.appendChild(i);
  location.replace("https://classroom.google.com");
}

if (settings.panic) {
  document.addEventListener("keydown", e => {
    if (e.key === "`") {
      location.href = "https://classroom.google.com";
    }
  });
}

const menuBtn = document.getElementById("menuBtn");
const menu = document.getElementById("menu");
if (menuBtn && menu) {
  menuBtn.onclick = () => menu.classList.toggle("open");
}

async function loadGames() {
  const res = await fetch("games.json");
  const games = await res.json();
  return games;
}

function renderGames(games) {
  const grid = document.getElementById("gamesGrid");
  grid.innerHTML = "";
  games.forEach(g => {
    const card = document.createElement("div");
    card.className = "card";
    card.onclick = () => location.href = `p.html?id=${g.id}`;
    card.innerHTML = `
      <img class="thumb" src="${g.image}">
      <div class="card-title">${g.name}</div>
    `;
    grid.appendChild(card);
  });
}

function filterGames(all, q) {
  q = q.toLowerCase();
  return all.filter(g => g.name.toLowerCase().includes(q));
}

if (document.getElementById("gamesGrid")) {
  let all = [];
  loadGames().then(g => {
    all = g;
    renderGames(all);
  });
  const search = document.getElementById("gameSearch");
  search.oninput = () => {
    renderGames(filterGames(all, search.value));
  };
}

if (document.getElementById("gameFrame")) {
  loadGames().then(games => {
    const id = new URLSearchParams(location.search).get("id");
    const game = games.find(x => x.id === id);
    if (game) {
      document.title = game.name + " - Orbit";
      document.getElementById("gameTitle").textContent = game.name;
      document.getElementById("gameFrame").src = game.url;
    }
  });
}

const aboutBtn = document.getElementById("aboutBlankBtn");
if (aboutBtn) {
  aboutBtn.onclick = () => {
    const w = window.open("about:blank", "_blank");
    const iframe = w.document.createElement("iframe");
    iframe.src = location.href;
    iframe.style.border = "none";
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    w.document.body.style.margin = "0";
    w.document.body.appendChild(iframe);
  };
}

const SCRAMJET_PREFIX="/scramjet/"
const SETTINGS_KEY="orbitSettings"

const defaultSettings={
  autoBlank:false,
  cloak:true,
  panic:true,
  proxy:true
}

function getSettings(){
  const s=localStorage.getItem(SETTINGS_KEY)
  return s?JSON.parse(s):defaultSettings
}

function saveSettings(s){
  localStorage.setItem(SETTINGS_KEY,JSON.stringify(s))
}

const settings=getSettings()


if (document.getElementById("autoBlankToggle")) {
  const auto = document.getElementById("autoBlankToggle");
  const cloakToggle = document.getElementById("cloakToggle");
  const panic = document.getElementById("panicToggle");
  const proxy = document.getElementById("proxyToggle");
  const reset = document.getElementById("resetBtn");

  auto.checked = settings.autoBlank;
  cloakToggle.checked = settings.cloak;
  panic.checked = settings.panic;
  proxy.checked = settings.proxy;

  auto.onchange = () => {
    settings.autoBlank = auto.checked;
    saveSettings(settings);
  };

  cloakToggle.onchange = () => {
    settings.cloak = cloakToggle.checked;
    saveSettings(settings);
  };

  panic.onchange = () => {
    settings.panic = panic.checked;
    saveSettings(settings);
  };

  proxy.onchange = () => {
    settings.proxy = proxy.checked;
    saveSettings(settings);
  };

  reset.onclick = () => {
    Object.assign(settings, defaultSettings);
    saveSettings(settings);
    auto.checked = settings.autoBlank;
    cloakToggle.checked = settings.cloak;
    panic.checked = settings.panic;
    proxy.checked = settings.proxy;
    location.reload();
  };
}
