const navHTML = `
<div class="nav-inner">
<img src="/res/orbit-no-bg.png" class="nav-logo">
<div class="nav-links">
<a href="/"><i class="fa-solid fa-house"></i> Home</a>
<a href="/g"><i class="fa-solid fa-gamepad"></i> Games</a>
<a href="/a"><i class="fa-solid fa-archive"></i> Apps</a>
<a href="/ai"><i class="fa-solid fa-robot"></i> AI</a>
<a href="/med"><i class="fa-solid fa-photo-film"></i> Media</a>
<a href="/prx"><i class="fa-solid fa-globe"></i> Proxy</a>
<div class="more-wrapper" id="moreWrapper">
<button class="more-btn" id="moreBtn">
<i class="fa-solid fa-ellipsis"></i> More
</button>
<div class="more-dropdown">
<a href="/partners"><img src="/res/partners.svg" class="partner-card"></img> Partners</a>
<a href="/s"><i class="fa-solid fa-gear"></i> Settings</a>
</div>
</div>
</div>
</div>
`;

const menuHTML = `
<a href="/"><i class="fa-solid fa-house"></i> Home</a>
<a href="/g"><i class="fa-solid fa-gamepad"></i> Games</a>
<a href="/a"><i class="fa-solid fa-archive"></i> Apps</a>
<a href="/ai"><i class="fa-solid fa-robot"></i> AI</a>
<a href="/med"><i class="fa-solid fa-photo-film"></i> Media</a>
<a href="/prx"><i class="fa-solid fa-globe"></i> Proxy</a>
<hr style="border:none;height:1px;background:rgba(255,255,255,.1);margin:10px 0;">
<a href="/partners"><img src="/res/partners.svg" class="partner-card"></img> Partners</a>
<a href="/s"><i class="fa-solid fa-gear"></i> Settings</a>
`;

const navMount = document.getElementById("navMount");
const menu = document.getElementById("menu");

if (navMount) navMount.innerHTML = navHTML;
if (menu) menu.innerHTML = menuHTML;

const menuBtn = document.getElementById("menuBtn");
if (menuBtn && menu) {
  menuBtn.onclick = () => menu.classList.toggle("open");
}

const moreBtn = document.getElementById("moreBtn");
const moreWrapper = document.getElementById("moreWrapper");

if (moreBtn && moreWrapper) {
  moreBtn.onclick = (e) => {
    e.stopPropagation();
    moreWrapper.classList.toggle("open");
  };

  document.addEventListener("click", () => {
    moreWrapper.classList.remove("open");
  });
}
