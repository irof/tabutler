const groupingRuleSaveButton = document.getElementById("grouping_rule_save");
const groupingRuleDescriptionTextarea = document.getElementById("grouping_rule_description");

groupingRuleDescriptionTextarea.addEventListener("change", () => {
    // ルールの保存ボタンを有効にする
    groupingRuleSaveButton.disabled = false;
});

async function storedGroupingRuleDescription() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get("grouping_rule_description", (result) => {
            if (chrome.runtime.lastError) {
                return reject(chrome.runtime.lastError);
            }
            const jsonObj = result.grouping_rule_description ? result.grouping_rule_description : {};
            resolve(jsonObj);
        });
    });
}

/**
 * @returns {Promise<{title: string, urlPatterns: string}[]>}
 */
async function currentGroupingRuleDescription() {
    return new Promise((resolve, reject) => {
        groupingRuleDescriptionTextarea.classList.remove("warning");
        try {
            const rules = JSON.parse(groupingRuleDescriptionTextarea.value);
            // 全てのルールがtitleとurlPatternsを含んでいること
            const validateRules = rules.every(rule => rule.title && rule.urlPatterns && Array.isArray(rule.urlPatterns));
            if (!validateRules) {
                throw new Error("Invalid rules");
            }
            return resolve(rules);
        } catch (error) {
            console.log(error);
            groupingRuleDescriptionTextarea.classList.add("warning");
            return reject(error);
        }
    });
}

groupingRuleSaveButton.addEventListener("click", () => {
    currentGroupingRuleDescription().then(result => {
        groupingRuleSaveButton.classList.remove("warning");

        chrome.storage.local.set({"grouping_rule_description": result});
    }).catch(() => {
        groupingRuleSaveButton.classList.add("warning");
    });
});

document.getElementById("sort").addEventListener("click", () => {
});

document.getElementById("grouping").addEventListener("click", async () => {

    const pinnedLastIndex = Math.max(...(await chrome.tabs.query({
        pinned: true,
        currentWindow: true
    })).map(tab => tab.index));
    const tabGroupsIndex = pinnedLastIndex >= 0 ? pinnedLastIndex + 1 : 0;

    /* [ { "title": "MDN", "urlPatterns": [ "https://developer.mozilla.org/*" ] } ] */
    const rules = await currentGroupingRuleDescription();
    rules.reverse().forEach(rule => {
        const title = rule.title;
        chrome.tabGroups.query({title}, groups => {
            chrome.tabs.query({
                pinned: false,
                currentWindow: true,
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
    if (sweepTabs.length === 0) {
        return;
    }
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

    const sweepTabs = [];

    // URLが重複しているタブ
    const sweepDuplicate = document.getElementById("sweepDuplicate").checked;
    if (sweepDuplicate) {
        const ignoreHash = document.getElementById("sweepIgnoreHash").checked;
        const ignoreQuery = document.getElementById("sweepIgnoreQuery").checked;

        const currentTabs = await chrome.tabs.query({
            currentWindow: true, pinned: false
        });
        // urlでグルーピングする
        const groupingByUrl = currentTabs.reduce((acc, tab) => {
            let tabUrl = new URL(tab.url);
            if (ignoreHash) tabUrl.hash = "";
            if (ignoreQuery) tabUrl.search = "";
            acc[tabUrl] ? acc[tabUrl].push(tab) : acc[tabUrl] = [tab];
            return acc;
        }, {});

        const duplicateTabs = Object.values(groupingByUrl).flatMap(tabs => tabs.slice(1))
        sweepTabs.push(...duplicateTabs);
    }

    // 空ページ
    const sweepBlank = document.getElementById("sweepBlank").checked;
    if (sweepBlank) {
        const blankTabs = await chrome.tabs.query({
            url: [
                "chrome://newtab/",
                "about:blank"
            ],
            currentWindow: true
        });
        sweepTabs.push(...blankTabs);
    }

    executeSweep(timestamp, sweepTabs);
    updateSweepHistory();
});
document.getElementById("sweep_history_clear").addEventListener("click", async () => {
    await chrome.storage.local.set({swept: {}});
    updateSweepHistory();
});

document.getElementById("sweep_history_update").addEventListener("click", updateSweepHistory);

function updateSweepHistory() {
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
                aElement.title = tab.url;
                ulElement.append(liElement);
            });

            sweepHistoryElement.prepend(element);
        });
    });
}

document.getElementById("collapse").addEventListener("click", async () => {
    // グループを全部折りたたむ
    chrome.tabGroups.query({}, groups => {
        groups.forEach(group => {
            chrome.tabGroups.update(group.id, {collapsed: true});
        });
    });
})

// 以下popupを開いた時に更新するもの

// 現在設定されているルールを出力する
storedGroupingRuleDescription().then(result => {
    groupingRuleDescriptionTextarea.value = JSON.stringify(result, null, 2);
});
