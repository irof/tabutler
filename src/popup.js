// sort
document.getElementById("sort").addEventListener("click", (e) => {
});

// grouping
document.getElementById("grouping").addEventListener("click", async () => {

    const rules = [
        {
            title: "MDN",
            urlPatterns: [
                "https://developer.mozilla.org/*"
            ]
        },
        {
            title: "ChromeDev",
            urlPatterns: [
                "https://developer.chrome.com/*"
            ]
        },
        {
            title: "検索",
            urlPatterns: [
                "https://www.google.com/*",
                "https://www.google.co.jp/*"
            ]
        }
    ];

    const pinnedLastIndex = Math.max(...(await chrome.tabs.query({pinned: true})).map(tab => tab.index));
    const tabGroupsIndex = pinnedLastIndex >= 0 ? pinnedLastIndex + 1 : 0;

    rules.reverse().forEach(rule => {
        const title = rule.title;
        chrome.tabGroups.query({title}, groups => {
            chrome.tabs.query({
                pinned: false,
                groupId: chrome.tabGroups.TAB_GROUP_ID_NONE,
                url: rule.urlPatterns
            }, result => {
                const tabIds = result.map(tab => tab.id);
                if (tabIds.length <= 0) return;
                if (groups.length > 0) {
                    // すでにあるgroupに追加する
                    chrome.tabs.group({groupId: groups[0].id, tabIds});
                } else {
                    // 新しくgroupを作る
                    chrome.tabs.group({tabIds}, groupId => {
                        chrome.tabGroups.update(groupId, {title, collapsed: true});
                        chrome.tabGroups.move(groupId, {index: tabGroupsIndex});
                    });
                }
            });
        });
    });
});

// sweep
document.getElementById("sweep").addEventListener("click", async () => {
    const timestamp = Date.now().toString();

    chrome.tabs.query({url: "chrome://newtab/", active: false}, removeTabs => {
        if (removeTabs.length === 0) return;
        chrome.tabs.remove(removeTabs.map(tab => tab.id), () => {
            chrome.storage.local.get("removed", obj => {
                if (!obj.removed) obj.removed = {};

                obj.removed[timestamp] = removeTabs.map(tab => {
                    return {
                        title: tab.title,
                        url: tab.url
                    }
                });

                chrome.storage.local.set(obj);
            });
        });
    });
});
document.getElementById("clear_sweep_history").addEventListener("click", async () => {
    await chrome.storage.local.set({removed: {}});
});

const sweptTemplate = document.getElementById("swept_template");
chrome.storage.local.get("removed", obj => {

    Object.entries(obj.removed).forEach(([timestamp, sweptTabs]) => {
        const element = sweptTemplate.content.firstElementChild.cloneNode(true);

        element.querySelector("h2").textContent = new Date(parseInt(timestamp)).toLocaleString();
        const ulElement = element.querySelector("ul");
        const liTemplate = ulElement.querySelector("li");
        sweptTabs.forEach((tab) => {
            const liElement = liTemplate.cloneNode(true);
            const aElement = liElement.querySelector("a");
            aElement.href = tab.url;
            aElement.textContent = tab.title;
            ulElement.append(liElement);
        });
        liTemplate.remove();

        document.getElementById("sweep_history").append(element);
    });
});
