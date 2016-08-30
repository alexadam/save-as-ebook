
document.getElementById("editChapters").onclick = function() {

    if (document.getElementById('chapterEditor-Modal')) {
        return;
    }

    chrome.tabs.query({
        currentWindow: true,
        active: true
    }, function(tab) {

        chrome.tabs.executeScript(tab[0].id, {file: '/jquery.js'});
        chrome.tabs.executeScript(tab[0].id, {file: '/utils.js'});
        chrome.tabs.executeScript(tab[0].id, {file: '/filesaver.js'});
        chrome.tabs.executeScript(tab[0].id, {file: '/jszip.js'});
        chrome.tabs.executeScript(tab[0].id, {file: '/jszip-utils.js'});
        chrome.tabs.executeScript(tab[0].id, {file: '/saveEbook.js'});
        chrome.tabs.executeScript(tab[0].id, {file: '/jquery-sortable.js'});
        chrome.tabs.insertCSS(tab[0].id, {file: '/chapterEditor.css'});

        chrome.tabs.executeScript(tab[0].id, {
            file: '/chapterEditor.js'
        });

         window.close();
    });
};

function dispatch(action, justAddToBuffer) {
    document.getElementById('busy').style.display = 'block';
    if (!justAddToBuffer) {
        removeEbook();
    }
    chrome.tabs.query({
        currentWindow: true,
        active: true
    }, function(tab) {
        chrome.tabs.sendMessage(tab[0].id, {
            type: 'echo'
        }, function(response) {
            if (!response) {
                chrome.tabs.executeScript(tab[0].id, {file: '/jquery.js'});
                chrome.tabs.executeScript(tab[0].id, {file: '/utils.js'});
                chrome.tabs.executeScript(tab[0].id, {file: '/filesaver.js'});
                chrome.tabs.executeScript(tab[0].id, {file: '/jszip.js'});
                chrome.tabs.executeScript(tab[0].id, {file: '/jszip-utils.js'});
                chrome.tabs.executeScript(tab[0].id, {file: '/pure-parser.js'});

                chrome.tabs.executeScript(tab[0].id, {
                    file: 'extractHtml.js'
                }, function() {
                    sendMessage(tab[0].id, action, justAddToBuffer);
                });
            } else if (response.echo) {
                sendMessage(tab[0].id, action, justAddToBuffer);
            }
        });
    });
}

function sendMessage(tabId, action, justAddToBuffer) {
    chrome.tabs.sendMessage(tabId, {
        type: action
    }, function(response) {
        if (!justAddToBuffer) {
            buildEbook([response]);
        } else {
            getEbookPages(function (allPages) {
                allPages.push(response);
                saveEbookPages(allPages);
                window.close();
            });
        }
        setTimeout(function () {
            document.getElementById('busy').style.display = 'none';
        }, 500);
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
