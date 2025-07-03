class FloatingTimer {
    constructor() {
        this.isRunning = false;
        this.remainingTime = 0;
        this.floatingTimer = null;
        this.floatingTab = null;
        
        this.createFloatingElements();
        this.setupEventListeners();
        this.loadInitialState();
    }

    createFloatingElements() {
        // Create floating timer display
        this.floatingTimer = document.createElement('div');
        this.floatingTimer.className = 'floating-timer';
        this.floatingTimer.textContent = '00:00';
        this.floatingTimer.style.display = 'none';
        this.floatingTimer.title = 'Click to open timer';
        
        // Create floating tab
        this.floatingTab = document.createElement('div');
        this.floatingTab.className = 'floating-tab';
        this.floatingTab.textContent = 'Timer';
        this.floatingTab.title = 'Open Timer';
        
        document.body.appendChild(this.floatingTimer);
        document.body.appendChild(this.floatingTab);
    }

    setupEventListeners() {
        // Open side panel when clicking floating elements
        this.floatingTimer.addEventListener('click', () => {
            this.openSidePanel();
        });

        this.floatingTab.addEventListener('click', () => {
            this.openSidePanel();
        });

        // Listen for messages from sidepanel
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'updateTimer') {
                this.updateFloatingTimer(request.remainingTime, request.isRunning);
            }
        });
    }

    openSidePanel() {
        chrome.runtime.sendMessage({
            action: 'openSidePanel'
        });
    }

    updateFloatingTimer(remainingTime, isRunning) {
        this.remainingTime = remainingTime;
        this.isRunning = isRunning;
        
        if (isRunning && remainingTime > 0) {
            this.floatingTimer.style.display = 'block';
            this.floatingTab.style.display = 'none';
            this.updateDisplay();
        } else if (remainingTime > 0) {
            this.floatingTimer.style.display = 'block';
            this.floatingTab.style.display = 'none';
            this.updateDisplay();
            this.floatingTimer.style.opacity = '0.7';
        } else {
            this.floatingTimer.style.display = 'none';
            this.floatingTab.style.display = 'block';
        }
    }

    updateDisplay() {
        const minutes = Math.floor(this.remainingTime / 60);
        const seconds = this.remainingTime % 60;
        this.floatingTimer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        this.floatingTimer.style.opacity = this.isRunning ? '1' : '0.7';
    }

    loadInitialState() {
        chrome.storage.local.get(['timerState'], (result) => {
            if (result.timerState) {
                const state = result.timerState;
                this.updateFloatingTimer(state.remainingTime || 0, state.isRunning || false);
            }
        });
    }
}

// Initialize floating timer when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new FloatingTimer();
    });
} else {
    new FloatingTimer();
}