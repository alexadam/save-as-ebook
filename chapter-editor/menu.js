
document.getElementById("editChapters").onclick = function() {
    chrome.tabs.query({
        currentWindow: true,
        active: true
    }, function(tab) {

        chrome.tabs.executeScript(tab[0].id, {
            file: '/chapter-editor/utils.js'
        });

        chrome.tabs.executeScript(tab[0].id, {file: '/chapter-editor/jquery.js'});
        chrome.tabs.executeScript(tab[0].id, {file: '/chapter-editor/filesaver.js'});
        chrome.tabs.executeScript(tab[0].id, {file: '/chapter-editor/jszip.js'});
        chrome.tabs.executeScript(tab[0].id, {file: '/chapter-editor/jszip-utils.js'});
        chrome.tabs.executeScript(tab[0].id, {file: '/chapter-editor/saveEbook.js'});

        chrome.tabs.executeScript(tab[0].id, {
            file: '/chapter-editor/chapterEditor.js'
        });
    });


};

function dispatch(action, justAddToBuffer) {
    if (!justAddToBuffer) {
        removeEbook();
    }
    chrome.tabs.query({
        currentWindow: true,
        active: true
    }, function(tab) {

        chrome.tabs.executeScript(tab[0].id, {file: '/chapter-editor/jquery.js'});
        chrome.tabs.executeScript(tab[0].id, {file: '/chapter-editor/filesaver.js'});
        chrome.tabs.executeScript(tab[0].id, {file: '/chapter-editor/jszip.js'});
        chrome.tabs.executeScript(tab[0].id, {file: '/chapter-editor/jszip-utils.js'});
        chrome.tabs.executeScript(tab[0].id, {file: '/pure-parser.js'});

        chrome.tabs.executeScript(tab[0].id, {
            file: 'extractHtml.js'
        }, function() {
            chrome.tabs.sendMessage(tab[0].id, {
                type: action
            }, function(response) {
                getEbookPages(function (allPages) {
                    allPages.push(response);
                    saveEbookPages(allPages);
                    if (!justAddToBuffer) {
                        buildEbook();
                    }
                });
            });
        });
    });
}

document.getElementById('savePage').onclick = function() {
    dispatch('extract-page', false);
};

document.getElementById('saveSelection').onclick = function() {
    dispatch('extract-selection', false);
};

document.getElementById('pageChapter').onclick = function() {
    dispatch('extract-page', true);
};

document.getElementById('selectionChapter').onclick = function() {
    dispatch('extract-selection', true);
};

document.getElementById('saveChapters').onclick = function() {
    buildEbook();
};
