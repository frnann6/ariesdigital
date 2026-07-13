const btnOpen = document.getElementById("btnOpen");
const coverScreen = document.getElementById("coverScreen");
const invitation = document.getElementById("invitation");
const musicToggle = document.getElementById("musicToggle");
const weddingMusic = document.getElementById("weddingMusic");

let musicEnabled = false;

function setMusicButtonState(isPlaying) {
  musicToggle.innerHTML = isPlaying
    ? `<i class="bi bi-pause-circle"></i>`
    : `<i class="bi bi-play-circle"></i>`;
  musicToggle.setAttribute("aria-pressed", String(isPlaying));
}

async function playMusicIfAllowed() {
  if (!musicEnabled || document.hidden) return;

  try {
    await weddingMusic.play();
    setMusicButtonState(true);
  } catch (error) {
    console.log("Tidak bisa memutar musik saat ini.");
    setMusicButtonState(false);
  }
}

function pauseMusic() {
  weddingMusic.pause();
  setMusicButtonState(false);
}

btnOpen.addEventListener("click", async () => {
  coverScreen.classList.add("is-closing");
  invitation.style.display = "block";

  // Refresh AOS ketika konten ditampilkan
  AOS.refresh();

  musicEnabled = true;
  await playMusicIfAllowed();

  setTimeout(() => {
    coverScreen.style.display = "none";
  }, 3000);
});

musicToggle.addEventListener("click", async () => {
  if (musicEnabled) {
    musicEnabled = false;
    pauseMusic();
  } else {
    musicEnabled = true;
    await playMusicIfAllowed();
  }
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    pauseMusic();
  } else if (musicEnabled) {
    playMusicIfAllowed();
  }
});

window.addEventListener("blur", () => {
  if (musicEnabled) {
    pauseMusic();
  }
});

window.addEventListener("focus", () => {
  if (musicEnabled && !document.hidden) {
    playMusicIfAllowed();
  }
});

setMusicButtonState(false);
