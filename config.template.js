// Configuration template file
// Copy this file to config.js and replace the API key with your own
const config = {
    API_KEY: 'your-openai-api-key-here',
    MAX_HISTORY_ITEMS: 5,
    ERRORS: {
        API_ERROR: "The spirits are temporarily unavailable. Try again later.",
        INVALID_QUESTION: "You must ask a question to receive an answer."
    }
};

export default config;
