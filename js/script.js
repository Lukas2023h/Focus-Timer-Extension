async function updateButtons() {
  const start = document.getElementById('start');
  const stop = document.getElementById('stop');
  const { isPaused } = await chrome.storage.local.get(["isPaused"]);

  if (isPaused || isPaused === undefined) {
    start.disabled = false;
    stop.disabled = true;
  }else {
    start.disabled = true; 
    stop.disabled = false;
  }
}

async function applyBlocking (){
  let { blockedWebsites = [] } = await chrome.storage.local.get("blockedWebsites");
  let existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  let allIds = existingRules.map(r => r.id);

  let id = 1; 

    for (const site of blockedWebsites) {
      const url = `*${site}.com*`;
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: allIds, // gleiche ID vorher raus, sonst Konflikt
        addRules: [{
          id,
          priority: 1,
          action: { type: "block" },
          condition: { urlFilter: url, resourceTypes: ["main_frame","sub_frame"] }
        }]
      });
      id++;
    }
}

// Enable block if blocker checkbox is checked
async function blockSite(){
  let blocker = document.getElementById("blocker");

  if (blocker.checked == true) {
    await applyBlocking();
    await chrome.storage.local.set({ websiteBlocked: true });
  }else{
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: (await chrome.declarativeNetRequest.getDynamicRules()).map(r => r.id)
    });
    await chrome.storage.local.set({ websiteBlocked: false });
  }
}




document.addEventListener("DOMContentLoaded", async () => {
  await updateButtons();
  document.getElementById("blocker").addEventListener("change", blockSite);

  
  chrome.storage.onChanged.addListener( async (changes, areaName) => {
    if (areaName === 'local' && changes.blockedWebsites) {
      let { websiteBlocked } = await chrome.storage.local.get(['websiteBlocked']);
      if (websiteBlocked) {
        await applyBlocking();
      }
    }
  });

  // load blocker checkbox
  let { websiteBlocked } = await chrome.storage.local.get(['websiteBlocked']);
  document.getElementById("blocker").checked = websiteBlocked || false;

  // if (websiteBlocked) {
  //   await applyBlocking();
  // }


  const { timerDuration } = await chrome.storage.local.get(['timerDuration']);
  let totalTime = timerDuration * 60; 

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes.isPaused) {
      updateButtons();
    }
  });

  function sendSW(msg){
    const messageData = { message: msg };
  
    if (msg === "Start Timer") {
      messageData.duration = totalTime;
    }
  
   chrome.runtime.sendMessage(messageData);
  }

  async function updateDisplay(){
    let { endTime, isPaused, remainingTime } = await chrome.storage.local.get(['endTime', 'isPaused', 'remainingTime']);

    let displayTime = 0; 

    // Fall 1: Timer ist pausiert - zeige die gespeicherte verbleibende Zeit
    if (isPaused === true && remainingTime) {
      displayTime = remainingTime;
    } 
    // Fall 2: Timer läuft = verbleibende Zeit
    else if (isPaused === false && endTime) {
      displayTime = endTime - Date.now();
      
      //Zeit abgelaufen = 00:00
      if (displayTime <= 0) {
        document.getElementById("timer").textContent = `00:00`;
        return;
      }
    }
    // Fall 3: Timer wurde noch nie gestartet - zeige die eingestellte Dauer
    else {
      displayTime = totalTime * 1000;
    }

    
    let remainingSec = Math.floor(displayTime / 1000);
    let Min = Math.floor(remainingSec / 60);
    let Sec = remainingSec % 60;

    document.getElementById("timer").textContent = `${Min}:${Sec.toString().padStart(2, '0')}`;
  }

  // Update Display alle 100ms
  setInterval(updateDisplay, 100);
  
  document.getElementById("start").addEventListener('click', async () => {
    sendSW("Start Timer", totalTime);  
  });
  
  document.getElementById("stop").addEventListener('click', async () => {
    sendSW("Stop Timer");
  });
  
  document.getElementById("reset").addEventListener('click', async () => {
    sendSW("Reset Timer");
    setTimeout(updateButtons, 50);
  });
});