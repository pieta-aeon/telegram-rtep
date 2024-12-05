import config from './config.js';

class HistoryManager {
    constructor() {
        this.history = this.loadHistory();
        // Ensure we only keep the most recent items on load
        if (this.history.length > config.MAX_HISTORY_ITEMS) {
            this.history = this.history.slice(0, config.MAX_HISTORY_ITEMS);
            this.saveHistory();
        }
    }

    loadHistory() {
        const stored = localStorage.getItem(config.HISTORY_STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    }

    saveHistory() {
        localStorage.setItem(config.HISTORY_STORAGE_KEY, JSON.stringify(this.history));
    }

    addEntry(question, answer) {
        // Add new entry to the beginning
        this.history.unshift({
            question,
            answer,
            timestamp: new Date().toISOString()
        });

        // Keep only the most recent items
        if (this.history.length > config.MAX_HISTORY_ITEMS) {
            this.history = this.history.slice(0, config.MAX_HISTORY_ITEMS);
        }

        this.saveHistory();
        this.updateUI();
    }

    updateUI() {
        const historyList = document.querySelector('.history-list');
        if (!historyList) return;

        historyList.innerHTML = this.history.map(entry => `
            <div class="history-item">
                <div class="history-question">${entry.question}</div>
                <div class="history-answer">${entry.answer}</div>
                <div class="history-timestamp">${new Date(entry.timestamp).toLocaleString()}</div>
            </div>
        `).join('');
    }

    clearHistory() {
        this.history = [];
        this.saveHistory();
        this.updateUI();
    }
}

export default HistoryManager;
