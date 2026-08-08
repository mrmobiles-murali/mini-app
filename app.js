// app.js
let tg = window.Telegram.WebApp;
let appSettings = { enableNotifications: true, enableHaptic: true, enableSound: true };
let appState = { counter: 0, userName: '', userId: '', lastAction: new Date().toLocaleTimeString() };

// Simple analytics helper (GA4 placeholder)
function trackEvent(name, props = {}) {
  if (window.gtag) gtag('event', name, props);
}

// Initialization
function initTelegramApp() {
  console.log('Initializing Telegram Web App...');
  if (tg.expand) tg.expand();
  if (tg.setBackgroundColor) {
    const isDark = tg.colorScheme === 'dark';
    tg.setBackgroundColor(isDark ? '#1a1a1a' : '#ffffff');
  }
  applyTheme();
  displayUserInfo();
  setupEventListeners();
  loadSettings();
  setTimeout(() => document.getElementById('loading-overlay').classList.add('hidden'), 500);
  console.log('App initialized successfully!');
}

// Display user info
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

// Theme
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
if (tg.onEvent) tg.onEvent('themeChanged', applyTheme);
function toggleTheme() { document.body.classList.toggle('dark-theme'); const isDark = document.body.classList.contains('dark-theme'); document.getElementById('theme-display').textContent = isDark ? 'Dark' : 'Light'; triggerHaptic('light'); }

// Counter
function updateCounterDisplay() { document.getElementById('counter').textContent = appState.counter; updateLastAction('Counter updated'); }
function incrementCounter(){ appState.counter++; updateCounterDisplay(); triggerHaptic('light'); }
function decrementCounter(){ appState.counter--; updateCounterDisplay(); triggerHaptic('light'); }
function resetCounter(){ appState.counter = 0; updateCounterDisplay(); triggerHaptic('medium'); showNotification('Counter Reset', 'Counter has been reset to 0'); }

// Share / fallback
function shareApp() {
  const shareUrl = window.location.href;
  const text = `Check out this awesome Telegram Mini App! 🚀`;
  triggerHaptic('light'); updateLastAction('App shared'); trackEvent('ShareClicked');
  if (tg.shareToChat) {
    tg.shareToChat({ url: shareUrl, text }).catch(() => fallbackShare(shareUrl, text));
  } else if (navigator.share) {
    navigator.share({ title: 'Telegram Mini App', text, url: shareUrl }).catch(() => {});
  } else fallbackShare(shareUrl, text);
}
function fallbackShare(url, text){ showNotification('Share', `URL: ${url}`); }

// Notifications & haptics
function showNotification(title, message) {
  if (!appSettings.enableNotifications) return;
  if (tg.showPopup) tg.showPopup({ title, message, buttons: [{ id: 'ok', type: 'ok', text: 'OK' }]});
  else alert(`${title}: ${message}`);
}
function triggerHaptic(type='light') {
  if (!appSettings.enableHaptic) return;
  try { if (tg.HapticFeedback) {
    if (type === 'success') tg.HapticFeedback.notificationOccurred('success');
    else tg.HapticFeedback.impactOccurred(type);
  }} catch(e){ console.log('Haptic not available', e); }
}

// Data / copy
function updateLastAction(action) { appState.lastAction = new Date().toLocaleTimeString(); document.getElementById('last-action').textContent = `${action} • ${appState.lastAction}`; }
function copyAppData() {
  const data = { user: { name: appState.userName, id: appState.userId }, counter: appState.counter, timestamp: new Date().toISOString(), platform: navigator.userAgent };
  const jsonString = JSON.stringify(data, null, 2);
  if (navigator.clipboard) navigator.clipboard.writeText(jsonString).then(()=>{triggerHaptic('success'); showNotification('Success','App data copied to clipboard!');}).catch(()=>fallbackCopy(jsonString));
  else fallbackCopy(jsonString);
}
function fallbackCopy(text){ const t=document.createElement('textarea'); t.value=text; document.body.appendChild(t); t.select(); document.execCommand('copy'); document.body.removeChild(t); showNotification('Success','App data copied!'); }

