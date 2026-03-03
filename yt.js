const API_URL = "https://9.dmvdriverseducation.org/api/youtube/search/";
const SCRAPE_URL = "https://9.dmvdriverseducation.org/worker/watch/yt/dl/mix/";
const MAX_RESULTS = 30;

let currentQuery = "";
let isLoading = false;
let plyrInstance = null;
let fetchId = 0;

const browserView = browserViewEl;
const playbackOverlay = playbackOverlayEl;
const playerContainer = playerContainerEl;
const grid = gridEl;
const searchInput = searchInputEl;
const loadingSpinner = loadingSpinnerEl;
const noResults = noResultsEl;
const rippleLoader = rippleLoaderEl;
const backBtn = backBtnEl;
const nowPlaying = nowPlayingEl;

function debounce(func, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
}

function extractYouTubeId(input) {
  try {
    const url = new URL(input.trim());
    if (url.hostname.includes("youtu.be")) {
      return url.pathname.slice(1);
    }
    if (url.hostname.includes("youtube.com")) {
      if (url.pathname.startsWith("/watch")) {
        return url.searchParams.get("v");
      }
      if (url.pathname.startsWith("/shorts/")) {
        return url.pathname.split("/shorts/")[1];
      }
      if (url.pathname.startsWith("/embed/")) {
        return url.pathname.split("/embed/")[1];
      }
    }
  } catch {}
  return null;
}

function toggleLoading(state) {
  isLoading = state;
  loadingSpinner.classList.toggle("active", state);
}

async function fetchVideos() {
  if (isLoading) return;
  toggleLoading(true);

  fetchId++;
  const currentFetchId = fetchId;

  const possibleId = extractYouTubeId(currentQuery);
  if (possibleId) {
    toggleLoading(false);
    playVideo(possibleId, "YouTube Video");
    return;
  }

  const query = currentQuery.trim().replace(/\s/g, "+") || "trending videos";

  Array.from(grid.children).forEach(child => {
    if (child.id !== "loadingSpinnerEl" && child.id !== "noResultsEl") {
      grid.removeChild(child);
    }
  });

  noResults.style.display = "none";

  try {
    const res = await fetch(`${API_URL}${query}?max=${MAX_RESULTS}`);
    if (currentFetchId !== fetchId) return;
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    const data = await res.json();

    if (!data?.items?.length) {
      noResults.style.display = "block";
      noResults.textContent = "No results found.";
    } else {
      renderVideos(data.items);
    }
  } catch (err) {
    if (currentFetchId === fetchId) {
      noResults.style.display = "block";
      noResults.textContent = `Error: ${err.message}`;
    }
  } finally {
    if (currentFetchId === fetchId) toggleLoading(false);
  }
}

function renderVideos(items) {
  const fragment = document.createDocumentFragment();

  items.forEach(item => {
    const title = item.title || "Untitled Video";
    const videoId = item.videoId;
    const channelName = item.author?.name || "Unknown Channel";
    const thumbnail = item.thumbnail || "https://placehold.co/600x400?text=No+Thumbnail";
    if (!videoId) return;

    const card = document.createElement("div");
    card.className = "card youtube-card";
    card.dataset.videoId = videoId;
    card.dataset.title = title;

    card.innerHTML = `
      <div class="thumbnail-container">
        <img src="${thumbnail}" alt="${title}" loading="lazy">
      </div>
      <div class="video-info">
        <div class="card-name" title="${title}">${title}</div>
        <div class="channel-name">${channelName}</div>
      </div>
    `;

    card.addEventListener("click", () => playVideo(videoId, title));
    fragment.appendChild(card);
  });

  grid.insertBefore(fragment, loadingSpinner);
  noResults.style.display = "none";
}

function destroyPlayer() {
  if (plyrInstance) {
    plyrInstance.destroy();
    plyrInstance = null;
  }
  Array.from(playerContainer.children).forEach(child => {
    if (child.id !== "rippleLoaderEl") playerContainer.removeChild(child);
  });
  rippleLoader.style.display = "none";
  rippleLoader.classList.remove("active");
}

