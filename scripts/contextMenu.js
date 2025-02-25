import { generateAltText } from './apiService.js';
import { UserManager } from '../utils/userManager.js';
import { ImageProcessor } from './imageProcessor.js';

export class ContextMenuHandler {
  static init() {
    chrome.contextMenus.create({
      id: "generateAltText",
      title: "Generate ALT Text",
      contexts: ["image"]
    });

    chrome.contextMenus.onClicked.addListener(async (info, tab) => {
      if (info.menuItemId === "generateAltText") {
        try {
          const imageUrl = info.srcUrl;
          console.log('Processing image:', imageUrl);
          
          if (!imageUrl) {
            throw new Error('No image URL found');
          }

          // Process image and generate alt text
          const processedImage = await ImageProcessor.directFetch(imageUrl);
          if (!processedImage) {
            throw new Error('Failed to process image');
          }

          const altText = await generateAltText(imageUrl);
          console.log('Generated ALT text:', altText);
          
          // Store in history with timestamp
          const newEntry = {
            altText,
            timestamp: new Date().toLocaleString(),
            imageUrl
          };

          // Get existing history
          const result = await chrome.storage.local.get('altTextHistory');
          const history = Array.isArray(result.altTextHistory) ? result.altTextHistory : [];
          
          // Add new entry to the beginning
          const newHistory = [newEntry, ...history].slice(0, 10);
          await chrome.storage.local.set({ altTextHistory: newHistory });

          // Update the image on the page
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: (url, text) => {
              const img = document.querySelector(`img[src="${url}"]`);
              if (img) {
                img.setAttribute('alt', text);
              }
            },
            args: [imageUrl, altText]
          });

          // Show the extension popup instead of creating a new window
          await chrome.action.openPopup();

        } catch (error) {
          console.error('Error in context menu handler:', error);
          await ContextMenuHandler.showError(tab, error.message);
        }
      }
    });
  }

  static async updateImageAlt(tab, imageUrl, altText) {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (url, text) => {
        const img = document.querySelector(`img[src="${url}"]`);
        if (img) {
          img.alt = text;
          img.style.outline = '2px solid #2196f3';
          setTimeout(() => img.style.outline = '', 2000);
        }
      },
      args: [imageUrl, altText]
    });
  }

  static async showUpgradePrompt(tab) {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const div = document.createElement('div');
        div.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #f44336;
          color: white;
          padding: 16px;
          border-radius: 4px;
          z-index: 10000;
          box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        `;
        div.textContent = 'Usage limit reached. Please upgrade to continue.';
        document.body.appendChild(div);
        setTimeout(() => div.remove(), 3000);
      }
    });
  }

  static async showError(tab, message) {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (msg) => {
        const div = document.createElement('div');
        div.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #f44336;
          color: white;
          padding: 16px;
          border-radius: 4px;
          z-index: 10000;
          box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        `;
        div.textContent = `Error: ${msg}`;
        document.body.appendChild(div);
        setTimeout(() => div.remove(), 3000);
      },
      args: [message]
    });
  }
}
