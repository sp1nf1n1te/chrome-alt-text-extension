// Generate icons programmatically (temporary solution)
function generateIcon(size) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    // Draw a simple "ALT" icon
    ctx.fillStyle = '#4285f4';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = 'white';
    ctx.font = `${size/3}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ALT', size/2, size/2);
    
    return canvas.toDataURL();
}

// Generate icons on installation
chrome.runtime.onInstalled.addListener(() => {
    const sizes = [16, 48, 128];
    sizes.forEach(size => {
        const iconData = generateIcon(size);
        chrome.storage.local.set({ [`icon${size}`]: iconData });
    });
});