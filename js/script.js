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


document.addEventListener("DOMContentLoaded", async () => {
  await updateButtons();

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
    // Fall 2: Timer läuft - berechne die verbleibende Zeit
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
    // ❌ ENTFERNT: setTimeout(updateButtons, 25);
    // Der Storage Listener macht das jetzt automatisch!
  });
  
  document.getElementById("stop").addEventListener('click', async () => {
    sendSW("Stop Timer");
    // ❌ ENTFERNT: setTimeout(updateButtons, 25);
  });
  
  document.getElementById("reset").addEventListener('click', async () => {
    sendSW("Reset Timer");
    // ❌ ENTFERNT: setTimeout(updateButtons, 25);
    // Nach Reset müssen wir die Buttons manuell aktualisieren
    setTimeout(updateButtons, 50);
  });
});