// Background service worker

// Initial timer state (can be modified as needed)
let timerState = {
  remainingTime: 0,
  totalTime: 0,
  isRunning: false
};

// Open side panel on extension icon click
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id }).catch((err) => {
    console.error("Failed to open side panel:", err);
  });
});

// Listen for messages from content or side panel scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'timerComplete') {
    // Notify the user when the timer is done
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon48.png',
      title: '⏰ Timer Complete!',
      message: 'Your timer has finished. Time\'s up!',
      requireInteraction: true
    }, (notificationId) => {
      if (chrome.runtime.lastError) {
        console.error('Notification error:', chrome.runtime.lastError);
      }
    });

    // Reset internal timer state
    timerState = {
      remainingTime: 0,
      totalTime: timerState.totalTime, // preserve totalTime if needed
      isRunning: false
    };

    // Persist the updated state to storage
    chrome.storage.local.set({ timerState }, () => {
      if (chrome.runtime.lastError) {
        console.error('Storage save error:', chrome.runtime.lastError);
      }
    });
  }

  // Optional: support updating timer state externally
  if (request.action === 'updateTimerState') {
    timerState = { ...timerState, ...request.payload };
    chrome.storage.local.set({ timerState }, () => {
      if (chrome.runtime.lastError) {
        console.error('Error updating timer state:', chrome.runtime.lastError);
      }
    });
    sendResponse({ status: 'ok' });
  }
});

// When notification is clicked, just clear it
chrome.notifications.onClicked.addListener((notificationId) => {
  chrome.notifications.clear(notificationId);
});
