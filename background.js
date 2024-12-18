// background.js
let isActive = false;

chrome.action.onClicked.addListener(async (tab) => {
  try {
    await chrome.tabs.sendMessage(tab.id, {action: "toggle"});
  } catch (error) {
    console.error('Error sending message:', error);
  }
});

chrome.runtime.onMessage.addListener((request, sender) => {
  if (request.action === "updateIcon") {
    isActive = request.isActive;
    chrome.action.setIcon({
      path: isActive ? {
        "16": "icons/active-16.png",
        "32": "icons/active-32.png",
        "48": "icons/active-48.png",
        "128": "icons/active-128.png"
      } : {
        "16": "icons/inactive-16.png",
        "32": "icons/inactive-32.png",
        "48": "icons/inactive-48.png",
        "128": "icons/inactive-128.png"
      },
      tabId: sender.tab.id
    });
  }
});