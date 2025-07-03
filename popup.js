let timerInterval;
let isRunning = false;
let remainingTime = 0;

const timerDisplay = document.getElementById('timerDisplay');
const minutesInput = document.getElementById('minutesInput');
const secondsInput = document.getElementById('secondsInput');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const resetBtn = document.getElementById('resetBtn');
const status = document.getElementById('status');

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    loadTimerState();
    setupEventListeners();
    updateDisplay();
});

function setupEventListeners() {
    // Preset button functionality
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const minutes = parseInt(this.dataset.minutes);
            const seconds = parseInt(this.dataset.seconds);
            
            minutesInput.value = minutes;
            secondsInput.value = seconds;
            
            if (!isRunning) {
                remainingTime = minutes * 60 + seconds;
                updateDisplay();
                status.textContent = 'Timer set - click Start to begin';
            }
        });
    });

    startBtn.addEventListener('click', function() {
        console.log('Start button clicked');
        if (!isRunning) {
            if (remainingTime === 0) {
                const minutes = parseInt(minutesInput.value) || 0;
                const seconds = parseInt(secondsInput.value) || 0;
                remainingTime = minutes * 60 + seconds;
            }
            
            if (remainingTime > 0) {
                isRunning = true;
                startTimer();
                status.textContent = 'Timer running...';
                saveState();
            } else {
                status.textContent = 'Please set a valid time';
            }
        }
    });

    stopBtn.addEventListener('click', function() {
        console.log('Stop button clicked');
        if (isRunning) {
            isRunning = false;
            clearInterval(timerInterval);
            status.textContent = 'Timer paused';
            saveState();
        }
    });

    resetBtn.addEventListener('click', function() {
        console.log('Reset button clicked');
        isRunning = false;
        remainingTime = 0;
        clearInterval(timerInterval);
        updateDisplay();
        status.textContent = 'Timer reset';
        saveState();
    });
}

function loadTimerState() {
    try {
        chrome.storage.local.get(['timerState'], function(result) {
            if (chrome.runtime.lastError) {
                console.error('Error loading state:', chrome.runtime.lastError);
                return;
            }
            
            if (result.timerState) {
                const state = result.timerState;
                remainingTime = state.remainingTime || 0;
                isRunning = state.isRunning || false;
                
                if (isRunning && remainingTime > 0) {
                    startTimer();
                    status.textContent = 'Timer running...';
                } else {
                    updateDisplay();
                    status.textContent = remainingTime > 0 ? 'Timer paused' : 'Ready to start';
                }
            } else {
                status.textContent = 'Ready to start';
            }
        });
    } catch (error) {
        console.error('Error accessing storage:', error);
        status.textContent = 'Ready to start';
    }
}

function startTimer() {
    clearInterval(timerInterval); // Clear any existing interval
    
    timerInterval = setInterval(function() {
        remainingTime--;
        updateDisplay();
        
        if (remainingTime <= 0) {
            clearInterval(timerInterval);
            isRunning = false;
            remainingTime = 0;
            status.textContent = 'Time\'s up!';
            
            // Send message to background script to show notification
            try {
                chrome.runtime.sendMessage({
                    action: 'timerComplete'
                }, function(response) {
                    if (chrome.runtime.lastError) {
                        console.log('Background script not available:', chrome.runtime.lastError);
                    }
                });
            } catch (error) {
                console.log('Error sending message:', error);
            }
            
            saveState();
        } else {
            saveState();
        }
    }, 1000);
}

function updateDisplay() {
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function saveState() {
    try {
        chrome.storage.local.set({
            timerState: {
                remainingTime: remainingTime,
                isRunning: isRunning
            }
        }, function() {
            if (chrome.runtime.lastError) {
                console.error('Error saving state:', chrome.runtime.lastError);
            }
        });
    } catch (error) {
        console.error('Error saving state:', error);
    }
}

// Listen for messages from background script
try {
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.action === 'updateTimer') {
            remainingTime = request.remainingTime;
            isRunning = request.isRunning;
            
            if (!isRunning && remainingTime === 0) {
                clearInterval(timerInterval);
                status.textContent = 'Time\'s up!';
            }
            
            updateDisplay();
        }
    });
} catch (error) {
    console.error('Error setting up message listener:', error);
}