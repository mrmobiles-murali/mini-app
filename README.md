# 🚀 Telegram Mini App

A comprehensive starter template for building fully functional Telegram Mini Apps with modern web technologies.

## ✨ Features

### Core Functionality
- ✅ **User Authentication** - Display authenticated user information from Telegram
- ✅ **Theme Support** - Automatic light/dark mode with Telegram integration
- ✅ **Interactive Counter** - Demo state management and real-time updates
- ✅ **Share Functionality** - Share app to Telegram chats and groups
- ✅ **Notifications** - Custom popups and notifications
- ✅ **Haptic Feedback** - Vibration feedback for user interactions
- ✅ **User Feedback Form** - Collect user input and feedback
- ✅ **Settings Management** - Persistent user preferences
- ✅ **Data Export** - Copy app data to clipboard
- ✅ **Responsive Design** - Works perfectly on mobile and desktop

## 📁 Project Structure

```
mini-app/
├── index.html          # Main HTML structure with all sections
├── styles.css          # Complete styling with dark mode support
├── app.js              # Full application logic and Telegram SDK integration
├── README.md           # Documentation
├── package.json        # Project metadata
└── .gitignore          # Git ignore rules
```

## 🎯 Key Sections

### 1. User Profile
Displays authenticated user information:
- User ID
- Username
- Language preference
- Bot status indicator

### 2. Quick Actions
- **Share App** - Share to Telegram chats
- **Notify** - Show notifications with haptic feedback
- **Toggle Theme** - Switch between light and dark modes

### 3. Counter Demo
Interactive counter demonstrating:
- State management
- Event handling
- Real-time UI updates
- Increment, Decrement, Reset operations

### 4. Feedback Form
Collect user input:
- Name field
- Message textarea
- Form validation
- LocalStorage integration

### 5. App Data Display
Show real-time app information:
- Current theme
- Platform detection
- App version
- Last action timestamp

### 6. Settings
Persistent user preferences:
- Enable/disable notifications
- Haptic feedback toggle
- Sound effects option
- LocalStorage persistence

## 🚀 Quick Start

