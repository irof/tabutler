let queryOptions = {};
const tabs = await chrome.tabs.query(queryOptions);
const groups = await chrome.tabGroups.query({});

// sort
document.getElementById("sort").addEventListener("click", (e) => {
});

// grouping
document.getElementById("grouping").addEventListener("click", async () => {

    const rules = [
        {
            title: "MDN",
            type: "HOST",
            condition: "developer.mozilla.org"
        },
        {
            title: "ChromeDev",
            type: "HOST",
            condition: "developer.chrome.com"
        },
        {
            title: "検索",
            type: "HOST",
            condition: "www.google.com"
        },
        {
            title: "検索",
            type: "HOST",
            condition: "www.google.co.jp"
        }
    ];

    const groupings = {};
    rules.forEach(rule => groupings[rule.title] = []);

    tabs
        // ピンされていないものを対象に
        .filter(tab => !tab.pinned)
        // グルーピングされていないものを対象に
        .filter(tab => tab.groupId === chrome.tabGroups.TAB_GROUP_ID_NONE)
        .forEach(tab => rules.forEach(rule => {
            if (rule.type === "HOST") {
                if (rule.condition === new URL(tab.url).host) {
                    groupings[rule.title].push(tab.id);
                }
            }
        }));

    const pinnedLastIndex= Math.max(...(await chrome.tabs.query({pinned: true})).map(tab => tab.index));
    const tabGroupsIndex = pinnedLastIndex > 0 ? pinnedLastIndex + 1 : 0;

    Object.entries(groupings).forEach(([title, value]) => {
        const tabIds = value;
        if (tabIds.length > 0) {
            chrome.tabGroups.query({title}, groups => {
                if (groups.length > 0) {
                    // すでにあるgroupに追加する
                    chrome.tabs.group({groupId: groups[0].id, tabIds})
                } else {
                    // 新しくgroupを作る
                    chrome.tabs.group({tabIds}, groupId => {
                        chrome.tabGroups.update(groupId, {title});
                    });
                }
            });
        }
    });

    chrome.tabGroups.query({}, tabGroups => {
        tabGroups.forEach(tabGroup => {
            const groupId = tabGroup.id;
            chrome.tabGroups.update(groupId, {collapsed: true});
            chrome.tabGroups.move(groupId, {index: tabGroupsIndex});
        });
    })
});

// sweep
document.getElementById('sweep').addEventListener('click', async () => {
    const timestamp = Date.now().toString();

    tabs.filter(tab => {
        // closeする条件をつめる
        return tab.url === "chrome://newtab/"
    }).forEach(tab => {
        chrome.tabs.remove(tab.id, () => {
            localStorage.setItem(timestamp, tab.url);
        });
    });
});