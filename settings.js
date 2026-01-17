// settings.js
const input = document.getElementById('intervalInput');
const status = document.getElementById('status');
const saveBtn = document.getElementById('saveBtn');
const timingOptions = document.querySelectorAll('.timing-option');
const startTimerBtn = document.getElementById('startTimerBtn');
const stopTimerBtn = document.getElementById('stopTimerBtn');
const timerStatus = document.getElementById('timerStatus');

let timerRunning = false;

// Load saved interval and timer state on page load
chrome.storage.sync.get(['gameInterval', 'timerRunning'], (data) => {
  if (data.gameInterval) {
    input.value = data.gameInterval;
    
    // Highlight the matching preset option
    timingOptions.forEach(option => {
      if (parseInt(option.dataset.minutes) === parseInt(data.gameInterval)) {
        option.classList.add('selected');
      }
    });
  } else {
    input.value = 1;
  }
  
  // Load timer state
  timerRunning = data.timerRunning || false;
  updateTimerUI();
});

// Handle preset timing option clicks
timingOptions.forEach(option => {
  option.addEventListener('click', function() {
    // Remove selected class from all options
    timingOptions.forEach(opt => opt.classList.remove('selected'));
    
    // Add selected class to clicked option
    this.classList.add('selected');
    
    // Set the input value
    const minutes = this.dataset.minutes;
    input.value = minutes;
  });
});

// Clear selection when custom input is used
input.addEventListener('input', function() {
  timingOptions.forEach(opt => opt.classList.remove('selected'));
});

// Save button handler
saveBtn.addEventListener('click', saveInterval);

// Also save on Enter key
input.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    saveInterval();
  }
});

// Start Timer button
startTimerBtn.addEventListener('click', () => {
  const interval = parseFloat(input.value);
  
  if (!interval || interval < 0.1) {
    showStatus('⚠️ Please set a valid interval first (minimum 0.1 minutes)', 'error');
    return;
  }
  
  // Save interval and start timer
  chrome.storage.sync.set({ 
    gameInterval: interval,
    timerRunning: true 
  }, () => {
    // Send message to background to start timer
    chrome.runtime.sendMessage({
      action: 'startTimer',
      value: interval
    });
    
    timerRunning = true;
    updateTimerUI();
    showStatus('Timer started!', 'success');
  });
});

// Stop Timer button
stopTimerBtn.addEventListener('click', () => {
  chrome.storage.sync.set({ timerRunning: false }, () => {
    // Send message to background to stop timer
    chrome.runtime.sendMessage({
      action: 'stopTimer'
    });
    
    timerRunning = false;
    updateTimerUI();
    showStatus('⏸️ Timer stopped', 'error');
  });
});

function saveInterval() {
  const interval = parseFloat(input.value);
  
  if (!interval || interval < 0.1) {
    showStatus('Please enter a valid interval (minimum 0.1 minutes)', 'error');
    return;
  }

  // Save to storage with the correct key
  chrome.storage.sync.set({ gameInterval: interval }, () => {
    // Only send message to update interval if timer is running
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