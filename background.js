console.log('Background service worker started!');

let intervalMinutes = 1; // default 1 minute for testing
let popupWindowId = null; // Track the current popup window
let alarmPaused = false; // Track if alarm is paused
let timerRunning = false; // Track if timer is actively running

// Load saved interval and timer state
chrome.storage.sync.get(['gameInterval', 'timerRunning'], (res) => {
  intervalMinutes = res.gameInterval || 1;
  timerRunning = res.timerRunning || false;
  
  console.log('Loaded settings:', {
    interval: intervalMinutes,
    timerRunning: timerRunning
  });
  
  // Only start alarm if timer was running
  if (timerRunning && !alarmPaused) {
    setupAlarm(intervalMinutes);
  }
});

// Listen for messages from settings and popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // Start Timer - new message type
  if (msg.action === 'startTimer') {
    const interval = parseFloat(msg.value);
    if (!isNaN(interval) && interval > 0) {
      console.log('▶️ Starting timer with interval:', interval, 'minutes');
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
  
  // Stop Timer - new message type
  if (msg.action === 'stopTimer') {
    console.log('⏸️ Stopping timer');
    timerRunning = false;
    chrome.storage.sync.set({ timerRunning: false });
    chrome.alarms.clear('gamePopup', () => {
      console.log('Alarm cleared - timer stopped');
    });
    return true;
  }
  
  // Update interval (existing logic - only update if timer is running)
  if (msg.action === 'setInterval') {
    intervalMinutes = parseFloat(msg.value);
    if (!isNaN(intervalMinutes) && intervalMinutes > 0) {
      console.log('Interval updated to', intervalMinutes, 'minutes');
      chrome.storage.sync.set({ gameInterval: intervalMinutes });
      
      // Only recreate alarm if timer is running and not paused
      if (timerRunning && !alarmPaused) {
        chrome.alarms.clear('gamePopup', () => {
          setupAlarm(intervalMinutes);
        });
      }
    }
    return true;
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
    // Check if timer is still running
    if (!timerRunning) {
      console.log('Timer is stopped, not showing popup');
      return;
    }
    
    console.log('Game timer triggered!');
    
    // Check if popup window already exists
    if (popupWindowId !== null) {
      chrome.windows.get(popupWindowId, (window) => {
        if (chrome.runtime.lastError || !window) {
          // Window was closed, create new one
          createPopupWindow();
        } else {
          // Window still exists, just focus it (alarm already paused)
          console.log('Window already open, focusing it');
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
    
    // Resume alarm when window is closed (only if timer is still running)
    if (timerRunning) {
      resumeAlarm();
    } else {
      // If timer was stopped, just clear the paused flag
      alarmPaused = false;
    }
  }
});

function createPopupWindow() {
  // Pause the timer (alarm) while window is open
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
      console.log('Game window opened - timer paused');
      
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

function pauseTimer() {
  chrome.alarms.clear('gamePopup', () => {
    alarmPaused = true;
    console.log('⏸️ Timer paused (popup open)');
  });
}

function resumeAlarm() {
  if (alarmPaused && timerRunning) {
    alarmPaused = false;
    setupAlarm(intervalMinutes);
    console.log('▶️ Timer resumed (popup closed)');
  }
}