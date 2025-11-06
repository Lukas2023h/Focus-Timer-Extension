// ==================== WEBSITE BLOCKING ====================
async function applyBlocking() {
  let { blockedWebsites = [] } = await chrome.storage.local.get("blockedWebsites");
  let existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  let allIds = existingRules.map(r => r.id);

  if (allIds.length > 0) {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: allIds
    }); 
  }

  let id = 1; 
  for (const site of blockedWebsites) {
    const url = `*${site}.com*`;
    await chrome.declarativeNetRequest.updateDynamicRules({
      addRules: [{
        id,
        priority: 1,
        action: { type: "block" },
        condition: { urlFilter: url, resourceTypes: ["main_frame", "sub_frame"] }
      }]
    });
    id++;
  }
}

// ==================== DURATION SELECTOR ====================
function updateDurationDisplay(minutes) {
  const display = document.getElementById('duration-display');
  if (display) {
    display.textContent = `${minutes} Min`;
  }
  
  // Update hidden input (for compatibility)
  const input = document.getElementById('minutes');
  if (input) {
    input.value = minutes;
  }
  
  // Update active button state
  document.querySelectorAll('.duration-btn').forEach(btn => {
    const value = parseInt(btn.dataset.value);
    if (value === minutes) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

// ==================== MAIN INITIALIZATION ====================
document.addEventListener("DOMContentLoaded", async () => {
  // Get saved timer duration
  let { timerDuration } = await chrome.storage.local.get(['timerDuration']);
  
  // Set default if not exists
  if (!timerDuration) {
    timerDuration = 25;
    await chrome.storage.local.set({ timerDuration: 25 });
  }
  
  // Update display with current duration
  updateDurationDisplay(timerDuration);

  // ==================== DURATION BUTTON CLICKS ====================
  document.querySelectorAll('.duration-btn').forEach(button => {
    button.addEventListener('click', async () => {
      const minutes = parseInt(button.dataset.value);
      await chrome.storage.local.set({ timerDuration: minutes });
      updateDurationDisplay(minutes);
    });
  });

  // ==================== WEBSITE CHECKBOXES ====================
  // Load saved blocked websites
  let { blockedWebsites = [] } = await chrome.storage.local.get("blockedWebsites");

  // Check the saved websites
  for (const site of blockedWebsites) {
    const checkbox = document.getElementById(site);
    if (checkbox) {
      checkbox.checked = true;
    }
  }

  // Listen for checkbox changes
  document.getElementById('websitesToBlock').addEventListener('change', async e => {
    if (e.target.matches('input[type="checkbox"]')) {
      let { blockedWebsites = [] } = await chrome.storage.local.get(['blockedWebsites']);
      
      if (e.target.checked) {
        // Add to blocked list
        if (!blockedWebsites.includes(e.target.value)) {
          blockedWebsites.push(e.target.value);
        }
      } else {
        // Remove from blocked list
        blockedWebsites = blockedWebsites.filter(item => item !== e.target.value);
      }
      
      // Save updated list
      await chrome.storage.local.set({ blockedWebsites });
      
      // Apply blocking if blocker is active
      let { websiteBlocked } = await chrome.storage.local.get(['websiteBlocked']);
      if (websiteBlocked) {
        await applyBlocking();
      }
    }
  });

  // ==================== LEGACY INPUT SUPPORT ====================
  // Keep the old input element working (if you want to use it later)
  const input = document.getElementById("minutes");
  if (input) {
    input.addEventListener("input", async () => {
      let min = parseInt(input.value, 10);
      if (min >= 1 && min <= 60) {
        await chrome.storage.local.set({ timerDuration: min });
        updateDurationDisplay(min);
      }
    });
  }
});
