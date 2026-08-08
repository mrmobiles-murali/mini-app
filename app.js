// Telegram Mini App Configuration
let tg = window.Telegram.WebApp;
let appSettings = {
    enableNotifications: true,
    enableHaptic: true,
    enableSound: true
};

let appState = {
    counter: 0,
    userName: '',
    userId: '',
    lastAction: new Date().toLocaleTimeString()
};

// ============================================
// INITIALIZATION
// ============================================

function initTelegramApp() {
    console.log('Initializing Telegram Web App...');
    
    // Expand to full viewport
    tg.expand();
    
    // Set background color
    if (tg.setBackgroundColor) {
        const isDark = tg.colorScheme === 'dark';
        tg.setBackgroundColor(isDark ? '#1a1a1a' : '#ffffff');
    }
    
    // Apply theme
    applyTheme();
    
    // Initialize user info
    displayUserInfo();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load settings from localStorage
    loadSettings();
    
    // Hide loading overlay
    setTimeout(() => {
        document.getElementById('loading-overlay').classList.add('hidden');
    }, 500);
    
    console.log('App initialized successfully!');
}

// ============================================
// USER INFORMATION
// ============================================

function displayUserInfo() {
    const user = tg.initDataUnsafe?.user;
    
    if (user) {
        const firstName = user.first_name || '';
        const lastName = user.last_name || '';
        const fullName = `${firstName} ${lastName}`.trim();
        
        document.getElementById('user-greeting').textContent = `Hello, ${fullName}! 👋`;
        document.getElementById('user-id').textContent = user.id || '-';
        document.getElementById('username').textContent = user.username ? `@${user.username}` : 'Not set';
        document.getElementById('language').textContent = user.language_code?.toUpperCase() || 'EN';
        document.getElementById('is-bot').textContent = user.is_bot ? 'Yes ✓' : 'No';
        
        appState.userName = fullName;
        appState.userId = user.id;
    } else {
        document.getElementById('user-greeting').textContent = 'Welcome to Mini App! 👋';
        console.warn('User data not available');
    }
}

// ============================================
// THEME MANAGEMENT
// ============================================

function applyTheme() {
    const isDarkTheme = tg.colorScheme === 'dark';
    if (isDarkTheme) {
        document.body.classList.add('dark-theme');
        document.getElementById('theme-display').textContent = 'Dark';
    } else {
        document.body.classList.remove('dark-theme');
        document.getElementById('theme-display').textContent = 'Light';
    }
}

// Listen for theme changes
if (tg.onEvent) {
    tg.onEvent('themeChanged', () => {
        applyTheme();
    });
}

// Manual theme toggle
function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    document.getElementById('theme-display').textContent = isDark ? 'Dark' : 'Light';
    triggerHaptic('light');
}

// ============================================
// COUNTER FUNCTIONALITY
// ============================================

function updateCounterDisplay() {
    document.getElementById('counter').textContent = appState.counter;
    updateLastAction('Counter updated');
}

function incrementCounter() {
    appState.counter++;
    updateCounterDisplay();
    triggerHaptic('light');
}

function decrementCounter() {
    appState.counter--;
    updateCounterDisplay();
    triggerHaptic('light');
}

function resetCounter() {
    appState.counter = 0;
    updateCounterDisplay();
    triggerHaptic('medium');
    showNotification('Counter Reset', 'Counter has been reset to 0');
}

// ============================================
// SHARING FUNCTIONALITY
// ============================================

function shareApp() {
    const shareUrl = window.location.href;
    const text = `Check out this awesome Telegram Mini App! 🚀`;
    
    triggerHaptic('light');
    updateLastAction('App shared');
    
    if (tg.shareToChat) {
        tg.shareToChat({
            url: shareUrl,
            text: text
        }).catch(err => {
            console.log('Share failed:', err);
            fallbackShare(shareUrl, text);
        });
    } else if (navigator.share) {
        navigator.share({
            title: 'Telegram Mini App',
            text: text,
            url: shareUrl
        }).catch(err => console.log('Share failed:', err));
    } else {
        fallbackShare(shareUrl, text);
    }
}

function fallbackShare(url, text) {
    showNotification('Share', `URL: ${url}`);
}

// ============================================
// NOTIFICATIONS & FEEDBACK
// ============================================

function showNotification(title, message) {
    if (!appSettings.enableNotifications) return;
    
    if (tg.showPopup) {
        tg.showPopup({
            title: title,
            message: message,
            buttons: [
                { id: 'ok', type: 'ok', text: 'OK' }
            ]
        });
    } else {
        alert(`${title}: ${message}`);
    }
}

function triggerHaptic(type = 'light') {
    if (!appSettings.enableHaptic) return;
    
    if (tg.HapticFeedback) {
        try {
            switch(type) {
                case 'light':
                    tg.HapticFeedback.impactOccurred('light');
                    break;
                case 'medium':
                    tg.HapticFeedback.impactOccurred('medium');
                    break;
                case 'heavy':
                    tg.HapticFeedback.impactOccurred('heavy');
                    break;
                case 'success':
                    tg.HapticFeedback.notificationOccurred('success');
                    break;
                default:
                    tg.HapticFeedback.impactOccurred('light');
            }
        } catch(e) {
            console.log('Haptic feedback not available:', e);
        }
    }
}

// ============================================
// DATA MANAGEMENT
// ============================================

