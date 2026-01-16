console.log('Background service worker started!');

let intervalMinutes = 1; // default 1 minute for testing
let popupWindowId = null; // Track the current popup window
let alarmPaused = false; // Track if alarm is paused

// Load saved interval
chrome.storage.sync.get(['gameInterval'], (res) => {
  intervalMinutes = res.gameInterval || 1;
  setupAlarm(intervalMinutes);
});

// Listen for interval changes from settings
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'setInterval') {
    intervalMinutes = parseFloat(msg.value);
    if (!isNaN(intervalMinutes) && intervalMinutes > 0) {
      console.log('Interval updated to', intervalMinutes, 'minutes');
      chrome.storage.sync.set({ gameInterval: intervalMinutes });
      
      // Clear and recreate alarm with new interval
      chrome.alarms.clear('gamePopup', () => {
        // Only setup alarm if not paused
        if (!alarmPaused) {
          setupAlarm(intervalMinutes);
        }
      });
    }
  }
});

// Create the repeating alarm
function setupAlarm(minutes) {
  chrome.alarms.create('gamePopup', { delayInMinutes: minutes, periodInMinutes: minutes });
  console.log('Game alarm set for every', minutes, 'minutes');
}

// When alarm fires
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'gamePopup') {
    console.log('Game timer triggered!');
    
    // Check if popup window already exists
    if (popupWindowId !== null) {
      chrome.windows.get(popupWindowId, (window) => {
        if (chrome.runtime.lastError || !window) {
          // Window was closed, create new one
          createPopupWindow();
        } else {
          // Window still exists, pause alarm and focus the window
          console.log('Window already open, pausing alarm');
          pauseAlarm();
          chrome.windows.update(popupWindowId, { focused: true });
        }
      });
    } else {
      createPopupWindow();
    }
  }
});

// Track when windows are closed
chrome.windows.onRemoved.addListener((windowId) => {
  if (windowId === popupWindowId) {
    console.log('Game window closed, resuming alarm');
    popupWindowId = null;
    
    // Resume alarm when window is closed
    resumeAlarm();
  }
});

function createPopupWindow() {
  // Pause the alarm while window is open
  pauseAlarm();
  
  const popupWidth = 420;
  const popupHeight = 650;
  
  // Create window without positioning (let it default)
  // Or calculate position based on screen
  chrome.windows.create({
    url: 'popup.html',
    type: 'popup',
    width: popupWidth,
    height: popupHeight,
    focused: true
  }, (window) => {
    if (window) {
      popupWindowId = window.id;
      console.log('Game window opened with dimensions:', window.width, 'x', window.height);
      
      // Force resize after creation (sometimes needed)
      setTimeout(() => {
        chrome.windows.update(window.id, {
          width: popupWidth,
          height: popupHeight
        });
      }, 100);
    }
  });
}

function pauseAlarm() {
  if (!alarmPaused) {
    chrome.alarms.clear('gamePopup', () => {
      alarmPaused = true;
      console.log('Alarm paused');
    });
  }
}

function resumeAlarm() {
  if (alarmPaused) {
    alarmPaused = false;
    setupAlarm(intervalMinutes);
    console.log('Alarm resumed');
  }
}