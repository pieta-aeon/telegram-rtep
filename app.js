import config from './config.js';
import HistoryManager from './historyManager.js';

// Initialize Telegram WebApp
const webapp = window.Telegram.WebApp;
webapp.ready();
webapp.expand();

// Elements
const magicBall = document.querySelector('.magic-ball');
const answerText = document.querySelector('.answer-text');
const questionInput = document.querySelector('.question-input');
const sendButton = document.querySelector('.send-button');
const loadingOverlay = document.querySelector('.loading-overlay');

// Initialize History Manager
const historyManager = new HistoryManager();

// Validate question
function validateQuestion(question) {
    if (!question || question.trim().length === 0) {
        throw new Error(config.ERRORS.EMPTY_QUESTION);
    }
    if (question.length < config.MIN_QUESTION_LENGTH) {
        throw new Error(config.ERRORS.QUESTION_TOO_SHORT);
    }
    if (question.length > config.MAX_QUESTION_LENGTH) {
        throw new Error(config.ERRORS.QUESTION_TOO_LONG);
    }
    return question.trim();
}

// Show loading state
function setLoading(isLoading) {
    loadingOverlay.style.display = isLoading ? 'flex' : 'none';
    sendButton.disabled = isLoading;
    questionInput.disabled = isLoading;
}

// Shake animation
function shakeAnimation() {
    magicBall.style.animation = `shake ${config.SHAKE_ANIMATION_DURATION}ms cubic-bezier(.36,.07,.19,.97) both`;
    magicBall.addEventListener('animationend', () => {
        magicBall.style.animation = '';
    }, { once: true });
}

