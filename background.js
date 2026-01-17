let intervalMinutes = 1; 
let popupWindowId = null; 
let alarmPaused = false; 
let timerRunning = false; 

chrome.storage.sync.get(['gameInterval', 'timerRunning'], (res) => {
  intervalMinutes = res.gameInterval || 1;
  timerRunning = res.timerRunning || false;
  
  if (timerRunning && !alarmPaused) {
    setupAlarm(intervalMinutes);
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'startTimer') {
    const interval = parseFloat(msg.value);
    if (!isNaN(interval) && interval > 0) {
      intervalMinutes = interval;
      timerRunning = true;
      chrome.storage.sync.set({ 
        gameInterval: interval,
        timerRunning: true 
      });
      setupAlarm(intervalMinutes);
    }
    return true;
  }
  
  // stop timer
  if (msg.action === 'stopTimer') {
    timerRunning = false;
    chrome.storage.sync.set({ timerRunning: false });
    chrome.alarms.clear('gamePopup', () => {
      console.log('alarm cleared, timer stopped');
    });
    return true;
  }
  
  // update interval
  if (msg.action === 'setInterval') {
    intervalMinutes = parseFloat(msg.value);
    if (!isNaN(intervalMinutes) && intervalMinutes > 0) {
      chrome.storage.sync.set({ gameInterval: intervalMinutes });
      
      if (timerRunning && !alarmPaused) {
        chrome.alarms.clear('gamePopup', () => {
          setupAlarm(intervalMinutes);
        });
      }
    }
    return true;
  }
});

// create repeating alarms
function setupAlarm(minutes) {
  chrome.alarms.create('gamePopup', { delayInMinutes: minutes, periodInMinutes: minutes });
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'gamePopup') {
 
    // check if there is a popup window already open
    if (popupWindowId !== null) {
      chrome.windows.get(popupWindowId, (window) => {
        if (chrome.runtime.lastError || !window) {
          createPopupWindow();
        } else {
          chrome.windows.update(popupWindowId, { focused: true });
        }
      });
    } else {
      createPopupWindow();
    }
  }
});

// track when windows are closed
chrome.windows.onRemoved.addListener((windowId) => {
  if (windowId === popupWindowId) {
    popupWindowId = null;
    
    // resume alarm
    if (timerRunning) {
      resumeAlarm();
    } else {
      alarmPaused = false;
    }
  }
});

function createPopupWindow() {
  pauseTimer();
  
  const popupWidth = 420;
  const popupHeight = 900;
  
  chrome.windows.create({
    url: 'popup.html',
    type: 'popup',
    width: popupWidth,
    height: popupHeight,
    focused: true
  }, (window) => {
    if (window) {
      popupWindowId = window.id;
      
      setTimeout(() => {
        chrome.windows.update(window.id, {
          width: popupWidth,
          height: popupHeight
        });
      }, 100);
    }
  });
}

function pauseTimer() {
  chrome.alarms.clear('gamePopup', () => {
    alarmPaused = true;
  });
}

function resumeAlarm() {
  if (alarmPaused && timerRunning) {
    alarmPaused = false;
    setupAlarm(intervalMinutes);
  }
}