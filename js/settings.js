async function applyBlocking (){
  let { blockedWebsites = [] } = await chrome.storage.local.get("blockedWebsites");
  let existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  let allIds = existingRules.map(r => r.id);

  if (allIds > 0) {
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
          condition: { urlFilter: url, resourceTypes: ["main_frame","sub_frame"] }
        }]
      });
      id++;
    }
}



document.addEventListener("DOMContentLoaded", async () => {
  let { timerDuration } = await chrome.storage.local.get(['timerDuration']);
  let input = document.getElementById("minutes");
  let min = parseInt(input.value , 10);

  let { blockedWebsites = [] } = await chrome.storage.local.get("blockedWebsites");

  for (const site of blockedWebsites){
    document.getElementById(site).checked = true;
  }


  

  document.getElementById('websitesToBlock').addEventListener('change', async e => {
    if (e.target.matches('input[type="checkbox"]')) {
      if (e.target.checked) {
        let result = await chrome.storage.local.get(['blockedWebsites']);
        const arr = result.blockedWebsites || [];
        arr.push(e.target.value);
        await chrome.storage.local.set({ blockedWebsites: arr });
      }else if (!e.target.checked) {
        let result = await chrome.storage.local.get(['blockedWebsites']);
        let arr = result.blockedWebsites || [];
        arr = arr.filter(item => item !== e.target.value);
        await chrome.storage.local.set({ blockedWebsites: arr });
      }
      
      let { websiteBlocked } = await chrome.storage.local.get(['websiteBlocked']);
      if (websiteBlocked) {
        await applyBlocking();
      }

    }
  });

  

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