// Feedback (now posts to /feedback + sends init_data)
function handleFeedbackSubmit(e){
  e.preventDefault();
  const name = document.getElementById('name-input').value.trim();
  const message = document.getElementById('message-input').value.trim();
  if (!name || !message){ showNotification('Validation','Please fill in all fields'); triggerHaptic('heavy'); return; }
  const feedback = { name, message, userId: appState.userId, timestamp: new Date().toISOString(), init_data: tg.initData || '' };
  fetch('/feedback', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(feedback) })
    .then(res => { if (!res.ok) throw new Error('Network response not ok'); return res.json(); })
    .then(json => { document.getElementById('feedback-form').reset(); triggerHaptic('success'); showNotification('Thank You!', `Thanks ${name}, your feedback has been received!`); updateLastAction('Feedback submitted'); trackEvent('FeedbackSubmitted'); })
    .catch(err => { console.error('Feedback submit failed:', err); showNotification('Error','Failed to submit feedback.'); });
}

// Settings
function loadSettings(){ const saved = localStorage.getItem('appSettings'); if (saved){ appSettings = JSON.parse(saved); document.getElementById('notifications-toggle').checked = appSettings.enableNotifications; document.getElementById('haptic-toggle').checked = appSettings.enableHaptic; document.getElementById('sound-toggle').checked = appSettings.enableSound; } }
function saveSettings(){ appSettings.enableNotifications = document.getElementById('notifications-toggle').checked; appSettings.enableHaptic = document.getElementById('haptic-toggle').checked; appSettings.enableSound = document.getElementById('sound-toggle').checked; localStorage.setItem('appSettings', JSON.stringify(appSettings)); updateLastAction('Settings updated'); }

// Event listeners
function setupEventListeners(){
  document.getElementById('increment-btn').addEventListener('click', incrementCounter);
  document.getElementById('decrement-btn').addEventListener('click', decrementCounter);
  document.getElementById('reset-btn').addEventListener('click', resetCounter);
  document.getElementById('share-btn').addEventListener('click', shareApp);
  document.getElementById('notify-btn').addEventListener('click', ()=>{ triggerHaptic('light'); showNotification('Hello! 👋','You have received a notification!'); updateLastAction('Notification shown'); });
  document.getElementById('theme-btn').addEventListener('click', toggleTheme);
  document.getElementById('feedback-form').addEventListener('submit', handleFeedbackSubmit);
  document.getElementById('copy-data-btn').addEventListener('click', copyAppData);
  document.getElementById('notifications-toggle').addEventListener('change', saveSettings);
  document.getElementById('haptic-toggle').addEventListener('change', saveSettings);
  document.getElementById('sound-toggle').addEventListener('change', saveSettings);
  updatePlatformInfo(); updateFooterTime(); setInterval(updateFooterTime, 60000);
}

// Platform & footer
function updatePlatformInfo(){ const platform = /iPhone|iPad|iPod/i.test(navigator.userAgent) ? 'iOS' : /Android/i.test(navigator.userAgent) ? 'Android' : /Windows/i.test(navigator.userAgent) ? 'Windows' : /Mac/i.test(navigator.userAgent) ? 'macOS' : 'Unknown'; document.getElementById('platform-display').textContent = platform; }
function updateFooterTime(){ const now = new Date(); const timeString = now.toLocaleTimeString('en-US', {hour:'2-digit', minute:'2-digit', hour12:true}); document.getElementById('footer-time').textContent = `Updated: ${timeString}`; }

// MainButton: send data to server + include init_data
function setupMainButton(){
  if (tg.MainButton){
    tg.MainButton.text = '📤 Send Data';
    tg.MainButton.show();
    tg.MainButton.onClick(() => {
      const data = { counter: appState.counter, userName: appState.userName, userId: appState.userId, timestamp: new Date().toISOString(), init_data: tg.initData || '' };
      fetch('/send-data', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data) })
        .then(res => res.json()).then(json => { triggerHaptic('success'); showNotification('Data Sent','Your data has been sent to the server!'); trackEvent('SendData'); })
        .catch(err => { console.error('Send failed:', err); showNotification('Send failed','Could not send data to server'); });
      // Optionally also call tg.sendData(JSON.stringify(data));
    });
  }
}

// Start
window.addEventListener('load', ()=>{ initTelegramApp(); setupMainButton(); });
if (tg.onEvent) { tg.onEvent('webAppReady', ()=>{ console.log('Telegram Web App is ready!'); }); tg.onEvent('viewportChanged', ()=>{ console.log('Viewport changed'); }); }
document.addEventListener('visibilitychange', ()=>{ console.log(document.hidden ? 'App hidden' : 'App visible'); });
