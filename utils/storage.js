const MAX_HISTORY_ITEMS = 5;

export async function saveToHistory(item) {
  try {
    const { history = [] } = await chrome.storage.local.get('history');
    
    // Add new item to the beginning
    history.unshift(item);
    
    // Keep only the last MAX_HISTORY_ITEMS
    if (history.length > MAX_HISTORY_ITEMS) {
      history.pop();
    }
    
    await chrome.storage.local.set({ history });
  } catch (error) {
    console.error('Error saving to history:', error);
  }
}

export async function getHistory() {
  try {
    const { history = [] } = await chrome.storage.local.get('history');
    return history;
  } catch (error) {
    console.error('Error getting history:', error);
    return [];
  }
}