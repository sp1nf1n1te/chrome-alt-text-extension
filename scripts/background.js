import { ContextMenuHandler } from './contextMenu.js';
import { UserManager } from '../utils/userManager.js';
import { generateAltText } from './apiService.js';

// Initialize context menu on installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Background service worker loaded');
  ContextMenuHandler.init();
});

// Handle connections from popup and content scripts
chrome.runtime.onConnect.addListener((port) => {
  console.log('New connection:', port.name);
  
  port.onMessage.addListener(async (msg) => {
    console.log('Received message:', msg);
    
    try {
      switch (msg.action) {
        case 'generateAltText':
          const usageStats = await UserManager.getUsageStats();
          if (usageStats.requestsUsed >= usageStats.requestsLimit) {
            port.postMessage({ 
              error: 'Usage limit reached. Please upgrade to continue.' 
            });
            return;
          }

          const altText = await generateAltText(msg.imageUrl);
          await UserManager.updateUsage(1, altText.length);
          port.postMessage({ 
            altText, 
            imageUrl: msg.imageUrl 
          });
          break;

        case 'checkUsage':
          const stats = await UserManager.getUsageStats();
          port.postMessage({ stats });
          break;

        default:
          console.warn('Unknown action:', msg.action);
      }
    } catch (error) {
      console.error('Error in background script:', error);
      port.postMessage({ 
        error: error.message || 'An error occurred while processing your request' 
      });
    }
  });

  // Handle disconnection
  port.onDisconnect.addListener(() => {
    console.log('Port disconnected:', port.name);
  });
});

// Add this after the existing imports
chrome.runtime.onMessage.addListener(async (message) => {
  if (message.action === 'resetUsage') {
    await chrome.storage.local.set({
      usageStats: {
        requestsUsed: 0,
        tokensUsed: 0,
        lastReset: Date.now()
      }
    });
    console.log('Usage stats reset successfully');
  }
});

console.log('Background service worker loaded');