### Prerequisites
- A Telegram account
- A bot created via [@BotFather](https://t.me/botfather)
- A web server to host files (GitHub Pages, Netlify, Vercel, etc.)

### Installation & Deployment

#### 1. Clone Repository
```bash
git clone https://github.com/mrmobiles-murali/mini-app.git
cd mini-app
```

#### 2. Deploy to GitHub Pages
```bash
# Push to main branch
git push origin main
```
**URL:** `https://mrmobiles-murali.github.io/mini-app/`

#### 3. Configure Bot (Using @BotFather)
1. Open Telegram and chat with [@BotFather](https://t.me/botfather)
2. Create a new bot or select existing one
3. Go to Bot Settings → Web App
4. Add web app command:
   ```
   Command: start
   URL: https://your-domain.com/mini-app/index.html
   ```
5. Or set default URL:
   ```
   /setdescription
   /setshortdescription
   ```

#### 4. Open Your Mini App
- Search for your bot in Telegram
- Tap the `/start` command
- Your mini app opens!

## 🎨 Customization

### Theme Colors
Edit CSS variables in `styles.css`:

```css
:root {
    --primary-color: #0088cc;      /* Telegram blue */
    --primary-dark: #0066aa;
    --secondary-color: #e8e8e8;
    --text-color: #222;
    --bg-color: #ffffff;
    --card-bg: #f5f5f5;
    --success-color: #31a24c;
    --warning-color: #f59e0b;
    --error-color: #ef4444;
}
```

### Content & Layout
Modify HTML in `index.html` to:
- Add new sections/cards
- Change button labels
- Adjust form fields
- Customize content

### Functionality
Extend `app.js` to:
- Connect to backend API
- Add game mechanics
- Implement real-time features
- Add animations
- Integrate payment systems

## 📡 Backend Integration

### Sending Data to Bot

```javascript
if (tg.MainButton) {
    tg.MainButton.text = 'Send Data';
    tg.MainButton.show();
    
    tg.MainButton.onClick(() => {
        const data = {
            counter: appState.counter,
            userId: appState.userId,
            timestamp: new Date().toISOString()
        };
        tg.sendData(JSON.stringify(data));
    });
}
```

### Bot Handler (Python Example)

```python
from telegram import Update, WebAppInfo
from telegram.ext import Application, CommandHandler, ContextTypes
import json

async def web_app_data(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle web app data from mini app"""
    web_app_data = update.web_app_data
    
    if web_app_data:
        data = json.loads(web_app_data.data)
        counter = data.get('counter')
        user_id = data.get('userId')
        
        await update.message.reply_text(
            f"Received counter value: {counter}"
        )
```

## 🔒 Security Best Practices

⚠️ **Important Security Guidelines:**

1. **Verify initData on Backend**
   ```python
   # Verify Telegram data signature
   import hashlib
   import hmac
   from urllib.parse import unquote
   
   def verify_telegram_data(init_data, token):
       data = dict(item.split('=') for item in init_data.split('&'))
       signature = data.pop('hash')
       
       message = '\n'.join(
           f"{k}={v}" for k, v in sorted(data.items())
       )
       
       secret = hashlib.sha256(token.encode()).digest()
       computed_hash = hmac.new(
           secret, message.encode(), hashlib.sha256
       ).hexdigest()
       
       return hmac.compare_digest(signature, computed_hash)
   ```

2. **HTTPS Only** - Always use HTTPS in production
3. **Validate Inputs** - Sanitize all user inputs
4. **No Sensitive Data** - Don't expose tokens or secrets
5. **Environment Variables** - Store configs securely

## 🌐 Deployment Platforms

### GitHub Pages (Free)
```bash
# Automatic deployment
git push origin main
# Access: https://username.github.io/mini-app/
```

### Netlify (Free)
```bash
# Connect GitHub repository
# Auto-deploys on every push
# Custom domain support
```

### Vercel (Free)
```bash
# Import project
# Zero-config deployment
# Automatic optimizations
```

### AWS S3 + CloudFront (Paid)
```bash
# Upload to S3
aws s3 sync . s3://your-bucket/

# CloudFront CDN
aws cloudfront create-distribution ...
```

## 📱 Testing

### Local Testing
```bash
# Start local server
python -m http.server 8000

# Open in browser
http://localhost:8000
```

### Telegram Testing
1. Create test bot via @BotFather
2. Deploy to public URL
3. Add web app to bot
4. Test in Telegram app
5. Use browser dev tools for debugging

## 🐛 Troubleshooting

### App Not Opening
- ✓ Check URL is publicly accessible
- ✓ Verify HTTPS is enabled
- ✓ Check bot settings in @BotFather
- ✓ Clear Telegram app cache

### User Data Not Showing
- ✓ Make sure opened from Telegram bot link
- ✓ Check browser console for errors
- ✓ Verify Telegram Web App SDK loaded
- ✓ Test in Telegram app (not web)

### Styling Issues
- ✓ Clear browser cache
- ✓ Test in incognito mode
- ✓ Check CSS file loads correctly
- ✓ Verify color scheme detection

### Buttons Not Working
- ✓ Check JavaScript errors in console
- ✓ Verify event listeners attached
- ✓ Test with simple click handler
- ✓ Check for conflicting CSS

## 📚 Resources

- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Telegram Web Apps Documentation](https://core.telegram.org/bots/webapps)
- [Telegram Mini Apps Guide](https://core.telegram.org/bots/webapps)
- [@BotFather](https://t.me/botfather) - Create/configure bots
- [Telegram Developers](https://t.me/TelegramBots) - Community & support

## 📊 File Sizes

| File | Size |
|------|------|
| index.html | ~8 KB |
| styles.css | ~15 KB |
| app.js | ~20 KB |
| **Total** | **~43 KB** |

*Fully optimized and production-ready*

## 🤝 Contributing

Contributions are welcome! Feel free to:
1. Fork the repository
2. Create a feature branch
3. Make improvements
4. Submit pull requests

## 📄 License

MIT License - Free to use for personal and commercial projects

## 💡 Tips & Tricks

### Performance
- Minify CSS and JS for production
- Use CDN for static assets
- Lazy load images
- Compress media files

### User Experience
- Add loading states
- Provide visual feedback
- Use animations carefully
- Test on real devices

### Monetization
- Integrate Telegram Payment system
- Add in-app purchases
- Use Telegram Stars
- Premium features

## 🚀 Next Steps

1. **Deploy** your app
2. **Configure** bot settings
3. **Test** thoroughly
4. **Share** with users
5. **Iterate** based on feedback

---

**Made with ❤️ for Telegram Mini App Developers**

*Happy coding! 🎉*