function exitPlayback() {
  playbackOverlay.style.opacity = "0";
  setTimeout(() => {
    playbackOverlay.style.display = "none";
    playbackOverlay.classList.remove("active");
    destroyPlayer();
    browserView.style.display = "flex";
    requestAnimationFrame(() => browserView.style.opacity = "1");
  }, 400);
}

async function playVideo(videoId, title) {
  destroyPlayer();
  browserView.style.opacity = "0";

  setTimeout(() => {
    browserView.style.display = "none";
    playbackOverlay.style.display = "flex";
    nowPlaying.textContent = title;
    requestAnimationFrame(() => playbackOverlay.classList.add("active"));
    setupScrapePlayer(videoId);
  }, 400);
}

async function setupScrapePlayer(videoId) {
  rippleLoader.style.display = "block";
  requestAnimationFrame(() => rippleLoader.classList.add("active"));

  try {
    const res = await fetch(`${SCRAPE_URL}${videoId}`);
    if (!res.ok) throw new Error(`Failed to fetch video source. Status: ${res.status}`);
    let videoUrl = await res.text();

    if (videoUrl.trim().startsWith("{")) {
      try {
        const jsonData = JSON.parse(videoUrl);
        videoUrl = jsonData.url || jsonData.src || jsonData.videoUrl || videoUrl;
      } catch {}
    }

    if (!videoUrl || typeof videoUrl !== "string" || !videoUrl.startsWith("http")) {
      throw new Error("Invalid video URL received.");
    }

    const videoEl = document.createElement("video");
    videoEl.style.width = "100%";
    videoEl.style.height = "100%";
    videoEl.style.opacity = "0";
    videoEl.setAttribute("playsinline", "");
    playerContainer.appendChild(videoEl);

    plyrInstance = new Plyr(videoEl, {
      controls: ["play-large", "play", "progress", "current-time", "mute", "volume", "settings", "fullscreen"]
    });

    plyrInstance.on("ready", () => {
      const controls = playerContainer.querySelector(".plyr__controls");
      if (controls) {
        const downloadBtn = document.createElement("button");
        downloadBtn.type = "button";
        downloadBtn.className = "plyr__control";
        downloadBtn.innerHTML = `
          <svg viewBox="0 0 24 24" style="fill:currentColor;width:18px;height:18px;">
            <path d="M17 18v1H6v-1H2v4h20v-4h-4zM3.5 7h4V1h9v6h4l-8.5 9L3.5 7z"/>
          </svg>
        `;
        downloadBtn.onclick = () => {
          const a = document.createElement("a");
          a.href = videoUrl;
          a.download = `${nowPlaying.textContent || "video"}.mp4`;
          a.target = "_blank";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        };
        controls.appendChild(downloadBtn);
      }
    });

    videoEl.src = videoUrl;

    plyrInstance.on("canplay", () => {
      rippleLoader.classList.remove("active");
      setTimeout(() => rippleLoader.style.display = "none", 300);
      const plyrEl = playerContainer.querySelector(".plyr");
      if (plyrEl) plyrEl.style.opacity = "1";
      videoEl.style.opacity = "1";
      plyrInstance.play().catch(() => {});
    });
  } catch (error) {
    rippleLoader.style.display = "none";
    rippleLoader.classList.remove("active");
    const errorMsg = document.createElement("div");
    errorMsg.className = "player-error";
    errorMsg.textContent = error.message || "An unknown error occurred";
    playerContainer.appendChild(errorMsg);
  }
}

const debouncedSearch = debounce(() => {
  currentQuery = searchInput.value.trim();
  fetchVideos();
}, 600);

searchInput.addEventListener("input", debouncedSearch);
backBtn.addEventListener("click", exitPlayback);

fetchVideos();
