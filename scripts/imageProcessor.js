export async function processImage(imageUrl) {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      // Create a canvas to resize the image if needed
      const img = new Image();
      const maxSize = 1024; // Max dimension size
      
      return new Promise((resolve, reject) => {
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Resize if necessary
          if (width > maxSize || height > maxSize) {
            if (width > height) {
              height = (height / width) * maxSize;
              width = maxSize;
            } else {
              width = (width / height) * maxSize;
              height = maxSize;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to base64
          const base64Image = canvas.toDataURL('image/jpeg', 0.8);
          resolve(base64Image);
        };
        
        img.onerror = reject;
        img.src = URL.createObjectURL(blob);
      });
    } catch (error) {
      throw new Error('Failed to process image: ' + error.message);
    }
  }

export class ImageProcessor {
  static FETCH_TIMEOUT = 15000;
  static MAX_RETRIES = 3;
  static RETRY_DELAY = 1000;

  static async directFetch(url, retryCount = 0) {
    try {
      console.log(`Processing image:`, url);

      // Handle various URL formats
      let processedUrl = url;
      
      // Remove any query parameters that might interfere with image loading
      if (url.includes('?')) {
        processedUrl = url.split('?')[0];
      }

      // For Chrome extension, use chrome.runtime.getURL if it's a local resource
      if (url.startsWith('chrome-extension://')) {
        processedUrl = chrome.runtime.getURL(url.split('chrome-extension://')[1]);
      }

      // For data URLs, use them directly
      if (url.startsWith('data:image/')) {
        return { url: url };
      }

      // For web URLs, fetch through background script if needed
      try {
        const response = await fetch(processedUrl, {
          headers: {
            'Accept': 'image/*',
            'Cache-Control': 'no-cache'
          },
          mode: 'cors',
          cache: 'no-cache'
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return { url: processedUrl };

      } catch (fetchError) {
        console.log('Direct fetch failed, trying alternative method:', fetchError);
        
        // If direct fetch fails, try using chrome.tabs API
        return new Promise((resolve, reject) => {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError));
              return;
            }
            resolve({ url: processedUrl });
          });
        });
      }

    } catch (error) {
      console.error('Image processing failed:', error);
      if (retryCount < this.MAX_RETRIES) {
        console.log(`Retrying process (${retryCount + 1}/${this.MAX_RETRIES})...`);
        await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
        return this.directFetch(url, retryCount + 1);
      }
      throw error;
    }
  }

  static async validateImage(blob) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(blob);

      img.onload = () => {
        URL.revokeObjectURL(url);
        if (img.width === 0 || img.height === 0) {
          reject(new Error('Invalid image dimensions'));
        } else {
          resolve(true);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };

      img.src = url;
    });
  }
}