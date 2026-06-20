// ============================================================
// SPRINT VOLT — app.js (With Sidebar + Watch Page)
// ============================================================

const SUPABASE_URL = "https://kvosgbxpqnuimaievngy.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2b3NnYnhwcW51aW1haWV2bmd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5NDAxMDUsImV4cCI6MjA5NzUxNjEwNX0.4xyHmpouSbWvZSD5z0mDhvf175S_dubHTBbMvojJRqE";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const moviesEl   = document.getElementById("movies");
const statusEl   = document.getElementById("status");
const filtersEl  = document.getElementById("filters");
const searchEl   = document.getElementById("search");

let allMovies       = [];
let activeCategory  = "all";
let searchTerm      = "";

// Initialize
init();

async function init(){
  renderSkeletons(8);
  await loadMovies();
}

// Load Movies from Supabase
async function loadMovies(){
  console.log("🔍 Loading movies from Supabase...");
  
  const { data, error } = await supabaseClient
    .from("videos")
    .select("*")
    .order("id", { ascending: false });

  console.log("📦 Raw response:", { data, error });

  if (error){
    console.error("❌ Supabase error:", error);
    showStatus("Couldn't load the catalog", error.message || "Check your Supabase URL and key, then refresh.");
    moviesEl.innerHTML = "";
    return;
  }

  console.log(`✅ Loaded ${data?.length || 0} movies`);
  allMovies = data || [];
  
  // Update total count in sidebar
  document.getElementById("allCount").textContent = allMovies.length;
  
  // Build sidebar genres
  buildSidebarGenres(allMovies);
  
  // Build top filters
  buildFilters(allMovies);
  
  render();
}

// Build Sidebar Genres
function buildSidebarGenres(movies){
  const categories = Array.from(
    new Set(movies.map(m => (m.category || "").trim()).filter(Boolean))
  ).sort();

  const container = document.getElementById("sidebarGenres");
  
  if (categories.length === 0){
    container.innerHTML = '<p style="padding:10px 12px;color:var(--text-faint);font-size:12px;">No genres yet</p>';
    return;
  }

  container.innerHTML = categories.map(cat => {
    const count = movies.filter(m => (m.category || "").trim() === cat).length;
    return `
      <div class="genre-item" data-category="${escapeHtml(cat)}" onclick="setCategory('${escapeHtml(cat)}', this)">
        <span>${escapeHtml(cat)}</span>
        <span class="genre-count">${count}</span>
      </div>
    `;
  }).join("");
}

// Build Top Filter Chips
function buildFilters(movies){
  const categories = Array.from(
    new Set(movies.map(m => (m.category || "").trim()).filter(Boolean))
  ).sort();

  filtersEl.innerHTML = "";
  filtersEl.appendChild(makeChip("All", "all"));
  categories.forEach(cat => filtersEl.appendChild(makeChip(cat, cat)));
}

// Make Filter Chip
function makeChip(label, value){
  const btn = document.createElement("button");
  btn.className = "chip" + (value === activeCategory ? " is-active" : "");
  btn.textContent = label;
  btn.dataset.category = value;
  btn.addEventListener("click", () => {
    activeCategory = value;
    // Update sidebar active state
    document.querySelectorAll('.sidebar .genre-item').forEach(item => {
      item.classList.toggle('active', item.dataset.category === value);
    });
    // Update top chips
    [...filtersEl.children].forEach(c => c.classList.toggle("is-active", c.dataset.category === value));
    render();
  });
  return btn;
}

// Set Category (from sidebar)
function setCategory(category, element){
  activeCategory = category;
  
  // Update sidebar active
  document.querySelectorAll('.sidebar .genre-item').forEach(item => {
    item.classList.remove('active');
  });
  if (element) element.classList.add('active');
  
  // Update top chips
  [...filtersEl.children].forEach(c => c.classList.toggle("is-active", c.dataset.category === category));
  
  render();
  
  // Close sidebar on mobile
  if (window.innerWidth <= 768){
    toggleSidebar();
  }
}

// Toggle Sidebar (mobile)
function toggleSidebar(){
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebarOverlay').classList.toggle('show');
}

// Search Input Handler
searchEl.addEventListener("input", (e) => {
  searchTerm = e.target.value.trim().toLowerCase();
  render();
});

// Render Movies
function render(){
  const filtered = allMovies.filter(m => {
    const matchesCategory = activeCategory === "all" || (m.category || "") === activeCategory;
    const matchesSearch = !searchTerm || (m.title || "").toLowerCase().includes(searchTerm);
    return matchesCategory && matchesSearch;
  });

  console.log(`🎬 Rendering ${filtered.length} movies (filtered from ${allMovies.length})`);

  if (filtered.length === 0){
    moviesEl.innerHTML = "";
    showStatus(
      allMovies.length === 0 ? "No movies yet" : "No matches",
      allMovies.length === 0 ? "Add a movie from the admin panel to get started." : "Try a different title or category."
    );
    return;
  }

  hideStatus();
  moviesEl.innerHTML = filtered.map((movie, i) => cardTemplate(movie, i)).join("");

  // Add click handlers to cards
  moviesEl.querySelectorAll(".card").forEach(card => {
    card.addEventListener("click", () => {
      const movieId = card.dataset.id;
      location.href = `watch.html?id=${movieId}`;
    });
  });
}

// Card Template
function cardTemplate(movie, index){
  const title    = escapeHtml(movie.title || "Untitled");
  const desc     = escapeHtml(movie.description || "");
  const cat      = escapeHtml(movie.category || "");
  const thumb    = movie.thumbnail || "";
  const hasThumb = thumb && thumb.trim() !== "";
  const delay    = Math.min(index * 0.04, 0.4);
  const initial  = title.charAt(0).toUpperCase();

  return `
    <div class="card" data-id="${movie.id}" style="animation-delay:${delay}s">
      <div class="poster-wrap">
        ${cat ? `<span class="category-badge">${cat}</span>` : ""}
        ${hasThumb 
          ? `<img src="${thumb}" alt="${title}" loading="lazy" onerror="this.parentElement.classList.add('img-error')">`
          : `<div class="poster-placeholder">
               <span class="placeholder-initial">${initial}</span>
               <svg class="placeholder-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                 <polygon points="5,3 19,12 5,21"></polygon>
               </svg>
             </div>`
        }
        <div class="play-overlay">
          <button class="play-btn" aria-label="Watch ${title}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#0a0a12">
              <path d="M8 5v14l11-7z"></path>
            </svg>
          </button>
        </div>
      </div>
      <div class="card-info">
        <h3 class="card-title">${title}</h3>
        ${desc ? `<p class="card-desc">${desc}</p>` : ""}
      </div>
    </div>
  `;
}

// Skeleton Loading
function renderSkeletons(count){
  hideStatus();
  moviesEl.innerHTML = Array.from({ length: count }).map(() => `
    <div class="skeleton">
      <div class="poster-wrap"></div>
      <div class="card-info">
        <div class="bar"></div>
        <div class="bar"></div>
      </div>
    </div>
  `).join("");
}

// Show Status Message
function showStatus(title, body){
  statusEl.classList.add("is-visible");
  statusEl.innerHTML = `<div class="status-title">${escapeHtml(title)}</div><div>${escapeHtml(body)}</div>`;
}

// Hide Status
function hideStatus(){
  statusEl.classList.remove("is-visible");
  statusEl.innerHTML = "";
}

// Escape HTML
function escapeHtml(str){
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
