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
        const response = await fetch(`${config.API_URL}/health`);

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        console.log('API Connection Test:', data);
        showAnswer("Ready to reveal secrets...");
    } catch (error) {
        console.error('API Connection Test Failed:', error);
        showAnswer(`Error: ${error.message || 'Failed to connect to server'}`);
    } finally {
        setLoading(false);
    }
}

// Function to get answer from ChatGPT
async function getAnswerFromChatGPT(question) {
    try {
        showAnswer('Connecting to API...');
        const response = await fetch(`${config.API_URL}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ question })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(e => ({ error: { message: 'Failed to parse error response' } }));
            const errorMessage = `API Error (${response.status}): ${errorData.error?.message || 'Unknown error'}`;
            console.error(errorMessage, errorData);
            showAnswer(errorMessage);
            return null;
        }

        const data = await response.json().catch(e => {
            console.error('Failed to parse API response:', e);
            showAnswer('Error: Failed to parse API response');
            return null;
        });

        if (!data || !data.answer) {
            console.error('Invalid API response format:', data);
            showAnswer('Error: Invalid API response format');
            return null;
        }

        return data.answer;
    } catch (error) {
        const errorMessage = `Error: ${error.message || 'Unknown error occurred'}`;
        console.error('API call failed:', error);
        showAnswer(errorMessage);
        return null;
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
    try {
        const question = questionInput.value;
        validateQuestion(question);
        
        setLoading(true);
        shakeAnimation();
        
        const answer = await getAnswerFromChatGPT(question);
        if (answer) {
            showAnswer(answer, true);
            historyManager.addItem({ question, answer });
            questionInput.value = '';
        }
    } catch (error) {
        showAnswer(`Error: ${error.message}`);
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
