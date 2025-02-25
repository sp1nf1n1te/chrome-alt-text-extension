/**
 * Extension Manual Test Checklist
 * Run through each scenario and mark as tested
 */

const TEST_SCENARIOS = {
  contextMenu: [
    "Right-click on any image",
    "Verify 'Process with AI' appears in menu",
    "Menu should be enabled for valid images",
    "Menu should be disabled for invalid/missing images"
  ],

  imageSelection: [
    "Click menu item on small image (<1MB)",
    "Click menu item on medium image (1-5MB)",
    "Click menu item on large image (>5MB)",
    "Verify loading indicator appears",
    "Verify response handling"
  ],

  errorMessages: [
    "Test rate limit error (multiple rapid requests)",
    "Test network error (disable internet)",
    "Test invalid image error",
    "Verify error messages are user-friendly",
    "Verify error messages disappear after appropriate time"
  ],

  upgradeFlow: [
    "Hit rate limit as free user",
    "Verify upgrade prompt appears",
    "Click upgrade button",
    "Verify redirect to payment page",
    "Test post-upgrade rate limits"
  ]
}; 