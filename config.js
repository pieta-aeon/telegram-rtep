// Configuration settings
const config = {
    // API Settings
    OPENAI_API_KEY: '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',
    
    // Motion Settings
    SHAKE_THRESHOLD: 15,
    SHAKE_TIMEOUT: 1000,
    
    // Input Validation
    MAX_QUESTION_LENGTH: 200,
    MIN_QUESTION_LENGTH: 3,
    
    // Animation Timings (in ms)
    SHAKE_ANIMATION_DURATION: 800,
    FADE_ANIMATION_DURATION: 300,
    LOADING_ANIMATION_DURATION: 1500,
    
    // Storage
    MAX_HISTORY_ITEMS: 5,
    HISTORY_STORAGE_KEY: 'rtep_history',
    
    // Error Messages
    ERRORS: {
        QUESTION_TOO_SHORT: 'Question too short. Ask something meaningful!',
        QUESTION_TOO_LONG: 'Whoa there! Keep it shorter.',
        EMPTY_QUESTION: 'Ask something first!',
        API_ERROR: 'The crystal ball is foggy. Try again later.',
        NETWORK_ERROR: 'Check your internet connection!',
        RATE_LIMIT: 'Slow down! The spirits need a break.'
    }
};

export default config;
