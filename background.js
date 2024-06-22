chrome.runtime.onInstalled.addListener(() => {
    console.log("Terminal Search Extension installed.");
  });
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getHistory') {
      chrome.history.search({text: '', maxResults: 100}, function(data) {
        sendResponse({history: data});
      });
      return true;  // Will respond asynchronously.
    }
  });