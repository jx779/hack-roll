const input = document.getElementById('intervalInput');
const status = document.getElementById('status');
const saveBtn = document.getElementById('saveBtn');
const timingOptions = document.querySelectorAll('.timing-option');
const startTimerBtn = document.getElementById('startTimerBtn');
const stopTimerBtn = document.getElementById('stopTimerBtn');
const timerStatus = document.getElementById('timerStatus');

let timerRunning = false;

// load saved interval and timer state when page loads
chrome.storage.sync.get(['gameInterval', 'timerRunning'], (data) => {
  if (data.gameInterval) {
    input.value = data.gameInterval;
    
    timingOptions.forEach(option => {
      if (parseInt(option.dataset.minutes) === parseInt(data.gameInterval)) {
        option.classList.add('selected');
      }
    });
  } else {
    input.value = 1;
  }
  
  // load timer
  timerRunning = data.timerRunning || false;
  updateTimerUI();
});

// preset timing options
timingOptions.forEach(option => {
  option.addEventListener('click', function() {
    timingOptions.forEach(opt => opt.classList.remove('selected'));
    
    this.classList.add('selected');
    
    const minutes = this.dataset.minutes;
    input.value = minutes;
  });
});

// clear selection when custom input used
input.addEventListener('input', function() {
  timingOptions.forEach(opt => opt.classList.remove('selected'));
});

// save button handler
saveBtn.addEventListener('click', saveInterval);

// also works with enter key
input.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    saveInterval();
  }
});

// start timer button
startTimerBtn.addEventListener('click', () => {
  const interval = parseFloat(input.value);
  
  if (!interval || interval < 0.1) {
    showStatus('⚠️ Please set a valid interval (minimum 0.1 minutes)', 'error');
    return;
  }
  
  // save interval and start timer
  chrome.storage.sync.set({ 
    gameInterval: interval,
    timerRunning: true 
  }, () => {
    chrome.runtime.sendMessage({
      action: 'startTimer',
      value: interval
    });
    
    timerRunning = true;
    updateTimerUI();
    showStatus('Timer started!', 'success');
  });
});

// stop timer button
stopTimerBtn.addEventListener('click', () => {
  chrome.storage.sync.set({ timerRunning: false }, () => {
    chrome.runtime.sendMessage({
      action: 'stopTimer'
    });
    
    timerRunning = false;
    updateTimerUI();
    showStatus('Timer stopped', 'error');
  });
});

function saveInterval() {
  const interval = parseFloat(input.value);
  
  if (!interval || interval < 0.1) {
    showStatus('Please enter a valid interval (minimum 0.1 minutes)', 'error');
    return;
  }

  chrome.storage.sync.set({ gameInterval: interval }, () => {
    if (timerRunning) {
      chrome.runtime.sendMessage({
        action: 'setInterval',
        value: interval
      });
    }
    
    showStatus('Settings saved successfully!', 'success');
  });
}

function updateTimerUI() {
  if (timerRunning) {
    timerStatus.textContent = 'Timer is running';
    timerStatus.className = 'timer-status running';
    startTimerBtn.disabled = true;
    stopTimerBtn.disabled = false;
  } else {
    timerStatus.textContent = 'Timer is stopped';
    timerStatus.className = 'timer-status stopped';
    startTimerBtn.disabled = false;
    stopTimerBtn.disabled = true;
  }
}

function showStatus(message, type) {
  status.textContent = message;
  status.className = `status-message ${type}`;
  status.style.display = 'block';
  
  setTimeout(() => {
    status.style.display = 'none';
  }, 3000);
}