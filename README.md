# Terminal New Tab Extension (_earch)

A Chrome extension that replaces your new tab page with a terminal-like interface. This interface allows you to quickly perform web searches, manage browser tabs, access history and bookmarks, and more, all using command-line inputs.

## Features

*   **Terminal Interface:** Replaces the standard new tab page with a functional, retro-themed terminal.
*   **Customizable Search:**
    *   Supports predefined search engines: Google (default), Bing, DuckDuckGo, Yandex, Perplexity.
    *   Switch engines easily using `$engine <name>` or by directly typing the engine's name.
    *   Add your own custom search engines using the `$engine add` command.
*   **Quick Search:**
    *   Type any text not recognized as a command to search the web using the current engine in the current tab.
    *   Use `search <query>` to perform a search in a new tab.
*   **Browser Navigation & Management:**
    *   `open <url>`: Opens specified URLs in new tabs.
    *   `tabs list`: Lists all open tabs with their IDs and titles.
    *   `tabs close <id_or_keyword>`: Closes tabs by ID or a keyword in their title/URL.
    *   `tabs open <url>`: An alias for `open <url>`.
    *   `history`: Displays the last 20 visited sites from your browser history.
    *   `$history <days>`: Shows browser history for a specified number of past days.
    *   `bookmarks <term>`: Searches your browser bookmarks.
*   **Command History:**
    *   Keeps a history of typed commands.
    *   `$clear history`: Clears the displayed command history.
*   **Customizable Appearance:**
    *   `$font <size%>`: Adjusts the font size of the terminal display.
*   **Help System:**
    *   `$help`: Displays a comprehensive list of all available commands and their usage.
*   **Persistent Settings:** Command history and chosen search engine (including custom ones) are saved across sessions.
*   **Visuals:** Includes a blinking cursor, timestamped commands, and a retro terminal aesthetic. The info panel displays the current date/time and your last login time.

## Available Commands

The following commands are available in the terminal. For commands requiring arguments, `<argument>` is enclosed in angle brackets.

| Command                          | Description                                                                                                |
|----------------------------------|------------------------------------------------------------------------------------------------------------|
| `search <query>`                 | Searches the web for `<query>` in a **new tab** using the current search engine.                           |
| `<text_not_a_command>`           | (Default action) Searches for the entered text in the **current tab** using the current search engine.     |
| `open <url>`                     | Opens the specified URL (e.g., `google.com`) in a new tab.                                                 |
| `tabs list`                      | Lists all currently open tabs with their IDs, titles, and URLs.                                            |
| `tabs close <id_or_keyword>`     | Closes the tab with the given ID or the first tab found matching the keyword in its title or URL.        |
| `tabs open <url>`                | Same as `open <url>`.                                                                                      |
| `history`                        | Displays the last 20 visited sites from your browser history.                                              |
| `bookmarks <term>`               | Searches your browser bookmarks for `<term>`.                                                                |
| `$engine`                        | Lists available search engines (predefined and custom) and indicates the currently active one.               |
| `$engine <name>`                 | Switches the active search engine to `<name>` (e.g., `google`, `bing`, or a custom engine name).             |
| `<engine_name>`                  | (Directly) Switches the active search engine to `<engine_name>` if it's a known predefined or custom engine. |
| `$engine add`                    | Starts an interactive process to add a new custom search engine.                                             |
| `$clear history`                 | Clears the command history displayed within the terminal.                                                  |
| `$font <size%>`                  | Adjusts the font size of the terminal display (e.g., `$font 120` for 120%).                                |
| `$history <days>`                | Shows browser history for the specified number of past `<days>`.                                             |
| `$help`                          | Displays this list of available commands and their descriptions.                                             |

## Installation / How to Use

1.  **Download/Clone:** Obtain the extension files (manifest.json, popup.html, popup.css, popup.js).
2.  **Open Chrome Extensions:** Navigate to `chrome://extensions` in your Chrome browser.
3.  **Enable Developer Mode:** Ensure the "Developer mode" toggle (usually in the top right corner) is switched on.
4.  **Load Unpacked:** Click the "Load unpacked" button.
5.  **Select Folder:** Browse to and select the directory containing the extension's files.
6.  **New Tab:** The extension should now be active. Open a new tab (`Ctrl+T` or `Cmd+T`) to see the terminal interface.
7.  **Type Commands:** Use the input field to type any of the commands listed above or type `$help` in the terminal to see the list.

Enjoy your enhanced new tab experience!
