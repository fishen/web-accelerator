function Statistics() {
    var state = {};
    this.reset = function (tabId) {
        if (!tabId) {
            state = {};
        } else {
            state[tabId] = '';
        }
    };
    this.remove = function (tabId) {
        delete state[tabId];
    }
    this.gather = function (details) {
        if (details.statusCode == 200) {
            if (details.url.includes('next=')) {
                state[details.tabId] = state[details.tabId] || 0;
                state[details.tabId]++;
                this.updateBadgeText();
            }
        }
    }
    this.updateBadgeText = function (tabId) {
        var setBadageText = (tabId) => {
            var count = state[tabId] || '';
            chrome.browserAction.setBadgeText({ "text": `${count}` });
        };
        if (tabId) {
            setBadageText(tabId);
            return;
        }
        chrome.tabs.query({ active: true }, tabs => {
            if (tabs.length == 0) return;
            var tab = tabs[0];
            setBadageText(tab.id);
        });
    }
}