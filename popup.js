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
    chrome.tabs.query({}, function (tabs) {
        tabs.sort(function (a, b) {
            return a.url >= b.url ? 1 : -1;
        });
        const numberOfTabs = tabs.length;
        for (let i = 0; i < numberOfTabs; i++) {
            chrome.tabs.move(tabs[i].id, {index: i});
        }
    });
};


