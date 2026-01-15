// settings.js
const input = document.getElementById('intervalInput');
const status = document.getElementById('status');
const saveBtn = document.getElementById('saveBtn');
const presetButtons = document.querySelectorAll('.preset-btn');

// Load saved interval on page load
chrome.storage.sync.get(['gameInterval'], (data) => {
  if (data.gameInterval) {
    input.value = data.gameInterval;
  } else {
    input.value = 1;
  }
});

// Set preset values
presetButtons.forEach(button => {
  button.addEventListener('click', () => {
    const minutes = parseInt(button.dataset.preset);
    input.value = minutes;
    input.focus();
    showStatus(`Preset selected: ${minutes} minutes`, 'info');
  });
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
  const value = parseFloat(input.value);
  
  if (isNaN(value) || value <= 0) {
    showStatus('⚠️ Please enter a valid number greater than 0', 'error');
    return;
  }

  if (value < 0.1) {
    showStatus('⚠️ Minimum interval is 0.1 minutes', 'error');
    return;
  }

  // Save to storage
  chrome.storage.sync.set({ gameInterval: value }, () => {
    // Send message to background to update alarm (no callback needed)
    chrome.runtime.sendMessage({ action: 'setInterval', value });
    
    showStatus(`✅ Saved! Game popup will appear every ${value} minute${value !== 1 ? 's' : ''}`, 'success');
    
    // Auto-hide success message after 3 seconds
    setTimeout(() => {
      status.classList.add('hidden');
    }, 3000);
  });
}

function showStatus(message, type) {
  status.textContent = message;
  status.classList.remove('hidden', 'bg-green-100', 'text-green-700', 'bg-red-100', 'text-red-700', 'bg-blue-100', 'text-blue-700');
  
  if (type === 'success') {
    status.classList.add('bg-green-100', 'text-green-700');
  } else if (type === 'error') {
    status.classList.add('bg-red-100', 'text-red-700');
  } else {
    status.classList.add('bg-blue-100', 'text-blue-700');
  }
}