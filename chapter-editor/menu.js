var win = null;

document.getElementById("editChapters").onclick = function() {
    win = window.open(chrome.extension.getURL('chapter-editor/editor.html'), '_blank');
    win.focus();
};

document.getElementById('savePage').onclick = function() {
    localStorage.removeItem('ebook');
    chrome.tabs.query({
        currentWindow: true,
        active: true
    }, function(tab) {
        chrome.tabs.sendMessage(
            tab[0].id,
            {
                type: 'extract-page'
            },
            function (response) {
                var allPages = getEbookPages();
                allPages.push(response);
                saveEbookPages(allPages);
                buildEbook();
            }
        );
    });
};

document.getElementById('saveSelection').onclick = function() {
    localStorage.removeItem('ebook');
    chrome.tabs.query({
        currentWindow: true,
        active: true
    }, function(tab) {
        chrome.tabs.sendMessage(
            tab[0].id,
            {
                type: 'extract-selection'
            },
            function (response) {
                console.log('Selection EXTRAcTED', response);
            }
        );
    });
};

document.getElementById('title').onclick = function() {
    chrome.tabs.query({
        currentWindow: true,
        active: true
    }, function(tab) {
        chrome.tabs.sendMessage(
            tab[0].id, {
                type: 'get-title'
            },
            function(response) {
                var title = localStorage.getItem('title');
                if (title === null) {
                    title = [];
                } else {
                    title = JSON.parse(title);
                }
                title.push(response);
                localStorage.setItem('title', JSON.stringify(title));
            }
        );
    });
};
