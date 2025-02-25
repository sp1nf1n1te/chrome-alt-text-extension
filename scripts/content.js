console.log('Content script initializing...');

// Initialize message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Content script received message:', message);

    switch (message.action) {
        case 'showLoading':
            showFeedback('Generating ALT text...', 'info');
            break;

        case 'updateAltText':
            updateImageAltText(message.imageUrl, message.altText);
            showFeedback('ALT text updated!', 'success');
            break;

        case 'showError':
            showFeedback(message.error, 'error');
            break;
    }

    // Must return true if response is async
    return true;
});

function updateImageAltText(imageUrl, altText) {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        if (img.src === imageUrl) {
            img.alt = altText;
        }
    });
}

function showFeedback(message, type = 'info') {
    const colors = {
        info: '#2196F3',
        success: '#4CAF50',
        error: '#f44336'
    };

    const feedback = document.createElement('div');
    feedback.textContent = message;
    feedback.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 24px;
        background: ${colors[type]};
        color: white;
        border-radius: 4px;
        z-index: 10000;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    `;
    document.body.appendChild(feedback);
    setTimeout(() => feedback.remove(), 3000);
}

// Test that the script is loaded
document.addEventListener('contextmenu', (event) => {
  if (event.target.tagName === 'IMG') {
    console.log('Right-clicked on image:', event.target.src);
  }
});

console.log('Content script loaded');

// Add this function to the existing content.js
function handleApiError(error) {
    console.error('API Error:', error);
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
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
    errorDiv.textContent = error.message || 'Error generating alt text';
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 3000);
}

// Update the port message listener
port.onMessage.addListener((response) => {
  if (response.error) {
    handleApiError(response.error);
    return;
  }
  
  if (response.altText && response.imageUrl) {
    updateImageAltText(response.imageUrl, response.altText);
  }
});

console.log('Content script initialized'); 