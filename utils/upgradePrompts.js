export class UpgradePrompts {
  static async showLimitReachedNotification(upgradeType) {
    // Send message to show notification in the popup instead of creating DOM elements
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({
        action: 'showLimitNotification',
        data: { upgradeType }
      }, (response) => {
        if (response && response.upgrade) {
          this.showUpgradeModal();
        }
        resolve(true);
      });
    });
  }

  static async showUpgradeModal(selectedTier = 'PRO') {
    return new Promise((resolve) => {
      chrome.tabs.create({
        url: chrome.runtime.getURL('popup/upgrade.html'),
        active: true
      }, (tab) => {
        // Listen for upgrade completion
        chrome.runtime.onMessage.addListener(function handler(message) {
          if (message.type === 'upgrade_complete') {
            chrome.runtime.onMessage.removeListener(handler);
            resolve(true);
          }
        });
      });
    });
  }
} 