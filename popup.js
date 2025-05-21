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
      const commandString = commandInput.value;
      if (commandString.trim() !== '') {
        addHistoryItem(commandString); // Add raw command to history UI first
        handleCommand(commandString);
        commandInput.value = '';
        commandInput.focus(); // Ensure focus after command execution
      }
    }
  });

  // --- Command Handlers ---
  function handleClearHistory() {
    chrome.storage.local.set({commandHistory: []});
    while (historyDiv.firstChild) {
      historyDiv.removeChild(historyDiv.firstChild);
    }
    addHistoryItem('Command history cleared.');
  }

  function handleSetFont(args) {
    const fontSize = args[0];
    if (fontSize && !isNaN(fontSize)) {
      historyDiv.style.fontSize = `${fontSize}%`;
      addHistoryItem(`Font size set to ${fontSize}%.`);
    } else {
      addHistoryItem('Usage: $font <size_percentage>');
    }
  }

  function handleHelp() {
    const helpText = `
      <span class="dollar-command">Available Commands:</span><br>
      -------------------------------------------------------------<br>
      <span class="prompt">$clear history</span> - Clears the command history.<br>
      <span class="prompt">$font &lt;size%&gt;</span> - Adjusts font size (e.g., <span class="dollar-command">$font 120</span>).<br>
      <span class="prompt">$engine</span> - Lists available search engines.<br>
      <span class="prompt">$engine &lt;name&gt;</span> - Switches to the specified engine (e.g., <span class="dollar-command">$engine google</span>).<br>
      <span class="prompt">$engine add</span> - Starts the process to add a custom search engine.<br>
      <span class="prompt">$history &lt;days&gt;</span> - Shows browser history for the last &lt;days&gt; (e.g., <span class="dollar-command">$history 7</span>).<br>
      <span class="prompt">open &lt;url&gt;</span> - Opens URL in a new tab (e.g., <span class="dollar-command">open google.com</span>).<br>
      <span class="prompt">search &lt;query&gt;</span> - Searches with current engine in a new tab.<br>
      <span class="prompt">history</span> - Shows the last 20 visited sites from browser history.<br>
      <span class="prompt">bookmarks &lt;term&gt;</span> - Searches bookmarks for &lt;term&gt;.<br>
      <span class="prompt">tabs list</span> - Lists all open tabs.<br>
      <span class="prompt">tabs close &lt;id_or_keyword&gt;</span> - Closes a tab by ID or keyword.<br>
      <span class="prompt">tabs open &lt;url&gt;</span> - Opens a URL in a new tab (alias for 'open').<br>
      <span class="prompt">help</span> - Displays this help information.<br>
      -------------------------------------------------------------<br>
      Typing the name of a known search engine (e.g. <span class="dollar-command">google</span>, <span class="dollar-command">bing</span>, or a custom name)<br>
      will also switch to that search engine.<br>
      Any other text performs a search with the current engine in the current tab.
    `;
    addHistoryItem(helpText, true); // Pass true to indicate preformatted HTML
  }

  function handleChangeEngine(args) {
    const engineName = args[0];
    const predefinedEngines = {
      'google': 'https://www.google.com/search?q=',
      'bing': 'https://www.bing.com/search?q=',
      'yahoo': 'https://search.yahoo.com/search?p=',
      'perplexity': 'https://www.perplexity.ai/search?q=',
      'yandex': 'https://yandex.com/search/?text=',
      'duckduckgo': 'https://duckduckgo.com/?q='
    };

    if (!engineName) { // User typed just "$engine"
      chrome.storage.local.get(['customEngines', 'searchEngine'], function(result) {
      const current = result.searchEngine || searchEngine;
      let output = '<span class="dollar-command">Available search engines:</span><br>';
      output += '--------------------------<br>';
      for (const name in predefinedEngines) {
        output += `${name}${predefinedEngines[name] === current ? ' (current)' : ''}<br>`;
      }
      if (result.customEngines) {
        for (const name in result.customEngines) {
        output += `${name}${result.customEngines[name] === current ? ' (current)' : ''}<br>`;
        }
      }
      output += '--------------------------<br>';
      output += 'To switch, type: <span class="prompt">$engine &lt;name&gt;</span> (e.g., <span class="dollar-command">$engine google</span>)<br>';
      output += 'Or simply type the engine name directly (e.g., <span class="dollar-command">google</span>).';
      addHistoryItem(output, true);
      });
      return;
    }

    // User typed "$engine <name>"
    if (predefinedEngines[engineName]) {
      searchEngine = predefinedEngines[engineName];
      chrome.storage.local.set({searchEngine: searchEngine});
      addHistoryItem(`Search engine changed to: ${engineName}.`);
    } else {
      chrome.storage.local.get(['customEngines'], function(result) {
        const customEngines = result.customEngines || {};
        if (customEngines[engineName]) {
          searchEngine = customEngines[engineName];
          chrome.storage.local.set({searchEngine: searchEngine});
          addHistoryItem(`Search engine changed to: ${engineName}.`);
        } else {
          addHistoryItem(`Error: Search engine '${engineName}' not found.`);
        }
      });
    }
  }

  function handleAddEngineStart() {
    addHistoryItem('Enter the name for the new search engine:');
    addEngineStep = 1;
  }
  
  function handleLegacyHistory(args) {
    const days = parseInt(args[0]);
    if (!isNaN(days)) {
      showLegacyHistory(days); // Renamed original showHistory
    } else {
      addHistoryItem('Usage: $history <number_of_days>');
    }
  }

  // --- New Command Handlers ---
  function handleOpen(args) {
    const url = args.join(' ');
    if (!url) {
      addHistoryItem('Usage: open &lt;url&gt;'); // Use HTML entity for < >
      return;
    }
    let fullUrl = url;
    if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
      fullUrl = `https://${fullUrl}`;
    }
    chrome.tabs.create({ url: fullUrl });
    addHistoryItem(`Opening ${fullUrl}...`);
  }

  function handleSearch(args) {
    const query = args.join(' ');
    if (!query) {
      addHistoryItem('Usage: search &lt;query&gt;');
      return;
    }
    addHistoryItem(`Searching for "${query}" in new tab...`);
    executeSearch(query, true); // Pass true to open in new tab
  }

  function handleShowHistory() { // No args for now, shows last 20
    addHistoryItem('Last 20 visited sites (from browser history):', true);
    chrome.history.search({text: '', maxResults: 20}, function(results) {
      if (results && results.length > 0) {
        results.forEach((item, index) => {
          addHistoryItem(`[${index + 1}] ${item.title || 'No Title'} - ${item.url}`, true);
        });
      } else {
        addHistoryItem('No browser history found.', false);
      }
    });
  }

  function handleSearchBookmarks(args) {
    const searchTerm = args.join(' ');
    if (!searchTerm) {
      addHistoryItem('Usage: bookmarks &lt;search_term&gt;');
      return;
    }
    addHistoryItem(`Searching bookmarks for "${searchTerm}":`, true);
    chrome.bookmarks.search(searchTerm, function(results) {
      if (results && results.length > 0) {
        let count = 0;
        results.forEach((item) => {
          if (item.url) { // Only show items with URLs (not folders)
            addHistoryItem(`[${count + 1}] ${item.title || 'No Title'} - ${item.url}`, true);
            count++;
          }
        });
        if (count === 0) {
            addHistoryItem(`No bookmarks with URLs found matching "${searchTerm}".`, false);
        }
      } else {
        addHistoryItem(`No bookmarks found matching "${searchTerm}".`, false);
      }
    });
  }

  function handleListTabs() {
    addHistoryItem('Open tabs:', true);
    chrome.tabs.query({}, function(tabs) {
      if (tabs && tabs.length > 0) {
        tabs.forEach(tab => {
          addHistoryItem(`[${tab.id}] ${tab.title || 'No Title'} - ${tab.url}`, true);
        });
      } else {
        addHistoryItem('No tabs open.', false);
      }
    });
  }

  function handleCloseTab(args) {
    const identifier = args.join(' ');
    if (!identifier) {
      addHistoryItem('Usage: tabs close &lt;id_or_keyword&gt;');
      return;
    }

    if (!isNaN(identifier)) { // Is a number, assume tab ID
      const tabId = parseInt(identifier);
      chrome.tabs.remove(tabId, function() {
        if (chrome.runtime.lastError) {
          addHistoryItem(`Error closing tab ${tabId}: ${chrome.runtime.lastError.message}`);
        } else {
          addHistoryItem(`Tab ${tabId} closed.`);
        }
      });
    } else { // Is a keyword
      chrome.tabs.query({}, function(tabs) {
        const matchingTabs = tabs.filter(tab => 
          (tab.title && tab.title.toLowerCase().includes(identifier.toLowerCase())) ||
          (tab.url && tab.url.toLowerCase().includes(identifier.toLowerCase()))
        );

        if (matchingTabs.length === 1) {
          const tabToClose = matchingTabs[0];
          chrome.tabs.remove(tabToClose.id, () => {
             addHistoryItem(`Closed tab: "${tabToClose.title || tabToClose.url}" (ID: ${tabToClose.id})`);
          });
        } else if (matchingTabs.length > 1) {
          addHistoryItem(`Multiple tabs found for "${identifier}". Please use tab ID to close:`, true);
          matchingTabs.forEach(tab => {
            addHistoryItem(`[${tab.id}] ${tab.title || 'No Title'} - ${tab.url}`, true);
          });
        } else {
          addHistoryItem(`No tab found matching "${identifier}".`);
        }
      });
    }
  }

  const commands = {
    // Note: '$clear history' is handled as a special case due to two-word command
    '$font': { func: handleSetFont, argsRequired: 1 },
    '$help': { func: handleHelp, argsRequired: 0 },
    '$engine': { func: handleChangeEngine, argsRequired: 0 }, // Handles listing and setting
    '$history': { func: handleLegacyHistory, argsRequired: 1 }, // Old history command ($history <days>)
    'open': { func: handleOpen, argsRequired: 1 },
    'search': { func: handleSearch, argsRequired: 1 },
    'history': { func: handleShowHistory, argsRequired: 0 }, // New history command (shows last 20)
    'bookmarks': { func: handleSearchBookmarks, argsRequired: 1 },
    // 'tabs' commands are handled by checking 'tabs' as commandKey and then the next arg for sub-command
  };
  
  // Sub-commands for 'tabs'
  const tabSubCommands = {
    'list': handleListTabs,
    'close': handleCloseTab,
    'open': handleOpen, // Alias for 'open <url>'
  };

  function handleCommand(commandString) {
    const [commandName, ...args] = commandString.trim().split(' ');
    const commandKey = commandName.toLowerCase();
    const predefinedEngines = { // Keep this in sync with handleChangeEngine
      'google': 'https://www.google.com/search?q=',
      'bing': 'https://www.bing.com/search?q=',
      'yahoo': 'https://search.yahoo.com/search?p=',
      'perplexity': 'https://www.perplexity.ai/search?q=',
      'yandex': 'https://yandex.com/search/?text=',
      'duckduckgo': 'https://duckduckgo.com/?q='
    };

    // Store command in Chrome storage (excluding $engine add steps and empty commands)
    if (addEngineStep === 0 && commandString.trim() !== '') {
      chrome.storage.local.get(['commandHistory'], function(result) {
        let commandHistory = result.commandHistory || [];
        if (commandHistory.length === 0 || commandHistory[commandHistory.length - 1] !== commandString) {
          commandHistory.push(commandString);
        }
        // Keep only the last 500 entries to prevent unbounded growth
        if (commandHistory.length > 500) {
          commandHistory = commandHistory.slice(-500);
        }
        chrome.storage.local.set({commandHistory: commandHistory});
      });
    }

    if (addEngineStep === 1) { 
      customEngineName = commandString.trim(); // User entered the name for the new engine
      addHistoryItem(`Enter the search URL for ${customEngineName} (use %s where the query should go):`);
      addEngineStep = 2;
    } else if (addEngineStep === 2) {
      const engineUrl = commandString.trim(); // User entered the URL
      chrome.storage.local.get(['customEngines'], function(result) {
        const customEngines = result.customEngines || {};
        customEngines[customEngineName] = engineUrl;
        chrome.storage.local.set({customEngines: customEngines, searchEngine: engineUrl}, () => { // Also set as current
            addHistoryItem(`Added custom search engine: ${customEngineName}.`);
            searchEngine = engineUrl; 
            addHistoryItem(`Switched to new engine: ${customEngineName}.`);
        });
      });
      addEngineStep = 0;
      customEngineName = '';
    } else if (commandKey === '$engine' && args[0] && args[0].toLowerCase() === 'add') {
        handleAddEngineStart();
    } else if (commandKey === '$clear' && args.length > 0 && args[0].toLowerCase() === 'history') {
        handleClearHistory();
    } else if (commandKey === 'tabs' && args[0] && tabSubCommands[args[0].toLowerCase()]) {
        tabSubCommands[args[0].toLowerCase()](args.slice(1));
    } else if (commands[commandKey]) {
        commands[commandKey].func(args);
    } else if (predefinedEngines[commandKey]) { // Direct typing of a predefined engine name
        searchEngine = predefinedEngines[commandKey];
        chrome.storage.local.set({searchEngine: searchEngine});
        addHistoryItem(`Search engine changed to: ${commandKey}.`);
    } else { // Check if it's a custom engine name or default to search
        chrome.storage.local.get(['customEngines'], function(result) {
            const customEngines = result.customEngines || {};
            if (customEngines[commandKey]) {
                searchEngine = customEngines[commandKey];
                chrome.storage.local.set({searchEngine: searchEngine});
                addHistoryItem(`Search engine changed to: ${commandKey}.`);
            } else {
                addHistoryItem(`Searching for "${commandString}" in current tab...`);
                executeSearch(commandString, false);
            }
        });
    }
  }

  function addHistoryItem(text, isPreformatted = false) {
    const itemElement = document.createElement('div');
    const now = new Date();
    const timestamp = now.toLocaleString();
    let itemClass = '';

    // Heuristic to identify system messages that should use 'dollar-command' style
    const systemMessageKeywords = [
        '$', 'Usage:', 'Error:', 'Available', 'Last 20', 'Searching', 
        'Open tabs', 'Custom search engine', 'Switched to new engine', 
        'Set engine', 'Font size set', 'Command history cleared', 'Opening', 
        'Tab', 'Closed tab', 'Multiple tabs', 'No tab', 'Enter the name', 
        'Enter the search URL', 'Added custom search engine', 'Search engine changed to'
    ];
    if (systemMessageKeywords.some(keyword => text.startsWith(keyword))) {
        itemClass = 'dollar-command'; 
    }

    if (isPreformatted) {
      // Sanitize HTML using DOMPurify if available, otherwise fallback to textContent
      if (window.DOMPurify && typeof window.DOMPurify.sanitize === 'function') {
        itemElement.innerHTML = window.DOMPurify.sanitize(text);
      } else {
        // Fallback: treat as plain text if DOMPurify is not available
        itemElement.textContent = text;
      }
    } else {
      // Sanitize text to prevent accidental HTML injection if not preformatted
      const sanitizedText = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const promptSpan = document.createElement('span');
      promptSpan.className = 'prompt';
      promptSpan.textContent = '➜';

      const textSpan = document.createElement('span');
      if (itemClass) textSpan.className = itemClass;
      textSpan.textContent = sanitizedText;

      const timestampSpan = document.createElement('span');
      timestampSpan.className = 'timestamp';
      timestampSpan.textContent = `[${timestamp}]`;

      itemElement.appendChild(promptSpan);
      itemElement.appendChild(document.createTextNode(' '));
      itemElement.appendChild(textSpan);
      itemElement.appendChild(document.createTextNode(' '));
      itemElement.appendChild(timestampSpan);
    }

    historyDiv.appendChild(itemElement);
    historyDiv.scrollTop = historyDiv.scrollHeight; // Auto-scroll to bottom
  }

  function executeSearch(query, newTab = false) {
    chrome.storage.local.get('searchEngine', function(data) {
      const currentSearchEngine = data.searchEngine || 'https://www.google.com/search?q='; // Fallback to Google
      const searchUrl = currentSearchEngine.includes('%s')
        ? currentSearchEngine.replace('%s', encodeURIComponent(query))
        : `${currentSearchEngine}${encodeURIComponent(query)}`;
      if (newTab) {
        chrome.tabs.create({ url: searchUrl });
      } else {
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
          if (tabs.length > 0 && tabs[0].id) {
            chrome.tabs.update(tabs[0].id, { url: searchUrl });
          } else {
            chrome.tabs.create({ url: searchUrl }); 
          }
        });
      }
    });
  }

  function showLegacyHistory(days) { 
    addHistoryItem(`Showing browsing history for the past ${days} day(s):`);
    const startTime = Date.now() - (days * 24 * 60 * 60 * 1000);
    chrome.history.search({ text: '', startTime: startTime, maxResults: 1000 }, function(results) {
      if (results && results.length > 0) {
        results.forEach(historyItem => {
          const date = new Date(historyItem.lastVisitTime).toLocaleString();
          addHistoryItem(`[${date}] ${historyItem.title || 'No Title'} - ${historyItem.url}`, true);
        });
      } else {
        addHistoryItem('No browser history found for the specified period.');
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


