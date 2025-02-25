import { ApiKeyManager } from './utils/apiKeyManager.js';
import { UserManager } from './utils/userManager.js';
import { UpgradePrompts } from './utils/upgradePrompts.js';

async function initializePage() {
  try {
    // Show loading state
    showLoadingState();

    const currentPlan = await UserManager.getCurrentPlan();
    const usageStats = await UserManager.getUsageStats();
    const usageHistory = await UserManager.getUsageHistory();

    // Update all sections
    updateCurrentPlan(currentPlan);
    updateUsageStats(usageStats);
    updateUsageHistory(usageHistory);
    updatePlanCards(currentPlan);

    // Hide loading state
    hideLoadingState();
  } catch (error) {
    showErrorState(error);
  }
}

function showLoadingState() {
  document.querySelectorAll('.content-section').forEach(section => {
    section.innerHTML = `
      <div class="loading-spinner">
        <div class="spinner"></div>
        <p>Loading...</p>
      </div>
    `;
  });
}

function hideLoadingState() {
  document.querySelectorAll('.loading-spinner').forEach(spinner => {
    spinner.remove();
  });
}

function showErrorState(error) {
  document.querySelectorAll('.content-section').forEach(section => {
    section.innerHTML = `
      <div class="error-state">
        <p>Error loading data: ${error.message}</p>
        <button onclick="location.reload()">Retry</button>
      </div>
    `;
  });
}

function updateCurrentPlan(currentPlan) {
  document.querySelector('.current-plan-name').textContent = currentPlan;
}

function updateUsageStats(usageStats) {
  document.querySelector('.requests-used').textContent = 
    `${usageStats.requestsUsed}/${usageStats.requestsLimit}`;
  
  // Update usage bar
  const percentage = (usageStats.requestsUsed / usageStats.requestsLimit) * 100;
  document.querySelector('.usage-bar-fill').style.width = `${percentage}%`;

  // Update current period stats
  document.querySelector('.current-requests').textContent = 
    `${usageStats.requestsUsed}/${usageStats.requestsLimit}`;
  document.querySelector('.current-tokens').textContent = 
    `${usageStats.tokensUsed}/${usageStats.tokensLimit}`;
}

function updateUsageHistory(history) {
  const tbody = document.querySelector('.usage-history');
  if (!history || history.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="3" class="empty-state">
          <div class="empty-message">
            <p>No usage history yet</p>
            <p class="empty-subtitle">Start generating ALT text to see your usage</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = history.map(entry => `
    <tr>
      <td>${new Date(entry.date).toLocaleDateString()}</td>
      <td>${entry.requests}</td>
      <td>${entry.tokens}</td>
    </tr>
  `).join('');
}

function updatePlanCards(currentPlan) {
  document.querySelectorAll('.plan-card').forEach(card => {
    const planType = card.dataset.plan;
    const button = card.querySelector('.upgrade-btn');

    if (planType === currentPlan) {
      card.classList.add('current');
      button.textContent = 'Current Plan';
      button.classList.add('current-plan-btn');
      button.disabled = true;
    } else {
      button.addEventListener('click', () => showUpgradeModal(planType));
    }
  });
}

async function showUpgradeModal(tier) {
  await UpgradePrompts.showUpgradeModal(tier);
}

// Add refresh functionality
document.querySelector('.refresh-stats')?.addEventListener('click', async () => {
  try {
    const stats = await UserManager.getUsageStats();
    const history = await UserManager.getUsageHistory();
    updateUsageStats(stats);
    updateUsageHistory(history);
  } catch (error) {
    console.error('Failed to refresh stats:', error);
  }
});

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize usage display
    updateUsageDisplay();
    initializeRefreshButton();
    initializeUpgradeButtons();

    // Get references to elements
    const maxTokensInput = document.getElementById('max-tokens');
    const temperatureInput = document.getElementById('temperature');
    const apiKeyInput = document.getElementById('api-key');
    const saveButton = document.getElementById('save');
    const statusDiv = document.getElementById('status');

    // Only add event listeners if elements exist
    if (saveButton) {
      saveButton.addEventListener('click', saveOptions);
    }

    // Load saved options
    restoreOptions();

    // Saves options to chrome.storage
    function saveOptions() {
      if (!maxTokensInput || !temperatureInput || !apiKeyInput) {
        console.error('Required form elements not found');
        return;
      }

      chrome.storage.sync.set(
        {
          maxTokens: maxTokensInput.value,
          temperature: temperatureInput.value,
          apiKey: apiKeyInput.value,
        },
        () => {
          if (statusDiv) {
            statusDiv.textContent = 'Options saved.';
            statusDiv.className = 'status success';
            setTimeout(() => {
              statusDiv.textContent = '';
              statusDiv.className = 'status';
            }, 3000);
          }
        }
      );
    }

    // Restores select box and checkbox state using the preferences
    // stored in chrome.storage.
    function restoreOptions() {
      chrome.storage.sync.get(
        {
          maxTokens: 100,
          temperature: 0.7,
          apiKey: '',
        },
        (items) => {
          if (maxTokensInput) maxTokensInput.value = items.maxTokens;
          if (temperatureInput) temperatureInput.value = items.temperature;
          if (apiKeyInput) apiKeyInput.value = items.apiKey;
        }
      );
    }
});

async function updateUsageDisplay() {
  try {
    const stats = await UserManager.getUsageStats();
    
    // Update current plan stats
    document.querySelector('.current-plan-name').textContent = stats.currentPlan || 'Free';
    document.querySelector('.requests-used').textContent = `${stats.requestsUsed}/${stats.requestsLimit}`;
    
    // Update usage bar
    const usagePercentage = (stats.requestsUsed / stats.requestsLimit) * 100;
    document.querySelector('.usage-bar-fill').style.width = `${usagePercentage}%`;
    
    // Update analytics
    document.querySelector('.current-requests').textContent = `${stats.requestsUsed}/${stats.requestsLimit}`;
    document.querySelector('.current-tokens').textContent = `${stats.tokensUsed}/${stats.tokensLimit}`;
  } catch (error) {
    console.error('Error updating usage display:', error);
  }
}

function showMessage(message, type = 'info') {
  // Create toast message if it doesn't exist
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 24px;
      border-radius: 4px;
      color: white;
      z-index: 1000;
      transition: opacity 0.3s ease;
    `;
    document.body.appendChild(toast);
  }

  // Set color based on message type
  toast.style.background = type === 'error' ? '#dc3545' : '#28a745';
  toast.textContent = message;
  toast.style.opacity = '1';

  // Hide after 3 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
  }, 3000);
}

function initializeRefreshButton() {
  const refreshBtn = document.querySelector('.refresh-stats');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', updateUsageDisplay);
  }
}

function initializeUpgradeButtons() {
  document.querySelectorAll('.upgrade-btn').forEach(button => {
    button.addEventListener('click', () => {
      const tier = button.dataset.tier;
      showUpgradeModal(tier);
    });
  });
}

document.addEventListener('DOMContentLoaded', initializePage);

