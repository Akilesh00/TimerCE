class ModernTimer {
    constructor() {
        this.timerInterval = null;
        this.isRunning = false;
        this.remainingTime = 0;
        this.totalTime = 0;
        this.progressRing = document.getElementById('progressRing');
        this.circumference = 2 * Math.PI * 138; // radius = 138
        
        this.initializeElements();
        this.setupEventListeners();
        this.loadTimerState();
        this.setupProgressRing();
    }

    initializeElements() {
        this.timerDisplay = document.getElementById('timerDisplay');
        this.minutesInput = document.getElementById('minutesInput');
        this.secondsInput = document.getElementById('secondsInput');
        this.startBtn = document.getElementById('startBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.status = document.getElementById('status');
    }

    setupProgressRing() {
        this.progressRing.style.strokeDasharray = this.circumference;
        this.progressRing.style.strokeDashoffset = this.circumference;
    }

    updateProgressRing() {
        if (this.totalTime > 0) {
            const progress = (this.totalTime - this.remainingTime) / this.totalTime;
            const offset = this.circumference - (progress * this.circumference);
            this.progressRing.style.strokeDashoffset = offset;
        }
    }

    setupEventListeners() {
        // Preset buttons
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const minutes = parseInt(btn.dataset.minutes);
                const seconds = parseInt(btn.dataset.seconds);
                
                this.minutesInput.value = minutes;
                this.secondsInput.value = seconds;
                
                if (!this.isRunning) {
                    this.setTimer(minutes, seconds);
                    this.status.textContent = `Timer set for ${minutes}:${seconds.toString().padStart(2, '0')} - Ready to start`;
                }
            });
        });

        // Control buttons
        this.startBtn.addEventListener('click', () => this.startTimer());
        this.stopBtn.addEventListener('click', () => this.pauseTimer());
        this.resetBtn.addEventListener('click', () => this.resetTimer());

        // Input validation
        [this.minutesInput, this.secondsInput].forEach(input => {
            input.addEventListener('change', () => {
                if (!this.isRunning) {
                    const minutes = parseInt(this.minutesInput.value) || 0;
                    const seconds = parseInt(this.secondsInput.value) || 0;
                    this.setTimer(minutes, seconds);
                }
            });
        });
    }

    setTimer(minutes, seconds) {
        this.remainingTime = minutes * 60 + seconds;
        this.totalTime = this.remainingTime;
        this.updateDisplay();
        this.updateProgressRing();
    }

    startTimer() {
        if (!this.isRunning) {
            if (this.remainingTime === 0) {
                const minutes = parseInt(this.minutesInput.value) || 0;
                const seconds = parseInt(this.secondsInput.value) || 0;
                this.setTimer(minutes, seconds);
            }
            
            if (this.remainingTime > 0) {
                this.isRunning = true;
                this.startBtn.textContent = 'Running...';
                this.startBtn.disabled = true;
                this.status.textContent = 'Timer is running';
                this.runTimer();
                this.saveState();
                this.updateContentScript();
            } else {
                this.status.textContent = 'Please set a valid time';
            }
        }
    }

    pauseTimer() {
        if (this.isRunning) {
            this.isRunning = false;
            clearInterval(this.timerInterval);
            this.startBtn.textContent = 'Resume';
            this.startBtn.disabled = false;
            this.status.textContent = 'Timer paused';
            this.saveState();
            this.updateContentScript();
        }
    }

    resetTimer() {
        this.isRunning = false;
        this.remainingTime = 0;
        this.totalTime = 0;
        clearInterval(this.timerInterval);
        this.startBtn.textContent = 'Start';
        this.startBtn.disabled = false;
        this.updateDisplay();
        this.updateProgressRing();
        this.status.textContent = 'Timer reset - Ready to start';
        this.saveState();
        this.updateContentScript();
    }

    runTimer() {
        this.timerInterval = setInterval(() => {
            this.remainingTime--;
            this.updateDisplay();
            this.updateProgressRing();
            
            if (this.remainingTime <= 0) {
                this.completeTimer();
            } else {
                this.saveState();
                this.updateContentScript();
            }
        }, 1000);
    }

    completeTimer() {
        clearInterval(this.timerInterval);
        this.isRunning = false;
        this.remainingTime = 0;
        this.startBtn.textContent = 'Start';
        this.startBtn.disabled = false;
        this.status.textContent = '🎉 Time\'s up! Timer completed';
        this.timerDisplay.classList.add('pulse');
        
        // Send completion message to background script
        chrome.runtime.sendMessage({
            action: 'timerComplete'
        });
        
        this.saveState();
        this.updateContentScript();
        
        // Remove pulse animation after 6 seconds
        setTimeout(() => {
            this.timerDisplay.classList.remove('pulse');
        }, 6000);
    }

    updateDisplay() {
        const minutes = Math.floor(this.remainingTime / 60);
        const seconds = this.remainingTime % 60;
        this.timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    updateContentScript() {
        // Send timer state to content script for floating display
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'updateTimer',
                    remainingTime: this.remainingTime,
                    isRunning: this.isRunning
                }).catch(() => {
                    // Ignore errors if content script not available
                });
            }
        });
    }

    saveState() {
        chrome.storage.local.set({
            timerState: {
                remainingTime: this.remainingTime,
                totalTime: this.totalTime,
                isRunning: this.isRunning
            }
        });
    }

    loadTimerState() {
        chrome.storage.local.get(['timerState'], (result) => {
            if (result.timerState) {
                const state = result.timerState;
                this.remainingTime = state.remainingTime || 0;
                this.totalTime = state.totalTime || 0;
                this.isRunning = state.isRunning || false;
                
                if (this.isRunning && this.remainingTime > 0) {
                    this.startBtn.textContent = 'Running...';
                    this.startBtn.disabled = true;
                    this.status.textContent = 'Timer is running';
                    this.runTimer();
                } else if (this.remainingTime > 0) {
                    this.startBtn.textContent = 'Resume';
                    this.status.textContent = 'Timer paused';
                } else {
                    this.status.textContent = 'Ready to start your timer';
                }
                
                this.updateDisplay();
                this.updateProgressRing();
            }
        });
    }
}

// Initialize timer when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const timer = new ModernTimer();
    
    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'updateFromBackground') {
            timer.loadTimerState();
        }
    });
});