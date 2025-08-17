// --- DOM refs ---
const progressBar = document.getElementById('progress-bar');
const pitchBtn = document.getElementById('pitch-btn');
const sbsBtn = document.getElementById('sbs-btn');
const dismissBtn = document.getElementById('dismiss-btn');
const countdown = document.getElementById('countdown');
const scoreCounter = document.getElementById('score-counter');
const loopCounter = document.getElementById('loop-counter');
const comboText = document.getElementById('combo-text');
const buttonsContainer = document.getElementById('buttons');

const powerBtn = document.getElementById("power-btn");
const powerTitle = document.getElementById("power-title");
const powerPanel = document.getElementById("power-panel");
const powerOverlay = document.getElementById("power-panel-overlay");
const powerItems = document.querySelectorAll(".power-item");
const commitBtn = document.getElementById("power-commit-btn");
const rouletteAudio = document.getElementById('roulette-audio');

const resetBtn = document.getElementById('reset-btn');
const eventsBtn = document.getElementById('events-btn');
const eventsPanel = document.getElementById('events-panel');
const eventsList = document.getElementById('events-list');

// --- Timing / config ---
const pitchDuration = 20000; // 20s to empty
const yesCooldown = 10000;   // 10s freeze after clicking YES
const countdownStartSeconds = 6;
const countdownCyclesMax = 5;
const comboTimeout = 5000;   // 5s window for combos
const comboMax = 10;
const POWER_COST = 1;

// --- State ---
let startTime = null;
let animationFrameId = null;
let paused = false;
let pausedAt = 0;

let yesActive = false;
let yesTimeoutId = null;

let score = 0;
let loop = 0;
let obtainedItems = [];
let rouletteRunning = false;

let countdownCycle = 0;
let countdownInterval = null;

// Combo state
let comboCount = 0;
let comboTimer = null;

// Pitch click counter for loop increment
let pitchClicks = 0;

// Events state
let events = [];

// --- Helpers ---
function updateCounters() {
  scoreCounter.textContent = `SCORE: ${score}`;
  loopCounter.textContent = `LOOP: ${loop}`;

  // POWER button threshold
  if (loop >= POWER_COST) {
    if (!powerBtn.classList.contains("active")) {
      powerBtn.classList.add("active");
      powerTitle.classList.add("active");
      playOnce('POWER.mp3');
    }
  }
}

function addScore(delta) {
  score += delta;
  if (score < 0) score = 0;
  updateCounters();
}

function maybeAddLoop() {
  pitchClicks++;
  if (pitchClicks % 10 === 0) {
    loop++;
    updateCounters();
  }
}

function playOnce(src) {
  try {
    const a = new Audio(src);
    a.play();
  } catch (e) {}
}

function scoreSfxForCombo(n) {
  if (n >= 10) return 'SCORE10.mp3';
  if (n >= 7) return 'SCORE7.mp3';
  if (n >= 5) return 'SCORE5.mp3';
  if (n >= 2) return 'SCORE2.mp3';
  return 'SCORE.mp3';
}

function showComboText() {
  if (comboCount >= 2) {
    comboText.textContent = `x${comboCount} COMBO!`;
    comboText.classList.add('active');
  } else {
    comboText.textContent = '';
    comboText.classList.remove('active');
  }
}

function startComboTimer() {
  clearTimeout(comboTimer);
  comboTimer = setTimeout(() => {
    comboCount = 0;
    showComboText();
  }, comboTimeout);
}

function handlePitchScoring() {
  if (comboCount < comboMax) comboCount += 1;

  let extra = 0;
  if (comboCount >= 2 && comboCount <= 5) extra = 1;
  else if (comboCount > 5) extra = 2;

  addScore(1 + extra);
  maybeAddLoop();

  playOnce(scoreSfxForCombo(comboCount));
  showComboText();
  startComboTimer();
}

