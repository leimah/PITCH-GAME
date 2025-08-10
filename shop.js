// shop.js - shop logic and UI for purchasing modifiers

document.addEventListener('DOMContentLoaded', () => {
  const shopButton = document.getElementById('shopButton');
  const shopSideMenu = document.getElementById('shopSideMenu');
  const coinsCountEl = document.getElementById('coinsCount');

  // Items in the shop
  const shopItems = [
    {
      id: 'scoreMultiplier',
      name: 'Score multiplier',
      description: 'Double your score by 2x (cooldown 10min)',
      price: 100,
      durationMs: 10 * 60 * 1000, // 10 minutes
      buyAction() {
        window.pitchTracker.activateScoreMultiplier(this.durationMs);
      }
    },
    {
      id: 'noPenalties',
      name: 'No penalties',
      description: 'Avoid all skip penalties for 5 minutes (skips gets -3)',
      price: 200,
      durationMs: 5 * 60 * 1000, // 5 minutes
      buyAction() {
        window.pitchTracker.activateNoPenalties(this.durationMs);
      }
    },
    {
      id: 'extraSlot',
      name: 'Extra slot',
      description: 'Gets you another UNCTRL slot (one time use)',
      price: 75,
      buyAction() {
        window.pitchTracker.activateExtraSlot();
      }
    }
  ];

  // Track buttons so we can disable/enable them properly
  const buttonsById = {};

  // Create shop items UI inside shopSideMenu
  function createShopItemsUI() {
    shopSideMenu.innerHTML = '';
    const title = document.createElement('h2');
    title.textContent = 'Store';
    shopSideMenu.appendChild(title);

    shopItems.forEach(item => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'shop-item';

      const nameEl = document.createElement('h3');
      nameEl.textContent = item.name;

      const descEl = document.createElement('p');
      descEl.textContent = item.description;

      const priceEl = document.createElement('p');
      priceEl.textContent = `Price: ${item.price} coins`;

      const buyBtn = document.createElement('button');
      buyBtn.textContent = 'Buy';
      buyBtn.className = 'buy-btn';
      buyBtn.disabled = false;

      buyBtn.addEventListener('click', () => {
        const currentCoins = window.pitchTracker.getState().coins;
        if (currentCoins >= item.price) {
          // Deduct coins
          window.pitchTracker.awardCoins(-item.price);

          // Run buy action
          if (typeof item.buyAction === 'function') {
            item.buyAction();
          }

          // Update UI and counters
          window.pitchTracker.updateCounters();
          updateCoinsDisplay();

          // Disable the button if item has a duration (timed power-up)
          if (item.durationMs) {
            buyBtn.disabled = true;
            setTimeout(() => {
              buyBtn.disabled = false;
            }, item.durationMs);
          } else {
            // For permanent effect, disable after purchase
            buyBtn.disabled = true;
          }
        } else {
          alert('Not enough coins!');
        }
      });

      itemDiv.appendChild(nameEl);
      itemDiv.appendChild(descEl);
      itemDiv.appendChild(priceEl);
      itemDiv.appendChild(buyBtn);

      shopSideMenu.appendChild(itemDiv);

      buttonsById[item.id] = buyBtn;
    });
  }

  function updateCoinsDisplay() {
    coinsCountEl.textContent = `Coins: ${window.pitchTracker.getState().coins}`;
  }

  // Show/hide shop menu
  let shopOpen = false;

  function openShop() {
    shopSideMenu.classList.add('open');
    shopOpen = true;
    updateCoinsDisplay();
  }

  function closeShop() {
    shopSideMenu.classList.remove('open');
    shopOpen = false;
  }

  // Toggle shop menu on button click
  shopButton.addEventListener('click', () => {
    if (shopOpen) {
      closeShop();
    } else {
      openShop();
    }
  });

  // Close shop if clicking outside it
  document.addEventListener('click', (e) => {
    if (!shopOpen) return;
    if (!shopSideMenu.contains(e.target) && e.target !== shopButton) {
      closeShop();
    }
  });

  // Initialize shop UI
  createShopItemsUI();
});
