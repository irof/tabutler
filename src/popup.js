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
    chrome.tabs.query({ pinned: false }, function (tabs) {
        const indexes = tabs.map(tab => tab.index);
        tabs.sort(function (a, b) {
            return a.url >= b.url ? 1 : -1;
        });
        const numberOfTabs = tabs.length;
        for (let i = 0; i < numberOfTabs; i++) {
            chrome.tabs.move(tabs[i].id, { index: indexes[i] });
        }
    });
};

document.getElementById("merge").onclick = function () {
    chrome.windows.getCurrent({ windowTypes: ["normal"] }, window => {
        chrome.tabs.query({}, function (tabs) {
            tabs.forEach(tab => {
                chrome.tabs.move(tab.id, { windowId: window.id, index: tab.index });
            });
        });
    });
};


chrome.tabs.query({ pinned: false }, function (tabs) {
    const tab_list = document.getElementById("tab_list");
    tabs.forEach(tab => {
        const line = document.createElement("li");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.name = "tab_id";
        checkbox.value = tab.id;
        checkbox.id = "tabid_" + tab.id;

        const label = document.createElement("label");
        label.htmlFor = checkbox.id;
        label.appendChild(document.createTextNode(tab.title));

        line.appendChild(checkbox);
        line.appendChild(label);
        tab_list.appendChild(line);
    });
});

document.getElementById("command_close").onclick = function () {
    [...document.getElementsByName("tab_id")]
        .filter(tab_id_checkbox => tab_id_checkbox.checked)
        .forEach(tab_id_checkbox => chrome.tabs.remove(parseInt(tab_id_checkbox.value)));
};