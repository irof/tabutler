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

    var tabMap = new Map();
    var childrenMap = new Map();

    var removeChildren = function(id) {
        chrome.tabs.remove(id);
        let children = childrenMap.get(id);
        if (children) {
            children.forEach(childId => {
                removeChildren(childId);
            });
        }
    };

    chrome.tabs.query({}, function(tabs) {
        tabs.forEach(tab => {
            tabMap.set(tab.id, tab.openerTabId);
            let children = childrenMap.get(tab.openerTabId);
            if (!children) {
                children = new Array();
                childrenMap.set(tab.openerTabId, children);
            }
            children.push(tab.id);
        });
    });

    chrome.tabs.query({"active": true}, function(tabs) {
        let id = tabs[0].id;
        while(id) {
            let openerId = tabMap.get(id);
            if (!openerId) {
                break;
            }
            id = openerId;
        }
        removeChildren(id);
    });
};