// Test API connection on load
async function testAPIConnection() {
    try {
        setLoading(true);
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4",
                messages: [
                    {
                        role: "system",
                        content: "You are a snarky fortune teller who actually answers questions but with attitude and insults. Always provide the real answer but be a jerk about it. Keep responses under 20 words. Examples: 'Yes it's going to rain, genius. Pack an umbrella unless you enjoy looking like a drowned rat', 'Of course you'll get the job, when hell freezes over', 'Yes, they're cheating on you. What did you expect with that personality?', 'You'll live to 85, unfortunately for everyone else', 'Your business will succeed... in burning through your savings'. Be direct, insulting, but actually answer the question asked."
                    },
                    {
                        role: "user",
                        content: "Test connection"
                    }
                ],
                max_tokens: 150
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('API Error:', errorData);
            throw new Error(`API Error: ${errorData.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        console.log('API Connection Test:', data);
        showAnswer("Ready to reveal secrets...");
    } catch (error) {
        console.error('API Connection Test Failed:', error);
        showAnswer(config.ERRORS.API_ERROR);
    } finally {
        setLoading(false);
    }
}

// Function to get answer from ChatGPT
async function getAnswerFromChatGPT(question) {
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4",
                messages: [
                    {
                        role: "system",
                        content: "You are a snarky fortune teller who actually answers questions but with attitude and insults. Always provide the real answer but be a jerk about it. Keep responses under 20 words. Examples: 'Yes it's going to rain, genius. Pack an umbrella unless you enjoy looking like a drowned rat', 'Of course you'll get the job, when hell freezes over', 'Yes, they're cheating on you. What did you expect with that personality?', 'You'll live to 85, unfortunately for everyone else', 'Your business will succeed... in burning through your savings'. Be direct, insulting, but actually answer the question asked."
                    },
                    {
                        role: "user",
                        content: question
                    }
                ],
                max_tokens: 150
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('API Error:', errorData);
            if (errorData.error?.code === 'rate_limit_exceeded') {
                return "Rate limit exceeded. Please try again in about an hour. The truth can't be rushed.";
            }
            throw new Error(`API Error: ${errorData.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        return data.choices[0].message.content.trim();
    } catch (error) {
        console.error('Error getting answer:', error);
        if (error.message.includes('rate limit')) {
            return "Rate limit exceeded. Please try again in about an hour. The truth can't be rushed.";
        }
        throw error;
    }
}

// Function to adjust text size based on content
function adjustTextSize(text) {
    const maxSize = 22;
    const minSize = 12;
    const decrementStep = 0.5;

    // Reset to maximum size
    answerText.style.fontSize = `${maxSize}px`;
    answerText.textContent = text;

    // Reduce size until text fits
    let currentSize = maxSize;
    while (
        (answerText.scrollHeight > answerText.clientHeight ||
         answerText.scrollWidth > answerText.clientWidth) &&
        currentSize > minSize
    ) {
        currentSize -= decrementStep;
        answerText.style.fontSize = `${currentSize}px`;
    }

    // If still too big, truncate with ellipsis
    if (answerText.scrollHeight > answerText.clientHeight ||
        answerText.scrollWidth > answerText.clientWidth) {
        
        let words = text.split(' ');
        while (words.length > 1 && 
               (answerText.scrollHeight > answerText.clientHeight ||
                answerText.scrollWidth > answerText.clientWidth)) {
            words.pop();
            answerText.textContent = words.join(' ') + '...';
        }
    }
}

// Function to display the answer
async function showAnswer(text, fromQuestion = false) {
    answerText.style.opacity = '0';
    
    await new Promise(resolve => setTimeout(resolve, config.FADE_ANIMATION_DURATION));
    
    adjustTextSize(text);
    answerText.style.opacity = '1';

    if (fromQuestion) {
        historyManager.addEntry(questionInput.value, text);
        questionInput.value = '';
    }
}

// Handle device motion
function handleMotion(event) {
    const now = Date.now();
    if (now - lastShakeTime < config.SHAKE_TIMEOUT) return;

    const acceleration = event.accelerationIncludingGravity;
    if (!acceleration) return;

    const movement = Math.abs(acceleration.x) + Math.abs(acceleration.y) + Math.abs(acceleration.z);

    if (movement > config.SHAKE_THRESHOLD) {
        lastShakeTime = now;
        handleShake();
    }
}

// Request device motion permission
async function requestMotionPermission() {
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
        try {
            const permission = await DeviceMotionEvent.requestPermission();
            if (permission === 'granted') {
                window.addEventListener('devicemotion', handleMotion);
            }
        } catch (error) {
            console.error('Error requesting motion permission:', error);
        }
    } else {
        window.addEventListener('devicemotion', handleMotion);
    }
}

// Handle shake event
async function handleShake() {
    if (questionInput.value.trim() === '') {
        showAnswer(config.ERRORS.EMPTY_QUESTION);
        return;
    }

    try {
        setLoading(true);
        shakeAnimation();
        const question = validateQuestion(questionInput.value);
        const answer = await getAnswerFromChatGPT(question);
        showAnswer(answer, true);
    } catch (error) {
        showAnswer(error.message || config.ERRORS.API_ERROR);
    } finally {
        setLoading(false);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('App initializing...');
    
    // Check if config is properly loaded
    if (!config || !config.API_KEY || config.API_KEY === 'your-openai-api-key-here') {
        console.error('API key not configured. Please set up config.js with your OpenAI API key.');
        showAnswer('Error: API key not configured. Please set up config.js with your OpenAI API key.');
        return;
    }

    testAPIConnection();
    requestMotionPermission();
    
    // Event Listeners
    console.log('Setting up event listeners...');
    sendButton.addEventListener('click', () => {
        console.log('Send button clicked');
        handleShake();
    });
    
    questionInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            console.log('Enter key pressed');
            handleShake();
        }
    });

    // Input validation
    questionInput.addEventListener('input', () => {
        if (questionInput.value.length > config.MAX_QUESTION_LENGTH) {
            questionInput.value = questionInput.value.slice(0, config.MAX_QUESTION_LENGTH);
        }
    });

    console.log('App initialization complete');
});

// Handle theme changes
function updateTheme() {
    document.documentElement.style.setProperty('--primary-color', webapp.themeParams.button_color || '#2196F3');
    document.documentElement.style.setProperty('--hover-color', webapp.themeParams.button_text_color || '#1976D2');
    document.documentElement.style.setProperty('--text-color', webapp.themeParams.text_color || '#000000');
    document.documentElement.style.setProperty('--hint-color', webapp.themeParams.hint_color || '#999999');
    document.documentElement.style.setProperty('--bg-color', webapp.themeParams.bg_color || '#ffffff');
    document.documentElement.style.setProperty('--secondary-bg', webapp.themeParams.secondary_bg_color || '#f0f0f0');
}

// Listen for theme changes
webapp.onEvent('themeChanged', updateTheme);

// Set initial theme
updateTheme();
