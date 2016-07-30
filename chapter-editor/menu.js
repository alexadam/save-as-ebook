var win = null;

document.getElementById("editChapters").onclick = function() {
    // win = window.open(chrome.extension.getURL('chapter-editor/editor.html'), '_blank');
    // win.focus();

    // chrome.tabs.create({url:"editor.html"});

    var list = document.getElementById('chapters');
    var allPages = getEbookPages();

    for (var i = 0; i < allPages.length; i++) {
        var listItem = document.createElement('li');
        var label = document.createElement('span');
        label.innerHTML = allPages[i].title;
        label.class = 'menu-item-full';
        listItem.appendChild(label);
        list.appendChild(listItem);
    }


};

function dispatch(action, justAddToBuffer) {
    if (!justAddToBuffer) {
        localStorage.removeItem('ebook');
    }
    chrome.tabs.query({
        currentWindow: true,
        active: true
    }, function(tab) {

        // chrome.tabs.sendMessage(
        //     tab[0].id, {
        //         type: action
        //     },
        //     function(response) {
        //         alert('nnn 3' + response);
        //         var allPages = getEbookPages();
        //         allPages.push(response);
        //         saveEbookPages(allPages);
        //         if (!justAddToBuffer) {
        //             buildEbook();
        //         }
        //     }
        // );

        chrome.tabs.executeScript(tab[0].id, {
            file: 'chapter-editor/jquery.js'
        });

        chrome.tabs.executeScript(tab[0].id, {
            file: 'pure-parser.js'
        });

        chrome.tabs.executeScript(tab[0].id, {
            file: 'extractHtml.js'
        }, function() {
            // if (chrome.runtime.lastError) {
            //     alert(JSON.stringify(chrome.runtime.lastError));
            //     throw Error("Unable to inject script into tab " + tabId);
            // }
            chrome.tabs.sendMessage(tab[0].id, {
                type: action
            }, function(response) {
                var allPages = getEbookPages();
                allPages.push(response);
                saveEbookPages(allPages);
                if (!justAddToBuffer) {
                    buildEbook();
                }
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
