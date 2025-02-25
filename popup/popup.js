import { ApiKeyManager } from '../utils/apiKeyManager.js';
import { getHistory } from '../utils/storage.js';
import { getUsageStats } from '../services/analytics';

class PopupManager {
    constructor() {
        console.log('Initializing PopupManager');
        
        // Get DOM elements
        this.historyContainer = document.getElementById('alt-text-history');
        this.themeToggle = document.getElementById('theme-toggle');
        this.refreshBtn = document.getElementById('refresh-usage');
        this.usageContent = document.querySelector('.usage-content');
        
        if (!this.historyContainer || !this.themeToggle) {
            console.error('Required DOM elements not found:', {
                historyContainer: !!this.historyContainer,
                themeToggle: !!this.themeToggle
            });
            return;
        }

        this.initializeTheme();
        this.initializeEventListeners();
        this.loadHistory();
        this.updateUsageDisplay();
    }

    async initializeTheme() {
        const { theme = 'light' } = await chrome.storage.local.get('theme');
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
            this.themeToggle.textContent = '☀️';
        }
    }

    initializeEventListeners() {
        this.themeToggle.addEventListener('click', async () => {
            const { theme } = await chrome.storage.local.get('theme');
            const newTheme = theme === 'dark' ? 'light' : 'dark';
            await chrome.storage.local.set({ theme: newTheme });
            
            document.body.classList.toggle('dark-theme');
            this.themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
        });

        if (this.refreshBtn) {
            this.refreshBtn.addEventListener('click', () => this.updateUsageDisplay());
        }
    }

    async loadHistory() {
        try {
            // Check for errors first
            const { lastError } = await chrome.storage.local.get('lastError');
            if (lastError) {
                this.historyContainer.innerHTML = `
                    <div style="
                        padding: 15px;
                        margin: 10px 0;
                        border: 1px solid #dc3545;
                        border-radius: 8px;
                        background: #fff;
                        color: #dc3545;
                    ">
                        Error: ${lastError}
                    </div>
                `;
                // Clear the error
                await chrome.storage.local.remove('lastError');
                return;
            }

            const history = await getHistory();
            this.historyContainer.innerHTML = history.map(item => `
                <div class="history-item">
                    <img src="${item.imageUrl}" alt="${item.altText}" style="max-width: 100px;">
                    <p>${item.altText}</p>
                    <button class="copy-btn" data-text="${item.altText}">Copy</button>
                </div>
            `).join('');

            // Add copy functionality
            this.historyContainer.querySelectorAll('.copy-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    navigator.clipboard.writeText(btn.dataset.text);
                    btn.textContent = 'Copied!';
                    setTimeout(() => btn.textContent = 'Copy', 2000);
                });
            });
        } catch (error) {
            this.showError('Failed to load history');
        }
    }

    async loadSettings() {
        const apiKey = await ApiKeyManager.getKey();
        if (apiKey) {
            this.apiKeyInput.value = '••••••••••••••••';
        }
    }

    async saveSettings() {
        try {
            const apiKey = this.apiKeyInput.value;
            if (apiKey && apiKey !== '••••••••••••••••') {
                await ApiKeyManager.setKey(apiKey);
                this.showMain();
            }
        } catch (error) {
            this.showError('Failed to save settings');
        }
    }

    showSettings() {
        this.mainView.classList.add('hidden');
        this.settingsView.classList.remove('hidden');
    }

    showMain() {
        this.settingsView.classList.add('hidden');
        this.mainView.classList.remove('hidden');
    }

    showError(message) {
        this.errorContainer.textContent = message;
        this.errorContainer.classList.remove('hidden');
        setTimeout(() => this.errorContainer.classList.add('hidden'), 5000);
    }

    settingsButtonClicked() {
        console.log('Settings button clicked');
        if (chrome.runtime.openOptionsPage) {
            chrome.runtime.openOptionsPage();
        } else {
            window.open(chrome.runtime.getURL('options.html'));
        }
    }

    async updateUsageDisplay() {
        if (!this.usageContent) return;

        try {
            const stats = await getUsageStats();
            if (stats) {
                this.usageContent.innerHTML = `
                    <div class="usage-stats">
                        <p>Plan: ${stats.plan}</p>
                        <p>Used: ${stats.used}/${stats.limit}</p>
                        <p>Remaining: ${stats.remaining}</p>
                        <p>Tokens: ${stats.tokensUsed}</p>
                    </div>
                `;
            } else {
                this.usageContent.innerHTML = '<p>No usage data available</p>';
            }
        } catch (error) {
            console.error('Error updating usage display:', error);
            this.usageContent.innerHTML = '<p>Error loading usage data</p>';
        }
    }
}

// Single initialization point
document.addEventListener('DOMContentLoaded', () => {
    console.log('Popup loaded - Starting initialization');
    try {
        const popupManager = new PopupManager();
        
        // Storage change listener
        chrome.storage.onChanged.addListener((changes, namespace) => {
            if (namespace === 'local') {
                if (changes.altTextHistory) {
                    console.log('History updated, reloading content');
                    popupManager.loadHistory();
                }
                if (changes.theme) {
                    console.log('Theme updated:', changes.theme.newValue);
                    const newTheme = changes.theme.newValue;
                    if (newTheme === 'dark') {
                        document.body.classList.add('dark-theme');
                        document.getElementById('theme-toggle').textContent = '☀️';
                    } else {
                        document.body.classList.remove('dark-theme');
                        document.getElementById('theme-toggle').textContent = '🌙';
                    }
                }
            }
        });

    } catch (error) {
        console.error('Error initializing popup:', error);
        const historyContainer = document.getElementById('alt-text-history');
        if (historyContainer) {
            historyContainer.innerHTML = '<div class="history-item error">Error initializing popup</div>';
        }
    }
});