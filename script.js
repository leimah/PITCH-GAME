// script.js - main logic for counters, logs, extras, editing, sounds, coins

document.addEventListener('DOMContentLoaded', () => {

  // elements
  const btnNo = document.getElementById('btnNo');
  const btnYes = document.getElementById('btnYes');
  const noCounterEl = document.getElementById('noCounter');
  const yesCounterEl = document.getElementById('yesCounter');
  const noLogEl = document.getElementById('noLog');
  const yesLogEl = document.getElementById('yesLog');
  const totalScoreEl = document.getElementById('totalScore');
  const coinsCountEl = document.getElementById('coinsCount');

  const bottomBand = document.getElementById('bottomBand');
  const knnoCounterText = document.getElementById('knnoCounter');
  const logMenu = document.getElementById('logMenu');
  const fullLogEl = document.getElementById('fullLog');

  const extrasContainer = document.getElementById('extrasContainer');

  const editModal = document.getElementById('editModal');
  const editInput = document.getElementById('editInput');
  const editTitle = document.getElementById('editTitle');
  const saveEditBtn = document.getElementById('saveEdit');
  const cancelEditBtn = document.getElementById('cancelEdit');

  // ULTRA KNNO overlay elements
  const ultraKnnoOverlay = document.getElementById('ultraKnnoOverlay');
  const ultraKnnoText = document.getElementById('ultraKnnoText');

  // audio sources (we create new Audio() from src for overlapping playback)
  const audioScoreSrc = document.getElementById('audioScore')?.src || 'SCORE.mp3';
  const audioScoreYSrc = document.getElementById('audioScoreY')?.src || 'SCOREY.mp3';
  const audioKnnoSrc = document.getElementById('audioKnno')?.src || 'knno-sound.mp3';
  const audioBoskSrc = document.getElementById('audioBosk')?.src || 'BOSK.mp3';
  const audioExtraSrc = document.getElementById('audioExtraw')?.src || 'EXTRAW.mp3';
  const audioScoreTSrc = document.getElementById('audioScoreT')?.src || 'SCORET.mp3';

  // state
  let noCount = 0;
  let yesCount = 0;
  let knnoCount = 0;
  let extrasScore = 0;
  let coins = 0;

  let noLog = [];
  let yesLog = [];
  let fullLog = [];

  const SIDE_LOG_MAX = 50;

  // extras pools read from window.extra1/extra2/extra3
  const pools = {
    1: Array.isArray(window.extra1) ? window.extra1.slice() : [],
    2: Array.isArray(window.extra2) ? window.extra2.slice() : [],
    3: Array.isArray(window.extra3) ? window.extra3.slice() : []
  };

  // map slot -> pool key
  const extrasSlots = [1, 1, 2, 2, 3]; // initial 5 slots
  let displayedExtras = new Array(5).fill(null);
  let extrasSlotEls = new Array(5).fill(null);

  // purchased modifiers state (updated from shop.js events)
  const modifiers = {
    scoreMultiplierActive: false,
    scoreMultiplierEnd: 0,
    noPenaltiesActive: false,
    noPenaltiesEnd: 0,
    extraSlotActive: false
  };

  // helpers
  const nowTime = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  function playFresh(src, volume=1) {
    try {
      const a = new Audio(src);
      a.volume = volume;
      a.play().catch(() => {});
    } catch (e) {}
  }

  function updateSideDisplays() {
    noLogEl.textContent = noLog.join('\n');
    yesLogEl.textContent = yesLog.join('\n');
    fullLogEl.textContent = fullLog.map(e => `${e.time} ${e.emoji}`).join('\n');
  }

  function updateCounters() {
    noCounterEl.textContent = noCount;
    yesCounterEl.textContent = yesCount;
    knnoCounterText.textContent = `KNNO: ${knnoCount}`;

    if (noCount > 100) noCounterEl.classList.add('no-animated');
    else noCounterEl.classList.remove('no-animated');

    bottomBand.classList.add('knno-animate');

    const baseScore = (noCount * 1) + (yesCount * 10) + extrasScore;
    const total = modifiers.scoreMultiplierActive ? baseScore * 2 : baseScore;

    totalScoreEl.textContent = `Score: ${total}`;
    coinsCountEl.textContent = `Coins: ${coins}`;
  }

  // ULTRA KNNO animation
  function showUltraKnno() {
    ultraKnnoOverlay.setAttribute('aria-hidden', 'false');
    ultraKnnoOverlay.classList.add('visible');
    ultraKnnoText.classList.add('visible');

    setTimeout(() => {
      ultraKnnoOverlay.style.transition = 'opacity 3s ease';
      ultraKnnoText.style.transition = 'color 3s ease';

      ultraKnnoOverlay.classList.remove('visible');
      ultraKnnoText.classList.remove('visible');

      setTimeout(() => {
        ultraKnnoOverlay.setAttribute('aria-hidden', 'true');
        ultraKnnoOverlay.style.transition = 'opacity 5s ease';
        ultraKnnoText.style.transition = 'color 5s ease';
      }, 3000);
    }, 10000);
  }

  // Coins awarding helper
  function awardCoins(amount) {
    coins += amount;
    if (coins < 0) coins = 0;
  }

  // add NO
  function addNo() {
    noCount++;
    const t = nowTime();

    if (!modifiers.noPenaltiesActive) {
      // normal penalty behavior (if any)
    }

    noLog.push(`${t} ❌`);
    if (noLog.length > SIDE_LOG_MAX) noLog.shift();
    fullLog.push({ time: t, emoji: '❌' });

    // Award 1 coin per NO
    awardCoins(1);

    if (noCount % 100 === 0) {
      playFresh(audioScoreTSrc, 0.7);
      const hundredIndex = noCount / 100;
      if (hundredIndex >= 1 && hundredIndex <= 10) {
        playFresh(`HIGHSCORE/score${hundredIndex}.mp3`);
      }
      showUltraKnno();
      noLog = [];
      knnoCount++;
      awardCoins(5); // Ultra KNNO coin bonus
      updateSideDisplays();
      updateCounters();
      return;
    }

    if (noCount % 10 === 0) {
      noLog = [];
      knnoCount++;
      playFresh(audioKnnoSrc);
      awardCoins(1); // KNNO coin bonus
    } else {
      playFresh(audioScoreSrc);
    }

    updateSideDisplays();
    updateCounters();
  }

  // add YES
  function addYes() {
    yesCount++;
    const t = nowTime();
    yesLog.push(`${t} ✅`);
    if (yesLog.length > SIDE_LOG_MAX) yesLog.shift();
    fullLog.push({ time: t, emoji: '✅' });

    // Award 10 coins per YES
    awardCoins(10);

    if (yesCount % 10 === 0) {
      yesLog = [];
      knnoCount++;
      playFresh(audioKnnoSrc);
      awardCoins(1);
    } else {
      playFresh(audioScoreYSrc);
    }

    updateSideDisplays();
    updateCounters();
  }

  // wire buttons
  btnNo.addEventListener('click', addNo);
  btnYes.addEventListener('click', addYes);

  // toggle full log
  let logOpen = false;
  bottomBand.addEventListener('click', () => {
    logOpen = !logOpen;
    if (logOpen) {
      logMenu.classList.add('open');
      logMenu.setAttribute('aria-hidden', 'false');
      setTimeout(() => fullLogEl.scrollTop = fullLogEl.scrollHeight, 50);
    } else {
      logMenu.classList.remove('open');
      logMenu.setAttribute('aria-hidden', 'true');
    }
  });

  // EXTRAS UI
  function getRandomFromPool(poolKey) {
    const arr = pools[poolKey];
    if (!Array.isArray(arr) || arr.length === 0) return null;
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function createExtrasUI() {
    extrasContainer.innerHTML = '';
    // FIXED: Use extrasSlots.length so all slots (including added #6) render
    for (let i = 0; i < extrasSlots.length; i++) {
      const wrapper = document.createElement('div');
      wrapper.className = 'extra-item';

      const span = document.createElement('div');
      span.className = 'extra-text';
      span.textContent = displayedExtras[i] || '...';

      const controls = document.createElement('div');
      controls.style.display = 'flex';
      controls.style.gap = '8px';

      const doneBtn = document.createElement('button');
      doneBtn.className = 'done-btn';
      doneBtn.textContent = 'done';
      doneBtn.addEventListener('click', () => {
        if (!displayedExtras[i]) return;
        const poolKey = extrasSlots[i];
        if (poolKey === 1) extrasScore += 1;
        else if (poolKey === 2) extrasScore += 3;
        else if (poolKey === 3) extrasScore += 5;
        awardCoins(poolKey === 3 ? 3 : 1);
        playFresh(audioExtraSrc);
        refillExtraSlot(i);
        updateCounters();
      });

      const skipBtn = document.createElement('button');
      skipBtn.className = 'skip-btn';
      skipBtn.textContent = 'skip';
      skipBtn.addEventListener('click', () => {
        if (!modifiers.noPenaltiesActive) {
          extrasScore -= 3;
          if (extrasScore < 0) extrasScore = 0;
        }
        playFresh(audioBoskSrc);
        refillExtraSlot(i);
        updateCounters();
      });

      controls.appendChild(doneBtn);
      controls.appendChild(skipBtn);

      wrapper.appendChild(span);
      wrapper.appendChild(controls);

      extrasContainer.appendChild(wrapper);
      extrasSlotEls[i] = wrapper;
    }
  }

  function refillExtraSlot(i) {
    const poolKey = extrasSlots[i];
    const pick = getRandomFromPool(poolKey);
    displayedExtras[i] = pick ? pick : 'No extras loaded.';
    const wrapper = extrasSlotEls[i];
    if (wrapper) wrapper.querySelector('.extra-text').textContent = displayedExtras[i];
  }

  function initExtras() {
    pools[1] = Array.isArray(window.extra1) ? window.extra1.slice() : [];
    pools[2] = Array.isArray(window.extra2) ? window.extra2.slice() : [];
    pools[3] = Array.isArray(window.extra3) ? window.extra3.slice() : [];

    createExtrasUI();
    for (let i = 0; i < extrasSlots.length; i++) refillExtraSlot(i);
    updateCounters();
  }

  // Edit popup logic
  let editing = null;
  const yesEmoji = document.getElementById('yesEmoji');
  const noEmoji = document.getElementById('noEmoji');

  function openEdit(type) {
    editing = type;
    editModal.setAttribute('aria-hidden', 'false');
    editInput.value = (type === 'no') ? noCount : yesCount;
    editTitle.textContent = `Edit ${type.toUpperCase()} score`;
    editInput.focus();
    editInput.select();
  }
  function closeEdit() {
    editModal.setAttribute('aria-hidden', 'true');
    editing = null;
  }
  saveEditBtn.addEventListener('click', () => {
    const v = parseInt(editInput.value);
    if (!Number.isNaN(v) && v >= 0) {
      if (editing === 'no') noCount = v;
      if (editing === 'yes') yesCount = v;
      updateCounters();
    }
    closeEdit();
  });
  cancelEditBtn.addEventListener('click', closeEdit);

  yesEmoji.addEventListener('click', () => openEdit('yes'));
  noEmoji.addEventListener('click', () => openEdit('no'));
  yesEmoji.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openEdit('yes'); }});
  noEmoji.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openEdit('no'); }});

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeEdit();
  });
  editModal.addEventListener('click', (evt) => {
    if (evt.target === editModal) closeEdit();
  });

  // Periodic check to disable modifiers if expired
  function checkModifiers() {
    const now = Date.now();
    if (modifiers.scoreMultiplierActive && now > modifiers.scoreMultiplierEnd) {
      modifiers.scoreMultiplierActive = false;
      updateCounters();
    }
    if (modifiers.noPenaltiesActive && now > modifiers.noPenaltiesEnd) {
      modifiers.noPenaltiesActive = false;
    }
  }

  // Expose functions to be called from shop.js
  window.pitchTracker = {
    initExtras,
    refillExtraSlot,
    updateCounters,
    awardCoins,
    addCoins: awardCoins,
    getState: () => ({
      noCount, yesCount, knnoCount, extrasScore, coins, displayedExtras,
      modifiers
    }),
    activateScoreMultiplier(durationMs) {
      modifiers.scoreMultiplierActive = true;
      modifiers.scoreMultiplierEnd = Date.now() + durationMs;
      updateCounters();
    },
    activateNoPenalties(durationMs) {
      modifiers.noPenaltiesActive = true;
      modifiers.noPenaltiesEnd = Date.now() + durationMs;
    },
    activateExtraSlot() {
      if (!modifiers.extraSlotActive) {
        modifiers.extraSlotActive = true;
        extrasSlots.push(2); // add one more slot from pool 2
        displayedExtras.push(null);
        extrasSlotEls.push(null);
        createExtrasUI();
        refillExtraSlot(extrasSlots.length - 1);
        updateCounters();
      }
    }
  };

  // SHOP button and side menu logic (updated for new HTML structure)
  const shopButton = document.querySelector('.shop-button');
  const shopSideMenu = document.getElementById('shopSideMenu');

  let shopOpen = false;

  function openShop() {
    shopSideMenu.classList.add('open');
    shopOpen = true;
  }

  function closeShop() {
    shopSideMenu.classList.remove('open');
    shopOpen = false;
  }

  shopButton.addEventListener('click', () => {
    if (shopOpen) {
      closeShop();
    } else {
      openShop();
    }
  });

  document.addEventListener('click', (e) => {
    if (!shopOpen) return;
    if (!shopSideMenu.contains(e.target) && e.target !== shopButton) {
      closeShop();
    }
  });

  // Initialization
  initExtras();
  updateSideDisplays();
  updateCounters();

  // Check modifiers every second
  setInterval(() => {
    checkModifiers();
  }, 1000);
});