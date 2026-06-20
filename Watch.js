// ============================================================
// SPRINT VOLT — watch.js
// ============================================================

const SUPABASE_URL = "https://kvosgbxpqnuimaievngy.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2b3NnYnhwcW51aW1haWV2bmd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5NDAxMDUsImV4cCI6MjA5NzUxNjEwNX0.4xyHmpouSbWvZSD5z0mDhvf175S_dubHTBbMvojJRqE";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const statusEl       = document.getElementById("status");
const playerFrameEl  = document.getElementById("playerFrame");
const watchInfoEl    = document.getElementById("watchInfo");
const relatedHeading = document.getElementById("relatedHeading");
const relatedGridEl  = document.getElementById("relatedGrid");
const backBtn        = document.getElementById("backBtn");

backBtn.addEventListener("click", () => {
  if (document.referrer && document.referrer.includes(location.host)) {
    history.back();
  } else {
    location.href = "index.html";
  }
});

const params  = new URLSearchParams(location.search);
const movieId = params.get("id");

init();

async function init(){
  if (!movieId){
    showError("No movie selected", "Head back to the catalog and pick something to watch.");
    return;
  }

  showLoading();

  const { data: movie, error } = await supabaseClient
    .from("videos")
    .select("*")
    .eq("id", movieId)
    .single();

  if (error || !movie){
    showError("Couldn't find that title", "It may have been removed. Head back to the catalog.");
    return;
  }

  hideStatus();
  renderPlayer(movie);
  renderInfo(movie);
  loadRelated(movie);
}

function renderPlayer(movie){
  const src = movie.video_link || "";
  playerFrameEl.innerHTML = embedMarkup(src);
}

function embedMarkup(url){
  if (!url) return `<div class="player-empty">No video link set for this title.</div>`;

  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
  if (yt){
    return `<iframe src="https://www.youtube.com/embed/${yt[1]}?autoplay=1&rel=0" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
  }

  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo){
    return `<iframe src="https://player.vimeo.com/video/${vimeo[1]}?autoplay=1" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
  }

  const drive = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/);
  if (drive){
    return `<iframe src="https://drive.google.com/file/d/${drive[1]}/preview" allow="autoplay" allowfullscreen></iframe>`;
  }

  // direct video file (mp4, webm, m3u8, etc.) or any other direct stream URL
  return `<video src="${url}" controls autoplay playsinline></video>`;
}

function renderInfo(movie){
  const title = escapeHtml(movie.title || "Untitled");
  const cat   = escapeHtml(movie.category || "");
  const desc  = escapeHtml(movie.description || "No description available.");

  watchInfoEl.innerHTML = `
    <h1 class="watch-title">${title}</h1>
    ${cat ? `<span class="category-pill">${cat}</span>` : ""}
    <p class="watch-desc">${desc}</p>
  `;
}

async function loadRelated(movie){
  if (!movie.category){
    relatedHeading.style.display = "none";
    return;
  }

  const { data, error } = await supabaseClient
    .from("videos")
    .select("*")
    .eq("category", movie.category)
    .neq("id", movie.id)
    .order("id", { ascending: false })
    .limit(6);

  if (error || !data || data.length === 0){
    relatedHeading.style.display = "none";
    return;
  }

  relatedHeading.textContent = `More in ${movie.category}`;
  relatedGridEl.innerHTML = data.map(relatedCard).join("");
}

function relatedCard(movie){
  const title = escapeHtml(movie.title || "Untitled");
  const thumb = movie.thumbnail || "";
  return `
    <a class="card" href="watch.html?id=${movie.id}">
      <div class="poster-wrap">
        <img src="${thumb}" alt="${title}" loading="lazy" onerror="this.style.opacity=0">
        <div class="play-overlay">
          <span class="play-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#0a0a12"><path d="M8 5v14l11-7z"></path></svg>
          </span>
        </div>
      </div>
      <div class="card-info">
        <h3 class="card-title">${title}</h3>
      </div>
    </a>
  `;
}

function showLoading(){
  statusEl.classList.add("is-visible");
  statusEl.innerHTML = `<div class="status-title">Loading…</div>`;
  playerFrameEl.innerHTML = "";
  watchInfoEl.innerHTML = "";
}

function showError(title, body){
  statusEl.classList.add("is-visible");
  statusEl.innerHTML = `<div class="status-title">${escapeHtml(title)}</div><div>${escapeHtml(body)}</div>`;
  playerFrameEl.innerHTML = "";
  watchInfoEl.innerHTML = "";
}

function hideStatus(){
  statusEl.classList.remove("is-visible");
  statusEl.innerHTML = "";
}

function escapeHtml(str){
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
                           }
