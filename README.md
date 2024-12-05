# RTEP - The Snarky Magic 8-Ball

A Telegram mini-app that provides snarky, sarcastic answers to your questions. It's like a regular magic 8-ball, but with attitude!

## Features

- Snarky responses to your questions using GPT-4 mini
- Shake detection for mobile devices
- History of your last 5 questions and answers
- Responsive design that works on all devices
- Smooth animations and transitions
- Dark/Light theme support via Telegram theme

## Files

- `index.html` - Main interface with the magic 8-ball design
- `app.js` - Core application logic and API integration
- `config.js` - Configuration settings and constants
- `historyManager.js` - Manages question/answer history
- `images/8ball sprite.png` - Magic 8-ball image asset

## Setup

1. Host the files on a web server
2. Update the OpenAI API key in `config.js`
3. Add the web app to your Telegram bot

## Dependencies

- OpenAI GPT-4 mini API
- Telegram Web App API
- Python (for local development server)

## Development

To run locally:
```bash
python -m http.server 8000
```
Then visit `http://localhost:8000`

## Features

- Real-time answers with attitude
- Text auto-sizing to fit the 8-ball window
- Shake to ask (on supported devices)
- History tracking of recent questions
- Loading states and error handling
- Responsive design for all screen sizes
