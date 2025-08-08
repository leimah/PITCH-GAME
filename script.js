// main script - handles counters, logs, extras, popup editing and sounds
document.addEventListener('DOMContentLoaded', () => {

  // elements
  const btnNo = document.getElementById('btnNo');
  const btnYes = document.getElementById('btnYes');
  const noCounterEl = document.getElementById('noCounter');
  const yesCounterEl = document.getElementById('yesCounter');
  const noLogEl = document.getElementById('noLog');
  const yesLogEl = document.getElementById('yesLog');
  const totalScoreEl = document.getElementById('totalScore');

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

  // audio element sources (we create new Audio() from src for overlapping playback)
  const audioScoreSrc = document.getElementById('audioScore')?.src || 'SCORE.mp3';
  const audioScoreYSrc = document.getElementById('audioScoreY')?.src || 'SCOREY.mp3';
  const audioKnnoSrc = document.getElementById('audioKnno')?.src || 'knno-sound.mp3';
  const audioBoskSrc = document.getElementById('audioBosk')?.src || 'BOSK.mp3';
  const audioExtraSrc = 'EXTRAW.mp3';  // added for done button sound

  // state
  let noCount = 0;
  let yesCount = 0;
  let knnoCount = 0;
  let extrasScore = 0;

  let noLog = [];   // store time strings
  let yesLog = [];
  let fullLog = []; // {time, emoji}

  const SIDE_LOG_MAX = 50;

  // extras pools read from window.extra1/extra2/extra3 (infinite random picks)
  const pools = {
    1: Array.isArray(window.extra1) ? window.extra1.slice() : [],
    2: Array.isArray(window.extra2) ? window.extra2.slice() : [],
    3: Array.isArray(window.extra3) ? window.extra3.slice() : []
  };

  // map slot -> pool key
  const extrasSlots = [1,1,2,2,3];
  let displayedExtras = new Array(5).fill(null);
  let extrasSlotEls = new Array(5).fill(null);

  // helpers
  const nowTime = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  function playFresh(src) {
    try {
      const a = new Audio(src);
      a.play().catch(()=>{});
    } catch(e){}
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

    // NO animated rgba if > 100
    if (noCount > 100) noCounterEl.classList.add('no-animated');
    else noCounterEl.classList.remove('no-animated');

    // bottom KNNO rgba animate always
    document.getElementById('bottomBand').classList.add('knno-animate');

    const total = (noCount * 1) + (yesCount * 10) + extrasScore;
    totalScoreEl.textContent = `Score: ${total}`;
  }

  // add NO
  function addNo() {
    noCount++;
    const t = nowTime();
    noLog.push(`${t} ❌`);
    if (noLog.length > SIDE_LOG_MAX) noLog.shift();
    fullLog.push({time: t, emoji: '❌'});

    if (noCount % 10 === 0) {
      // KNNO event for NO: reset that side log (not counter), increment knno and play knno sound
      noLog = [];
      knnoCount++;
      playFresh(audioKnnoSrc);
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
    fullLog.push({time: t, emoji: '✅'});

    if (yesCount % 10 === 0) {
      yesLog = [];
      knnoCount++;
      playFresh(audioKnnoSrc);
    } else {
      playFresh(audioScoreYSrc);
    }

    updateSideDisplays();
    updateCounters();
  }

  // wire buttons
  btnNo.addEventListener('click', addNo);
  btnYes.addEventListener('click', addYes);

  // toggle full log when bottom bar clicked
  let logOpen = false;
  document.getElementById('bottomBand').addEventListener('click', () => {
    logOpen = !logOpen;
    if (logOpen) {
      logMenu.classList.add('open');
      logMenu.setAttribute('aria-hidden','false');
      setTimeout(()=> fullLogEl.scrollTop = fullLogEl.scrollHeight, 50);
    } else {
      logMenu.classList.remove('open');
      logMenu.setAttribute('aria-hidden','true');
    }
  });

  // --- EXTRAS UI (5 visible slots) ---
  function getRandomFromPool(poolKey) {
    const arr = pools[poolKey];
    if (!Array.isArray(arr) || arr.length === 0) return null;
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function createExtrasUI() {
    extrasContainer.innerHTML = '';
    for (let i=0; i<5; i++) {
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
        // award points by pool
        const poolKey = extrasSlots[i];
        if (poolKey === 1) extrasScore += 1;
        else if (poolKey === 2) extrasScore += 3;
        else if (poolKey === 3) extrasScore += 5;
        playFresh(audioExtraSrc); // EXTRAW.mp3 sound on done
        refillExtraSlot(i);
        updateCounters();
      });

      const skipBtn = document.createElement('button');
      skipBtn.className = 'skip-btn';
      skipBtn.textContent = 'skip';
      skipBtn.addEventListener('click', () => {
        extrasScore -= 3;
        if (extrasScore < 0) extrasScore = 0;
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
    // update DOM text for only this slot
    const wrapper = extrasSlotEls[i];
    if (wrapper) wrapper.querySelector('.extra-text').textContent = displayedExtras[i];
  }

  function initExtras() {
    // refresh pools from window extras (in case files changed)
    pools[1] = Array.isArray(window.extra1) ? window.extra1.slice() : [];
    pools[2] = Array.isArray(window.extra2) ? window.extra2.slice() : [];
    pools[3] = Array.isArray(window.extra3) ? window.extra3.slice() : [];

    // initial picks
    createExtrasUI();
    for (let i=0;i<5;i++) refillExtraSlot(i);
    updateCounters();
  }

  // --- Edit popup (emoji click) ---
  let editing = null; // 'no' or 'yes'
  const yesEmoji = document.getElementById('yesEmoji');
  const noEmoji = document.getElementById('noEmoji');

  function openEdit(type) {
    editing = type;
    editModal.setAttribute('aria-hidden','false');
    editInput.value = (type === 'no') ? noCount : yesCount;
    editTitle.textContent = `Edit ${type.toUpperCase()} score`;
    editInput.focus();
    editInput.select();
  }
  function closeEdit() {
    editModal.setAttribute('aria-hidden','true');
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

  // click handlers on emojis (keyboard accessible)
  yesEmoji.addEventListener('click', () => openEdit('yes'));
  noEmoji.addEventListener('click', () => openEdit('no'));
  yesEmoji.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openEdit('yes'); }});
  noEmoji.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openEdit('no'); }});

  // close modal on Escape or outside click
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeEdit();
  });
  editModal.addEventListener('click', (evt) => {
    if (evt.target === editModal) closeEdit();
  });

  // init everything
  initExtras();
  updateSideDisplays();
  updateCounters();

  // expose debug
  window.pitchTracker = { initExtras, refillExtraSlot, getState: () => ({noCount,yesCount,knnoCount,extrasScore,displayedExtras}) };
});