// --- Progress bar ---
function updateProgress(timestamp) {
  if (!startTime) startTime = timestamp;

  let elapsed = timestamp - startTime + pausedAt;
  let progress = Math.max(0, 1 - elapsed / pitchDuration);
  progressBar.style.width = (progress * 100) + '%';

  if (progress > 0 && !paused) {
    animationFrameId = requestAnimationFrame(updateProgress);
  } else if (progress <= 0) {
    progressBar.style.width = '0%';
    if (!countdownInterval) startCountdown();
  }
}

function resetProgress() {
  cancelAnimationFrame(animationFrameId);
  startTime = null;
  pausedAt = 0;
  paused = false;

  yesActive = false;
  clearTimeout(yesTimeoutId);

  sbsBtn.classList.remove('paused');
  sbsBtn.disabled = false;
  pitchBtn.disabled = false;
  pitchBtn.textContent = 'PITCH';
  pitchBtn.classList.remove('yes-active');
  progressBar.classList.remove('paused');

  dismissBtn.style.display = 'none';
  buttonsContainer.classList.remove('sbs-active');

  stopCountdown();

  progressBar.style.width = '100%';
  animationFrameId = requestAnimationFrame(updateProgress);
}

// --- Countdown ---
function startCountdown() {
  countdownCycle = 0;
  countdown.style.display = 'block';
  countdown.classList.add('show');
  let timeLeft = countdownStartSeconds;

  countdownInterval = setInterval(() => {
    const seconds = Math.floor(timeLeft);
    const milliseconds = Math.floor((timeLeft - seconds) * 1000);
    countdown.textContent = `${seconds}.${milliseconds.toString().padStart(3,'0')}`;
    timeLeft -= 0.01;

    if (timeLeft <= 0) {
      countdownCycle++;
      if (countdownCycle >= countdownCyclesMax) {
        stopCountdown();
      } else {
        timeLeft = countdownStartSeconds;
      }
    }
  }, 10);
}

function stopCountdown() {
  clearInterval(countdownInterval);
  countdownInterval = null;
  countdown.classList.remove('show');
  countdown.style.display = 'none';
  countdown.textContent = '';
}

// --- YES state helpers ---
function enterYesState() {
  paused = true;
  yesActive = true;

  sbsBtn.classList.add('paused');
  pitchBtn.classList.add('yes-active');
  pitchBtn.textContent = 'YES';

  dismissBtn.style.display = 'block';
  buttonsContainer.classList.add('sbs-active');

  progressBar.classList.add('paused');
  cancelAnimationFrame(animationFrameId);
  const computedWidth = parseFloat(progressBar.style.width) || 100;
  pausedAt = pitchDuration * (1 - computedWidth / 100);

  playOnce('SCOREY.mp3');
}

function exitYesStateResume() {
  paused = false;
  yesActive = false;

  sbsBtn.classList.remove('paused');
  pitchBtn.classList.remove('yes-active');
  pitchBtn.textContent = 'PITCH';

  dismissBtn.style.display = 'none';
  buttonsContainer.classList.remove('sbs-active');

  progressBar.classList.remove('paused');

  startTime = null;
  animationFrameId = requestAnimationFrame(updateProgress);
}

// --- Events panel slide ---
eventsBtn.addEventListener('click', () => {
  eventsPanel.classList.toggle('active');
});

// --- Events ---
function renderEvents() {
  eventsList.innerHTML = '';
  events.forEach((ev, idx) => {
    const li = document.createElement('li');
    li.textContent = `${ev.name} | ${ev.icon}`;
    if (ev.completed) li.classList.add('completed');
    li.addEventListener('click', () => {
      if (!ev.completed) {
        ev.completed = true;
        let points = 0;
        if (ev.type === 1) points = 1;
        else if (ev.type === 2) points = 3;
        else if (ev.type === 3) points = 5;
        loop += points;
        updateCounters();
        renderEvents();
      }
    });
    eventsList.appendChild(li);
  });
}

