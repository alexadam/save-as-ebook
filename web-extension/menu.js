var allStyles = [];
var currentStyle = null;

getStyles(createStyleList);

function createStyleList(styles) {
    allStyles = styles;
    chrome.tabs.query({'active': true}, function (tabs) {
        var currentUrl = tabs[0].url;

        if (!styles || styles.length === 0) {
            return;
        }

        var existingStyles = document.getElementById('allStylesList');
        var foundMatchingUrl = false;

        while (existingStyles.hasChildNodes() && existingStyles.childElementCount > 1) {
            existingStyles.removeChild(existingStyles.lastChild);
        }

        for (var i = 0; i < styles.length; i++) {
            var listItem = document.createElement('option');
            listItem.id = 'option_' + i;
            listItem.className = 'cssEditor-chapter-item';
            listItem.value = 'option_' + i;
            listItem.innerText = styles[i].title;

            if (!foundMatchingUrl) {
                currentUrl = currentUrl.replace(/(http[s]?:\/\/|www\.)/gi, '').toLowerCase();
                var styleUrl = styles[i].url.replace(/(http[s]?:\/\/|www\.)/gi, '').toLowerCase();

                if (currentUrl.startsWith(styleUrl)) {
                    listItem.selected = 'selected';
                    foundMatchingUrl = true;
                    currentStyle = styles[i];
                    setCurrentStyle(currentStyle);
                }
            }

            existingStyles.appendChild(listItem);
        }
    });
}

document.getElementById('allStylesList').onchange = function () {
    var newValue = this.value;
    newValue = newValue.replace('option_', '');
    newValue = parseInt(newValue);
    currentStyle = allStyles[newValue];
    setCurrentStyle(currentStyle);
}

document.getElementById("applyStyle").onclick = function() {
    chrome.tabs.query({
        currentWindow: true,
        active: true
    }, function(tab) {
        chrome.tabs.insertCSS(tab[0].id, {code: currentStyle.style});
        // window.close();  TODO ?
    });
}

document.getElementById("editStyles").onclick = function() {

    if (document.getElementById('cssEditor-Modal')) {
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
        chrome.tabs.insertCSS(tab[0].id, {file: '/cssEditor.css'});

        chrome.tabs.executeScript(tab[0].id, {
            file: '/cssEditor.js'
        });

         window.close();
    });
};

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
                chrome.tabs.executeScript(tab[0].id, {file: '/cssjson.js'});

                chrome.tabs.insertCSS(tab[0].id, {code: currentStyle.style}); // TODO remove from here --- see if it still works

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
        if (response.length === 0) {
            if (justAddToBuffer) {
                alert('Cannot add an empty selection as chapter!');
            } else {
                alert('Cannot generate the eBook from an empty selection!');
            }
            window.close();
        }
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
