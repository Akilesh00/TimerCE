chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'timerComplete') {
        // Show notification when timer completes
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icon48.png',
            title: 'Timer Complete!',
            message: 'Your timer has finished. Time\'s up!',
            requireInteraction: true
        }, function(notificationId) {
            if (chrome.runtime.lastError) {
                console.error('Error creating notification:', chrome.runtime.lastError);
            }
        });
        
        // Clear the timer state
        chrome.storage.local.set({
            timerState: {
                remainingTime: 0,
                isRunning: false
            }
        }, function() {
            if (chrome.runtime.lastError) {
                console.error('Error saving state:', chrome.runtime.lastError);
            }
        });
    }
});

// Handle notification clicks
chrome.notifications.onClicked.addListener(function(notificationId) {
    chrome.notifications.clear(notificationId);
});