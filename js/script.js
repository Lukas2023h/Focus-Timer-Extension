// --Payment Processor--
const extpay = ExtPay('focus-timer-ext');

async function checkStatus() {
    const user = await extpay.getUser();
    
    if (user.paid === true) {
        return 1;
    } else {
        return 0;
    }
}

// ==================== PROGRESS RING LOGIC ====================
// SVG Circle: circumference = 2 * PI * radius = 2 * 3.14159 * 85 = 534
const CIRCLE_CIRCUMFERENCE = 534;

function updateProgressRing(percentage) {
  const progressRing = document.getElementById('progress-ring');
  if (!progressRing) return;
  
  // Calculate offset (0% = 534, 100% = 0)
  const offset = CIRCLE_CIRCUMFERENCE - (percentage / 100 * CIRCLE_CIRCUMFERENCE);
  progressRing.style.strokeDashoffset = offset;
}

// Initialize progress ring
function initProgressRing() {
  const progressRing = document.getElementById('progress-ring');
  if (!progressRing) return;
  
  progressRing.style.strokeDasharray = CIRCLE_CIRCUMFERENCE;
  progressRing.style.strokeDashoffset = CIRCLE_CIRCUMFERENCE; // Start at 0%
  
  // Add gradient dynamically
  const svg = progressRing.closest('svg');
  if (!svg.querySelector('defs')) {
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    gradient.setAttribute('id', 'gradient');
    gradient.setAttribute('x1', '0%');
    gradient.setAttribute('y1', '0%');
    gradient.setAttribute('x2', '100%');
    gradient.setAttribute('y2', '100%');
    
    const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop1.setAttribute('offset', '0%');
    stop1.setAttribute('style', 'stop-color:#9333ea;stop-opacity:1'); // purple-600
    
    const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop2.setAttribute('offset', '100%');
    stop2.setAttribute('style', 'stop-color:#2563eb;stop-opacity:1'); // blue-600
    
    gradient.appendChild(stop1);
    gradient.appendChild(stop2);
    defs.appendChild(gradient);
    svg.insertBefore(defs, svg.firstChild);
  }
}   

// ==================== BUTTON STATE MANAGEMENT ====================
async function updateButtons() {
  const start = document.getElementById('start');
  const stop = document.getElementById('stop');
  const { isPaused } = await chrome.storage.local.get(["isPaused"]);

  if (isPaused === true || isPaused === undefined) {
    start.disabled = false;
    stop.disabled = true;
    // Remove timer-active class
    document.querySelector('.timer-container')?.classList.remove('timer-active');
  } else {
    start.disabled = true; 
    stop.disabled = false;
    // Add timer-active class for pulse animation
    document.querySelector('.timer-container')?.classList.add('timer-active');
  }
}

// ==================== WEBSITE BLOCKING ====================
async function applyBlocking() {
  let { blockedWebsites = [] } = await chrome.storage.local.get("blockedWebsites");
  let existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  let allIds = existingRules.map(r => r.id);

  let id = 1; 

  for (const site of blockedWebsites) {
    const url = `*${site}.com*`;
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: allIds,
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

// Enable block if blocker checkbox is checked
async function blockSite() {
  let blocker = document.getElementById("blocker");

  if (blocker.checked == true) {
    await applyBlocking();
    await chrome.storage.local.set({ websiteBlocked: true });
  } else {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: (await chrome.declarativeNetRequest.getDynamicRules()).map(r => r.id)
    });
    await chrome.storage.local.set({ websiteBlocked: false });
  }
}

// ==================== MAIN INITIALIZATION ====================
document.addEventListener("DOMContentLoaded", async () => {
  const payButton = document.getElementById('pay-button');

  if (await checkStatus()) {
    payButton.classList.add('premium');
    payButton.title = 'Premium aktiv';
  } else {
    payButton.classList.remove('premium');
    payButton.title = 'Premium freischalten';
  }

  payButton.addEventListener('click', function() {
    console.log("pay button click");
    extpay.openPaymentPage();
  })

  // Initialize progress ring
  initProgressRing();
  
  await updateButtons();
  
  // Blocker checkbox event
  const blockerCheckbox = document.getElementById("blocker");
  if (blockerCheckbox) {
    blockerCheckbox.addEventListener("change", blockSite);
  }

  // Storage change listener for blockedWebsites
  chrome.storage.onChanged.addListener(async (changes, areaName) => {
    if (areaName === 'local' && changes.blockedWebsites) {
      let { websiteBlocked } = await chrome.storage.local.get(['websiteBlocked']);
      if (websiteBlocked) {
        await applyBlocking();
      }
    }
  });

  // Load blocker checkbox state
  let { websiteBlocked } = await chrome.storage.local.get(['websiteBlocked']);
  if (blockerCheckbox) {
    blockerCheckbox.checked = websiteBlocked || false;
  }

  // Get timer duration
  const { timerDuration } = await chrome.storage.local.get(['timerDuration']);
  let totalTime = timerDuration * 60; 

  // Listen for isPaused changes
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes.isPaused) {
      updateButtons();
    }
  });

  // ==================== TIMER COMMUNICATION ====================
  function sendSW(msg) {
    const messageData = { message: msg };
  
    if (msg === "Start Timer") {
      messageData.duration = totalTime;
    }
  
    chrome.runtime.sendMessage(messageData);
  }

  // ==================== DISPLAY UPDATE ====================
  async function updateDisplay() {
    let { endTime, isPaused, remainingTime } = await chrome.storage.local.get(['endTime', 'isPaused', 'remainingTime']);

    let displayTime = 0; 

    // Fall 1: Timer ist pausiert - zeige die gespeicherte verbleibende Zeit
    if (isPaused === true && remainingTime) {
      displayTime = remainingTime;
    } 
    // Fall 2: Timer läuft = verbleibende Zeit
    else if (isPaused === false && endTime) {
      displayTime = endTime - Date.now();
      
      // Zeit abgelaufen = 00:00
      if (displayTime <= 0) {
        document.getElementById("timer").textContent = `00:00`;
        updateProgressRing(0); // Empty ring
        return;
      }
    }
    // Fall 3: Timer wurde noch nie gestartet - zeige die eingestellte Dauer
    else {
      displayTime = totalTime * 1000;
    }

    // Calculate minutes and seconds
    let remainingSec = Math.floor(displayTime / 1000);
    let Min = Math.floor(remainingSec / 60);
    let Sec = remainingSec % 60;

    document.getElementById("timer").textContent = `${Min}:${Sec.toString().padStart(2, '0')}`;
    
    // Update progress ring
    // Calculate percentage based on total time
    const totalTimeMs = totalTime * 1000;
    const percentage = (displayTime / totalTimeMs) * 100;
    updateProgressRing(percentage);
  }

  // Update Display alle 100ms
  setInterval(updateDisplay, 100);
  
  // Initial display update
  updateDisplay();
  
  // ==================== BUTTON EVENT LISTENERS ====================
  document.getElementById("start").addEventListener('click', async () => {
    sendSW("Start Timer", totalTime);  
  });
  
  document.getElementById("stop").addEventListener('click', async () => {
    sendSW("Stop Timer");
  });
  
  document.getElementById("reset").addEventListener('click', async () => {
    sendSW("Reset Timer");
    setTimeout(updateButtons, 50);
    // Reset progress ring
    updateProgressRing(100);
  });
});
