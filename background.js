console.log('Background service worker started!');

let elapsedMinutes = 0;
let intervalMinutes = 1; // default 1 minute for testing
let popupWindowId = null; // Track the current popup window

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
      elapsedMinutes = 0;
      chrome.alarms.clear('gamePopup', () => {
        setupAlarm(intervalMinutes);
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
          // Window still exists, focus it instead of creating new one
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
    popupWindowId = null;
  }
});

function createPopupWindow() {
  // Get the current screen dimensions to position the popup
  chrome.system.display.getInfo((displays) => {
    const primaryDisplay = displays[0];
    const screenWidth = primaryDisplay.bounds.width;
    const screenHeight = primaryDisplay.bounds.height;
    
    const popupWidth = 420;
    const popupHeight = 650;
    
    // Position in bottom-right corner with some padding
    const left = screenWidth - popupWidth - 20;
    const top = screenHeight - popupHeight - 80;
    
    chrome.windows.create({
      url: 'popup.html',
      type: 'popup',
      width: popupWidth,
      height: popupHeight,
      left: left,
      top: top,
      focused: true
    }, (window) => {
      popupWindowId = window.id;
    });
  });
}