document.addEventListener('DOMContentLoaded', function() {
  const commandInput = document.getElementById('command-input');
  const historyDiv = document.getElementById('history');
  const lastLogin = document.getElementById('last-login');

  // Set last login date
  const now = new Date();
  lastLogin.innerText = `Last Login: ${now.toDateString()} ${now.toTimeString()}`;

  // Load history from storage
  chrome.storage.local.get(['commandHistory'], function(result) {
    if (result.commandHistory) {
      result.commandHistory.forEach(command => {
        addHistoryItem(command);
      });
    }
  });

  let searchEngine = 'https://www.google.com/search?q=';
  let addEngineStep = 0;
  let customEngineName = '';

  // Ensure the input field is focused
  setTimeout(() => {
    commandInput.focus();
  }, 100);

  commandInput.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
      const command = commandInput.value;
      if (command.trim() !== '') {
        handleCommand(command);
        commandInput.value = '';
      }
    }
  });

  function handleCommand(command) {
    if (addEngineStep === 1) {
      customEngineName = command;
      addHistoryItem(`Name: ${customEngineName}`);
      addHistoryItem('Enter the search URL of the engine:');
      addEngineStep = 2;
    } else if (addEngineStep === 2) {
      const engineUrl = command;
      addHistoryItem(`URL: ${engineUrl}`);
      chrome.storage.local.get(['customEngines'], function(result) {
        const customEngines = result.customEngines || {};
        customEngines[customEngineName] = engineUrl;
        chrome.storage.local.set({customEngines: customEngines});
      });
      addHistoryItem(`Added custom search engine ${customEngineName}`);
      addEngineStep = 0;
    } else {
      // Add command to history in UI
      addHistoryItem(command);

      if (command === '$clear history') {
        // Clear history in Chrome storage
        chrome.storage.local.set({commandHistory: []});

        // Clear history in UI
        while (historyDiv.firstChild) {
          historyDiv.removeChild(historyDiv.firstChild);
        }
      } else if (command.startsWith('$font ')) {
        // Adjust font size
        const fontSize = command.split(' ')[1];
        historyDiv.style.fontSize = `${fontSize}%`;
      } else if (command === '$help') {
        // Display help information
        const helpText = `
          Available commands:<br>
          $clear history - Clears the command history.<br>
          $font {number} - Adjusts the font size to {number}%. Default is 100%.<br>
          $help - Displays this help information.<br>
          $engine - Changes the search engine.<br>
          $engine add - Adds a custom search engine.<br>
          Any other text - Performs a search.
        `;
        addHistoryItem(helpText);
      } else if (command === '$engine') {
        // Change search engine
        chrome.storage.local.get(['customEngines'], function(result) {
          let customEnginesText = '';
          for (let engine in result.customEngines) {
            customEnginesText += `${engine}<br>`;
          }
          const engineText = `
            Available search engines:<br>
            google<br>
            bing<br>
            yahoo<br>
            perplexity<br>
            yandex<br>
            duckduckgo<br>
            ${customEnginesText}
            Enter the name of the search engine to switch to it.
          `;
          addHistoryItem(engineText);
        });
      } else if (command === '$engine add') {
        // Add custom search engine
        addHistoryItem('Enter the name of the search engine:');
        addEngineStep = 1;
      } else if (
        command === 'google' || command === 'bing' || command === 'yahoo' || command === 'perplexity' || command === 'yandex' || command === 'duckduckgo'
      ) {
        // Set predefined search engine
        switch (command) {
          case 'google':
            searchEngine = 'https://www.google.com/search?q=';
            break;
          case 'bing':
            searchEngine = 'https://www.bing.com/search?q=';
            break;
          case 'yahoo':
            searchEngine = 'https://search.yahoo.com/search?p=';
            break;
          case 'perplexity':
            searchEngine = 'https://www.perplexity.ai/search?q=';
            break;
          case 'yandex':
            searchEngine = 'https://yandex.com/search/?text=';
            break;
          case 'duckduckgo':
            searchEngine = 'https://duckduckgo.com/?q=';
            break;
        }
        addHistoryItem(`Search engine switched to ${command}`);
      } else if (command.startsWith('$history ')) {
        const days = parseInt(command.split(' ')[1]);
        if (!isNaN(days)) {
          showHistory(days);
        } else {
          addHistoryItem('Invalid number of days for history.');
        }
      } else {
        // Check if command matches a custom search engine
        chrome.storage.local.get(['customEngines'], function(result) {
          const customEngines = result.customEngines || {};
          if (customEngines[command]) {
            searchEngine = customEngines[command];
            addHistoryItem(`Search engine switched to ${command}`);
          } else {
            // Store command in Chrome storage
            chrome.storage.local.get(['commandHistory'], function(result) {
              const commandHistory = result.commandHistory || [];
              commandHistory.push(command);
              chrome.storage.local.set({commandHistory: commandHistory});
            });

            // Execute search
            executeSearch(command);
          }
        });
      }
    }
  }

  function addHistoryItem(command) {
    const commandElement = document.createElement('div');
    const now = new Date();
    const timestamp = now.toLocaleString();
    let commandClass = '';
    if (command.startsWith('$')) {
        commandClass = 'dollar-command';
    }
    commandElement.innerHTML = `<span class="prompt">➜</span> <span class="${commandClass}">${command}</span> <span class="timestamp">[${timestamp}]</span>`;
    historyDiv.appendChild(commandElement);
}

  function executeSearch(query) {
    const searchUrl = `${searchEngine}${encodeURIComponent(query)}`;
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      chrome.tabs.update(tabs[0].id, { url: searchUrl });
    });
  }

  function showHistory(days) {
    addHistoryItem(`SHOWING HISTORY FOR PAST ${days} DAYS`, true);
    const startTime = Date.now() - (days * 24 * 60 * 60 * 1000);
    chrome.history.search({ text: '', startTime: startTime, maxResults: 1000 }, function(results) {
      if (results.length > 0) {
        results.forEach(historyItem => {
          addHistoryItem(`Title: ${historyItem.title}, URL: ${historyItem.url}`);
        });
      } else {
        addHistoryItem('No history found for the specified period.');
      }
    });
  }

  function updateInfoPanel() {
    const dateTimeElement = document.getElementById('date-time');
  
    // Update date and time
    setInterval(() => {
      const now = new Date();
      dateTimeElement.innerText = now.toLocaleString();
    }, 1000); // Update every second
  }

  updateInfoPanel();
});


