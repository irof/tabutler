async function getGroupingRuleDescription() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get("grouping_rule_description", (result) => {
            if (chrome.runtime.lastError) {
                return reject(chrome.runtime.lastError);
            }
            const jsonObj = result.grouping_rule_description ? JSON.parse(result.grouping_rule_description) : {};
            resolve(jsonObj);
        });
    });
}

const groupingRuleDescriptionTextarea = document.getElementById("grouping_rule_description");
// 現在設定されているルールを出力する
getGroupingRuleDescription().then(result => {
    groupingRuleDescriptionTextarea.value = JSON.stringify(result, null, 2);
});

const groupingRuleSaveButton = document.getElementById("grouping_rule_save");
groupingRuleSaveButton.addEventListener("click", () => {
    const description = groupingRuleDescriptionTextarea.value;

    try {
        JSON.parse(description);
        // saveボタンのclassからwarningを取り除く
        groupingRuleSaveButton.classList.remove("warning");
        groupingRuleDescriptionTextarea.classList.remove("warning");

        chrome.storage.local.set({"grouping_rule_description": description});
    } catch (error) {
        console.log(error);
        // saveボタンのclassにwarningを追加する
        groupingRuleSaveButton.classList.add("warning");
        groupingRuleDescriptionTextarea.classList.add("warning");
    }
});

// sort
document.getElementById("sort").addEventListener("click", () => {
});

// grouping
document.getElementById("grouping").addEventListener("click", async () => {

    const pinnedLastIndex = Math.max(...(await chrome.tabs.query({pinned: true})).map(tab => tab.index));
    const tabGroupsIndex = pinnedLastIndex >= 0 ? pinnedLastIndex + 1 : 0;

    /* [ { "title": "MDN", "urlPatterns": [ "https://developer.mozilla.org/*" ] } ] */
    const rules = await getGroupingRuleDescription();
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

function executeSweep(timestamp, sweepTabs) {
    if (sweepTabs.length === 0) return;
    chrome.tabs.remove(sweepTabs.map(tab => tab.id), () => {
        chrome.storage.local.get("swept", obj => {
            if (!obj.swept) obj.swept = {};

            obj.swept[timestamp] = sweepTabs.map(tab => {
                return {
                    title: tab.title,
                    url: tab.url,
                    faviconUrl: tab.faviconUrl,
                    lastAccessed: tab.lastAccessed
                }
            });

            chrome.storage.local.set(obj);
        });
    });
}

document.getElementById("sweep").addEventListener("click", async () => {
    const timestamp = Date.now().toString();

    chrome.tabs.query({url: "chrome://newtab/", active: false}, sweepTabs => {
        executeSweep(timestamp, sweepTabs);
    });
});
document.getElementById("sweep_history_clear").addEventListener("click", async () => {
    await chrome.storage.local.set({swept: {}});
});

document.getElementById("sweep_history_update").addEventListener("click", () => {
    chrome.storage.local.get("swept", (obj) => {
        const sweptTemplate = document.getElementById("swept_template");
        const sweepHistoryElement = document.getElementById("sweep_history");

        while (sweepHistoryElement.firstChild) {
            sweepHistoryElement.removeChild(sweepHistoryElement.firstChild);
        }

        Object.entries(obj.swept).forEach(([timestamp, sweptTabs]) => {
            const element = sweptTemplate.content.cloneNode(true);
            const ulElement = element.querySelector("ul");
            const liTemplate = ulElement.querySelector("li");

            liTemplate.remove();

            element.querySelector("h2").textContent = new Date(parseInt(timestamp)).toLocaleString();

            sweptTabs.forEach((tab) => {
                const liElement = liTemplate.cloneNode(true);
                const aElement = liElement.querySelector("a");

                aElement.href = tab.url;
                aElement.textContent = tab.title;
                ulElement.append(liElement);
            });

            sweepHistoryElement.prepend(element);
        });
    });
});

document.getElementById("collapse").addEventListener("click", async () => {
    // グループを全部閉じる
    chrome.tabGroups.query({}, groups => {
        groups.forEach(group => {
            chrome.tabGroups.update(group.id, {collapsed: true});
        });
    });
})

// 以下popupへの出力