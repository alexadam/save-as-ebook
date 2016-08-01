function _getEbookPages() {
    try {
        var allPages = localStorage.getItem('ebook');
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
    localStorage.setItem('ebook', JSON.stringify(pages));
}

function _removeEbook() {
    localStorage.removeItem('ebook');
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
});
