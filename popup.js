let sweepButton = document.getElementById("sweep");
sweepButton.onclick = function () {
    chrome.tabs.query({}, function (tabs) {
        const remove_urls = ["chrome://newtab/"];

        for (let tab of tabs) {
            if (remove_urls.includes(tab.url)) {
                chrome.tabs.remove(tab.id);
            }
            remove_urls.push(tab.url);
        }
    });
};

let orderlyButton = document.getElementById("orderly");
orderlyButton.onclick = function () {
    chrome.tabs.query({pinned: false}, function (tabs) {
        const indexes = tabs.map(tab => tab.index);
        tabs.sort(function (a, b) {
            return a.url >= b.url ? 1 : -1;
        });
        const numberOfTabs = tabs.length;
        for (let i = 0; i < numberOfTabs; i++) {
            chrome.tabs.move(tabs[i].id, {index: indexes[i]});
        }
    });
};

document.getElementById("merge").onclick = function () {
    chrome.windows.getCurrent({windowTypes: ["normal"]}, window => {
        chrome.tabs.query({}, function(tabs) {
            tabs.forEach(tab => {
                chrome.tabs.move(tab.id, {windowId: window.id, index: tab.index});
            });
        });
    });
};

document.getElementById("remove-parent-and-child").onclick = function () {
    chrome.tabs.query({"active": true}, function(tabs) {
        let tab = tabs[0];
        chrome.tabs.remove(tab.id);
        if (tab.openerTabId) {
            chrome.tabs.remove(tab.openerTabId);
        }
    });
};


