// settings.js
const input = document.getElementById('intervalInput');
const status = document.getElementById('status');
const saveBtn = document.getElementById('saveBtn');
const timingOptions = document.querySelectorAll('.timing-option');

// Load saved interval on page load
chrome.storage.sync.get(['gameInterval'], (data) => {
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

function saveInterval() {
  const interval = parseFloat(input.value);
  
  if (!interval || interval < 0.1) {
    showStatus('Please enter a valid interval (minimum 0.1 minutes)', 'error');
    return;
  }

  // Save to storage with the correct key
  chrome.storage.sync.set({ gameInterval: interval }, () => {
    // Send message to background script to update timer
    chrome.runtime.sendMessage({
      action: 'setInterval',
      value: interval
    });
    
    showStatus('Settings saved successfully! ✓', 'success');
  });
}

function showStatus(message, type) {
  status.textContent = message;
  status.className = `status-message ${type}`;
  status.style.display = 'block';
  
  setTimeout(() => {
    status.style.display = 'none';
  }, 3000);
}