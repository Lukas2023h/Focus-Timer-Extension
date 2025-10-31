document.addEventListener("DOMContentLoaded", async () => {
  let { timerDuration } = await chrome.storage.local.get(['timerDuration']);
  let input = document.getElementById("minutes");
  let min = parseInt(input.value , 10);


  if (timerDuration) {
    input.value = timerDuration;
  }else{  
    input.value = 20;
    chrome.storage.local.set({ timerDuration: 20 });
  }

  input.addEventListener("input", () => {
    let min = parseInt(input.value , 10);
    chrome.storage.local.set({ timerDuration: min });
  })

})