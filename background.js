var resolver = new URLResolver();
var statistics = new Statistics();
var whiteList = [
    'cdn.bootcss.com',
    'cdn.staticfile.org',
    'g.alicdn.com',
    'assets-cdn.github.com',
    'localhost:*'
];
var blackList = [
    'analytics.js',
    'google-analytics.com',
    'baidu-tongji',
];
var disabled = false;
chrome.webRequest.onBeforeRequest.addListener((details) => {
    if (disabled) return undefined;
    if (whiteList.some(url => new RegExp(url).test(details.url))) return undefined;
    if (blackList.some(url => new RegExp(url).test(details.url))) return { cancel: true };
    var finalStr = "final=true";
    if (details.url.includes(finalStr)) return undefined;
    var result = resolver.resolve(details.url);
    if (result) {
        var nextUrl = encodeURIComponent(`${result.oldUrl}?${finalStr}`);
        return { redirectUrl: result.newUrl + `?next=${nextUrl}` };
    }
},
    { urls: ["<all_urls>"], types: ["script", "font", "stylesheet"] },
    ["blocking"]
);
chrome.webRequest.onHeadersReceived.addListener((details) => {
    if (details.statusCode === 404) {
        console.log('notfound:' + details.url);
        var index = details.url.indexOf('?next=');
        if (~index) {
            var nextUrl = decodeURIComponent(details.url.substring(index + 6));
            return { redirectUrl: nextUrl };
        }
    } else if (details.statusCode === 200) {
        statistics.gather(details);
    }
},
    { urls: ["<all_urls>"], types: ["script", "font", "stylesheet"] },
    ["blocking", "responseHeaders"]
);
chrome.tabs.onActivated.addListener(activeInfo => {
    statistics.updateBadgeText(activeInfo.tabId);
});
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.status === "loading") {
        statistics.reset(tabId);
        if (disabledTabList.includes(tabId)) {
            chrome.browserAction.disable(tabId);
        } else if (disabledTabList.includes(-1 * tabId)) {
            chrome.browserAction.enable(tabId);
        }
    }
});
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
    statistics.remove(tabId);
});
chrome.contextMenus.removeAll();
var browserActionMenus = [
    {
        id: 'enable',
        title: 'Enabled',
        callback: function (info, tab) {
            disabled = info.checked;
            if (info.checked) {
                chrome.browserAction.enable();
            } else {
                chrome.browserAction.disable();
                statistics.reset();
                statistics.updateBadgeText();
            }
        }
    }
];
browserActionMenus.forEach(menu => {
    chrome.contextMenus.create({
        type: 'checkbox',
        id: menu.id,
        title: menu.title,
        contexts: ["browser_action"],
        checked: true,
    });
})
chrome.contextMenus.onClicked.addListener((info, tab) => {
    console.log(info, tab);
    var menu = browserActionMenus.find(m => m.id === info.menuItemId);
    if (!menu) return false;
    menu.callback(info, tab);
});