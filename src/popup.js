document.getElementById("sweep").onclick = function () {
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

document.getElementById("orderly").onclick = function () {
    chrome.tabs.query({ pinned: false }, tabs => {
        const indexes = tabs.map(tab => tab.index);
        tabs.sort((a, b) => a.url >= b.url ? 1 : -1);
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

document.getElementById("load_tabs").onclick = () => {
    chrome.tabs.query({ pinned: false, currentWindow: true }, tabs => {
        const tab_list = document.getElementById("tab_list");
        [...tab_list.children].forEach(child => child.remove());
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
};

document.getElementById("command_close").onclick = function () {
    [...document.getElementsByName("tab_id")]
        .filter(tab_id_checkbox => tab_id_checkbox.checked)
        .forEach(tab_id_checkbox => chrome.tabs.remove(parseInt(tab_id_checkbox.value)));
};
document.getElementById("departure").onclick = function () {
    chrome.windows.create({}, new_window => {
        [...document.getElementsByName("tab_id")]
            .filter(tab_id_checkbox => tab_id_checkbox.checked)
            .forEach(tab_id_checkbox => {
                chrome.tabs.move(parseInt(tab_id_checkbox.value), { windowId: new_window.id, index: -1 });
            });
    });
};
