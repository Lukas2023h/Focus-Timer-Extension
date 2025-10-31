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

  

  function sendSW(msg){
    const messageData = { message: msg };
  
    if (msg === "Start Timer") {
      messageData.duration = totalTime;
    }
  
   chrome.runtime.sendMessage(messageData);
  }

  async function updateDisplay(){
    let { endTime, isPaused } = await chrome.storage.local.get(['endTime', 'isPaused']);

    if (isPaused === true) {
      let {remainingTime} = await chrome.storage.local.get(["remainingTime"]);
      if (remainingTime) {
        let remainingSec = Math.floor(remainingTime / 1000);
        let Min = Math.floor(remainingSec / 60);
        let Sec = remainingSec % 60;
        document.getElementById("timer").textContent = `${Min}:${Sec.toString().padStart(2, '0')}`;
      }
    }else{
      return;
    }

    if (!endTime) return;

    let remainingMs = endTime - Date.now();
    if (remainingMs <= 0) {
      document.getElementById("timer").textContent = `00:00`;
      return;
    }

    let remainingSec = Math.floor(remainingMs / 1000);
    let Min = Math.floor(remainingSec / 60);
    let Sec = remainingSec % 60;

    document.getElementById("timer").textContent = `${Min}:${Sec.toString().padStart(2, '0')}`;

  }

  setInterval(updateDisplay, 100);
  document.getElementById("start").addEventListener('click', async () => {
    sendSW("Start Timer", totalTime);
    setTimeout(updateButtons, 25);
  });
  document.getElementById("stop").addEventListener('click', async () => {
    sendSW("Stop Timer");
    setTimeout(updateButtons, 25);
  });
  document.getElementById("reset").addEventListener('click', async () => {
    sendSW("Reset Timer");
    setTimeout(updateButtons, 25);
  });
});

