chrome.runtime.onMessage.addListener(handleSW);

chrome.alarms.onAlarm.addListener( async (alarm) => {
  if (alarm.name === "timer-alarm") {
    let { endTime } = await chrome.storage.local.get(['endTime']);

    let remaining = endTime - Date.now();

    if (remaining <= 0) { 
      await setStatistics();
      chrome.alarms.clear("timer-alarm");
      chrome.storage.local.remove('endTime');
      chrome.notifications.create("time-done", {
        type: "basic", 
        iconUrl: "/pic/icon.png",
        title: "Time's up",
        message: "Timer is done, good working session!",
        priority: 2
      }); 
    }
  }
})


async function setStatistics() {
  let { session = [] } = await chrome.storage.local.get(["session"]);
  const { timerDuration } = await chrome.storage.local.get(['timerDuration']);

  // Delete Statistics older than 30 Days
  let lastDate = new Date();
  lastDate.setDate(lastDate.getDate() - 30);
  session = session.filter(item => item.sessionDate >= lastDate.toISOString());

  session.push({
    sessionDate: new Date().toISOString(),
    sessionMin: timerDuration,
    completed: true
  });

  await chrome.storage.local.set({session: session});
}

async function handleSW(request, sender, sendResponse){

  if (request.message === "Start Timer") {
    let {isPaused} = await chrome.storage.local.get(["isPaused"]);
    let endTime;
    if (isPaused === true) {
      let {remainingTime} = await chrome.storage.local.get(["remainingTime"]);
      endTime = Date.now() + remainingTime;

    }else {
      const duration = request.duration;
      endTime = Date.now() + (duration * 1000);

    }

    chrome.storage.local.set({ endTime: endTime });
    chrome.storage.local.set({ isPaused: false});

    chrome.alarms.create('timer-alarm', {
      periodInMinutes: 1/60
    });
  }

  if (request.message === "Stop Timer") {
    let {endTime} = await chrome.storage.local.get(["endTime"]);
    let remainingTime = endTime - Date.now();

    chrome.storage.local.set({ 
      isPaused: true,
      remainingTime: remainingTime 
    });
    chrome.alarms.clear("timer-alarm");
  }

  if (request.message === "Reset Timer") {
    chrome.alarms.clear("timer-alarm");
    chrome.storage.local.remove(['endTime', 'isPaused', 'remainingTime']);
  }

}




