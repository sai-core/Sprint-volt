const SUPABASE_URL = "https://kvosgbxpqnuimaievngy.supabase.co";

const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2b3NnYnhwcW51aW1haWV2bmd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5NDAxMDUsImV4cCI6MjA5NzUxNjEwNX0.4xyHmpouSbWvZSD5z0mDhvf175S_dubHTBbMvojJRqE";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

loadMovies();

async function loadMovies(){

  const { data, error } = await supabaseClient
  .from("videos")
  .select("*")
  .order("id",{ascending:false});

  if(error){
    console.log(error);
    return;
  }

  const movies = document.getElementById("movies");

  movies.innerHTML = "";

  data.forEach(movie=>{

    movies.innerHTML += `
    <div class="card">

      <img src="${movie.thumbnail}">

      <h3>${movie.title}</h3>

      <button onclick="watchMovie('${movie.video_link}')">
      Watch Now
      </button>

    </div>
    `;

  });

}

function watchMovie(url){
  window.open(url,"_blank");
}
