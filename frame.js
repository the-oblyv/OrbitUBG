const navHTML = `
<div class="nav-inner">
  <img src="/res/orbit-no-bg.png" class="nav-logo">
  <div class="nav-links">
    <a href="/"><i class="fa-solid fa-house"></i> Home</a>
    <a href="/g"><i class="fa-solid fa-gamepad"></i> Games</a>
    <a href="/a"><i class="fa-solid fa-archive"></i> Apps</a>
    <a href="/s"><i class="fa-solid fa-gear"></i> Settings</a>
  </div>
  <i class="fa-solid fa-bars menu-btn" id="menuBtn"></i>
</div>
`

const menuHTML = `
<a href="/"><i class="fa-solid fa-house"></i> Home</a>
<a href="/g"><i class="fa-solid fa-gamepad"></i> Games</a>
<a href="/a"><i class="fa-solid fa-archive"></i> Apps</a>
<a href="/s"><i class="fa-solid fa-gear"></i> Settings</a>
`

const navMount = document.getElementById("navMount")
const menu = document.getElementById("menu")

if (navMount) navMount.innerHTML = navHTML
if (menu) menu.innerHTML = menuHTML

const menuBtn = document.getElementById("menuBtn")
if (menuBtn && menu) {
  menuBtn.onclick = () => menu.classList.toggle("open")
}