function updateLastAction(action) {
    appState.lastAction = new Date().toLocaleTimeString();
    document.getElementById('last-action').textContent = `${action} • ${appState.lastAction}`;
}

function copyAppData() {
    const data = {
        user: {
            name: appState.userName,
            id: appState.userId
        },
        counter: appState.counter,
        timestamp: new Date().toISOString(),
        platform: navigator.userAgent
    };
    
    const jsonString = JSON.stringify(data, null, 2);
    
    if (navigator.clipboard) {
        navigator.clipboard.writeText(jsonString).then(() => {
            triggerHaptic('success');
            showNotification('Success', 'App data copied to clipboard!');
        }).catch(err => {
            console.error('Copy failed:', err);
            fallbackCopy(jsonString);
        });
    } else {
        fallbackCopy(jsonString);
    }
}

function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand('copy');
        showNotification('Success', 'App data copied!');
    } catch(err) {
        console.error('Copy failed:', err);
    }
    document.body.removeChild(textarea);
}

// ============================================
// FORM HANDLING
// ============================================

function handleFeedbackSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('name-input').value.trim();
    const message = document.getElementById('message-input').value.trim();
    
    if (!name || !message) {
        showNotification('Validation', 'Please fill in all fields');
        triggerHaptic('heavy');
        return;
    }
    
    const feedback = {
        name: name,
        message: message,
        userId: appState.userId,
        timestamp: new Date().toISOString()
    };
    
    console.log('Feedback submitted:', feedback);
    
    // Clear form
    document.getElementById('feedback-form').reset();
    
    triggerHaptic('success');
    showNotification('Thank You!', `Thanks ${name}, your feedback has been received!`);
    updateLastAction('Feedback submitted');
}

// ============================================
// SETTINGS MANAGEMENT
// ============================================

function loadSettings() {
    const saved = localStorage.getItem('appSettings');
    if (saved) {
        appSettings = JSON.parse(saved);
        document.getElementById('notifications-toggle').checked = appSettings.enableNotifications;
        document.getElementById('haptic-toggle').checked = appSettings.enableHaptic;
        document.getElementById('sound-toggle').checked = appSettings.enableSound;
    }
}

function saveSettings() {
    appSettings.enableNotifications = document.getElementById('notifications-toggle').checked;
    appSettings.enableHaptic = document.getElementById('haptic-toggle').checked;
    appSettings.enableSound = document.getElementById('sound-toggle').checked;
    localStorage.setItem('appSettings', JSON.stringify(appSettings));
    updateLastAction('Settings updated');
}

// ============================================
// EVENT LISTENERS SETUP
// ============================================

function setupEventListeners() {
    // Counter buttons
    document.getElementById('increment-btn').addEventListener('click', incrementCounter);
    document.getElementById('decrement-btn').addEventListener('click', decrementCounter);
    document.getElementById('reset-btn').addEventListener('click', resetCounter);
    
    // Action buttons
    document.getElementById('share-btn').addEventListener('click', shareApp);
    document.getElementById('notify-btn').addEventListener('click', () => {
        triggerHaptic('light');
        showNotification('Hello! 👋', 'You have received a notification!');
        updateLastAction('Notification shown');
    });
    document.getElementById('theme-btn').addEventListener('click', toggleTheme);
    
    // Form
    document.getElementById('feedback-form').addEventListener('submit', handleFeedbackSubmit);
    
    // Data
    document.getElementById('copy-data-btn').addEventListener('click', copyAppData);
    
    // Settings
    document.getElementById('notifications-toggle').addEventListener('change', saveSettings);
    document.getElementById('haptic-toggle').addEventListener('change', saveSettings);
    document.getElementById('sound-toggle').addEventListener('change', saveSettings);
    
    // Platform info
    updatePlatformInfo();
    updateFooterTime();
    setInterval(updateFooterTime, 60000);
}

function updatePlatformInfo() {
    const platform = /iPhone|iPad|iPod/i.test(navigator.userAgent) ? 'iOS' :
                    /Android/i.test(navigator.userAgent) ? 'Android' :
                    /Windows/i.test(navigator.userAgent) ? 'Windows' :
                    /Mac/i.test(navigator.userAgent) ? 'macOS' : 'Unknown';
    
    document.getElementById('platform-display').textContent = platform;
}

function updateFooterTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
    });
    document.getElementById('footer-time').textContent = `Updated: ${timeString}`;
}

// ============================================
// TELEGRAM MAIN BUTTON
// ============================================

function setupMainButton() {
    if (tg.MainButton) {
        tg.MainButton.text = '📤 Send Data';
        tg.MainButton.show();
        
        tg.MainButton.onClick(() => {
            const data = {
                counter: appState.counter,
                userName: appState.userName,
                userId: appState.userId,
                timestamp: new Date().toISOString()
            };
            
            console.log('Sending data:', data);
            tg.sendData(JSON.stringify(data));
            triggerHaptic('success');
            showNotification('Data Sent', 'Your data has been sent to the bot!');
        });
    }
}

// ============================================
// APPLICATION START
// ============================================

window.addEventListener('load', () => {
    initTelegramApp();
    setupMainButton();
});

// Handle app ready event
if (tg.onEvent) {
    tg.onEvent('webAppReady', () => {
        console.log('Telegram Web App is ready!');
    });
    
    tg.onEvent('viewportChanged', () => {
        console.log('Viewport changed');
    });
}

// Handle visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('App hidden');
    } else {
        console.log('App visible');
    }
});