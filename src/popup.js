document.getElementById("sweep").onclick = () => {
    chrome.tabs.query({}, tabs => {
        const remove_urls = ["chrome://newtab/"];

        for (let tab of tabs) {
            if (remove_urls.includes(tab.url)) {
                chrome.tabs.remove(tab.id);
            }
            remove_urls.push(tab.url);
        }
    });
};

document.getElementById("orderly").onclick = () => {
    chrome.tabs.query({ pinned: false, currentWindow: true }, tabs => {
        const indexes = tabs.map(tab => tab.index);
        tabs.sort((a, b) => a.url >= b.url ? 1 : -1);
        const numberOfTabs = tabs.length;
        for (let i = 0; i < numberOfTabs; i++) {
            chrome.tabs.move(tabs[i].id, { index: indexes[i] });
        }
    });
};

document.getElementById("merge").onclick = () => {
    chrome.windows.getCurrent({ windowTypes: ["normal"] }, window => {
        chrome.tabs.query({}, tabs => {
            tabs.forEach(tab => {
                chrome.tabs.move(tab.id, { windowId: window.id, index: tab.index });
            });
        });
    });
};

function groupByDomain(tabs) {
    function extractKey(url) {
        if (!url || !url.startsWith("http")) return "その他";
        return url.split("/")[2];
    }

    return tabs.reduce((acc, tab) => {
        const key = extractKey(tab.url);
        if (!acc[key]) acc[key] = [];
        acc[key].push(tab);
        return acc;
    }, {});
}

document.getElementById("load_tabs").onclick = () => {
    chrome.tabs.query({ pinned: false, currentWindow: true }, tabs => {
        const tab_list = document.getElementById("tab_list");
        [...tab_list.children].forEach(child => child.remove());

        const groupedTabs = groupByDomain(tabs);

        for (const domain in groupedTabs) {
            if (groupedTabs.hasOwnProperty(domain)) {
                const currentTabs = groupedTabs[domain];

                const domainLine = document.createElement("li");
                const domainLabel = document.createElement("b");
                domainLabel.appendChild(document.createTextNode(domain));
                domainLine.appendChild(domainLabel);

                domainLabel.onclick = () => {
                    currentTabs.forEach(tab => {
                        const checkbox = document.getElementById("tabid_" + tab.id);
                        checkbox.checked = !checkbox.checked;
                    });
                };

                const tabList = document.createElement("ul");
                domainLine.appendChild(tabList);
                tab_list.appendChild(domainLine);

                currentTabs.forEach(tab => {
                    const line = document.createElement("li");

                    const checkbox = document.createElement("input");
                    checkbox.type = "checkbox";
                    checkbox.name = "tab_id";
                    checkbox.value = tab.id;
                    checkbox.id = "tabid_" + tab.id;
                    line.appendChild(checkbox);

                    const label = document.createElement("label");
                    label.htmlFor = checkbox.id;
                    if (tab.favIconUrl) {
                        const favIconImg = document.createElement("img");
                        favIconImg.src = tab.favIconUrl;
                        favIconImg.width = 16;
                        favIconImg.height = 16;
                        label.appendChild(favIconImg);
                    }
                    const labelText = document.createElement("span");
                    labelText.appendChild(document.createTextNode(tab.title));
                    label.appendChild(labelText);
                    line.appendChild(label);

                    const arrowIcon = document.createElement("i");
                    arrowIcon.className = "fas fa-arrow-circle-right";
                    arrowIcon.onclick = () => {
                        chrome.tabs.highlight({ tabs: tab.index });
                    };
                    line.appendChild(arrowIcon);

                    tabList.appendChild(line);
                });
            }
        }
    });
};

document.getElementById("command_close").onclick = () => {
    [...document.getElementsByName("tab_id")]
        .filter(tab_id_checkbox => tab_id_checkbox.checked)
        .forEach(tab_id_checkbox => chrome.tabs.remove(parseInt(tab_id_checkbox.value)));
};
document.getElementById("departure").onclick = () => {
    const selected_tabs = [...document.getElementsByName("tab_id")]
        .filter(tab_id_checkbox => tab_id_checkbox.checked);
    if (selected_tabs.length) {
        chrome.windows.create({}, new_window => {
            selected_tabs.forEach(tab_id_checkbox => {
                chrome.tabs.move(parseInt(tab_id_checkbox.value), { windowId: new_window.id, index: -1 });
            });
            chrome.tabs.remove(new_window.tabs[0].id);
        });
    }
};

document.getElementById("remove_family").onclick = () => {

    const tabMap = new Map();
    const childrenMap = new Map();

    const removeChildren = id => {
        chrome.tabs.remove(id);
        let children = childrenMap.get(id);
        if (children) {
            children.forEach(childId => removeChildren(childId));
        }
    };

    chrome.tabs.query({}, tabs => {
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

    chrome.tabs.query({"active": true}, tabs => {
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
