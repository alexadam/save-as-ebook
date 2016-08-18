var customStorage = null;

function _getEbookPages() {
    try {
        // var allPages = localStorage.getItem('ebook');
        var allPages = customStorage;
        if (!allPages) {
            allPages = [];
        } else {
            allPages = JSON.parse(allPages);
        }
        return allPages;
    } catch (e) {
        alert(e);
        return [];
    }
}

function _saveEbookPages(pages) {
    try {
        // localStorage.setItem('ebook', JSON.stringify(pages));
        customStorage = JSON.stringify(pages);
    } catch (e) {
        alert(e);
    }
}

function _removeEbook() {
    // localStorage.removeItem('ebook');
    customStorage = null;
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.type === 'get') {
        sendResponse({allPages: _getEbookPages()});
    }
    if (request.type === 'set') {
        _saveEbookPages(request.pages);
    }
    if (request.type === 'remove') {
        _removeEbook();
    }
    return true;
});
