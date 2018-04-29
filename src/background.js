chrome.tabs.onCreated.addListener(tab => {
    const tab_time_key = "tab_" + tab.id;
    const tab_time = {};
    tab_time[tab_time_key] = Date.now();
    chrome.storage.local.set(tab_time);
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
    chrome.storage.local.remove("tab_" + tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url) {
        const tab_time_key = "tab_" + tabId;
        const tab_time = {};
        tab_time[tab_time_key] = Date.now();
        chrome.storage.local.set(tab_time);
    }
});