// --- Pitch/SBS/Dismiss ---
pitchBtn.addEventListener('click', () => {
  if (yesActive) {
    dismissBtn.style.display = 'none';
    buttonsContainer.classList.remove('sbs-active');

    sbsBtn.disabled = true;
    pitchBtn.disabled = true;

    progressBar.classList.remove('paused');
    progressBar.style.width = '100%';

    playOnce(scoreSfxForCombo(comboCount));

    yesTimeoutId = setTimeout(() => {
      sbsBtn.disabled = false;
      pitchBtn.disabled = false;
      paused = false;
      yesActive = false;
      pitchBtn.classList.remove('yes-active');
      pitchBtn.textContent = 'PITCH';
      startTime = null;
      animationFrameId = requestAnimationFrame(updateProgress);
    }, yesCooldown);
  } else {
    handlePitchScoring();
    resetProgress();
  }
});

sbsBtn.addEventListener('click', () => {
  if (!yesActive) {
    enterYesState();
  } else {
    addScore(-3);
    exitYesStateResume();
  }
});

dismissBtn.addEventListener('click', () => {
  exitYesStateResume();
});

// --- POWER ---
powerBtn.addEventListener("click", () => {
  if (rouletteRunning) return;
  powerOverlay.classList.add("active");
  powerPanel.classList.add("active");
});

powerOverlay.addEventListener("click", () => {
  powerOverlay.classList.remove("active");
  powerPanel.classList.remove("active");
});

function resetPowerItems() {
  powerItems.forEach((item, idx) => {
    item.classList.remove('roulette-highlight');
    if (obtainedItems.includes(idx)) {
      item.classList.add('unlocked');
    } else {
      item.classList.remove('unlocked');
    }
  });
}

commitBtn.addEventListener("click", () => {
  if (loop < POWER_COST || rouletteRunning) return;

  loop -= POWER_COST;
  updateCounters();

  rouletteRunning = true;
  commitBtn.disabled = true;
  commitBtn.textContent = "COMMITTING...";

  let availableIndices = Array.from(powerItems.keys()).filter(idx => !obtainedItems.includes(idx));
  if (availableIndices.length === 0) {
    commitBtn.textContent = "All items obtained!";
    rouletteRunning = false;
    commitBtn.disabled = false;
    return;
  }

  if (rouletteAudio) {
    rouletteAudio.currentTime = 0;
    rouletteAudio.play();
  }

  let finalIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
  let animationCount = 30 + Math.floor(Math.random() * 20);
  let currentStep = 0;

  const roulette = setInterval(() => {
    resetPowerItems();
    let highlightIndex = currentStep % powerItems.length;
    powerItems[highlightIndex].classList.add('roulette-highlight');

    currentStep++;
    if (currentStep > animationCount) {
      clearInterval(roulette);
      resetPowerItems();
      powerItems[finalIndex].classList.add('roulette-highlight');

      obtainedItems.push(finalIndex);
      rouletteRunning = false;
      commitBtn.disabled = false;
      commitBtn.textContent = "COMMIT 1";
      if (rouletteAudio) rouletteAudio.pause();
    }
  }, 100);
});

// --- Events Loader ---
function loadEventsFromList() {
  if (typeof initialEvents !== 'undefined' && Array.isArray(initialEvents)) {
    events = initialEvents.map(ev => ({ ...ev, completed: false }));
  }
}

// --- RESET ---
resetBtn.addEventListener('click', () => {
  if (confirm("Are you sure you want to reset all progress?")) {
    score = 0;
    loop = 0;
    obtainedItems = [];
    resetPowerItems();
    loadEventsFromList();
    renderEvents();
    updateCounters();
    resetProgress();
  }
});

// --- INIT ---
updateCounters();
window.onload = () => {
  loadEventsFromList();  // Load events from LIST.js
  resetProgress();
  renderEvents();
};