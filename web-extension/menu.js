var allStyles = [];
var currentStyle = null;
var appliedStyles = [];

// create menu labels
document.getElementById('menuTitle').innerHTML = chrome.i18n.getMessage('extName');
document.getElementById('japaneseStyle').innerHTML = chrome.i18n.getMessage('japaneseStyle');
document.getElementById('includeStyle').innerHTML = chrome.i18n.getMessage('includeStyle');
document.getElementById('editStyles').innerHTML = chrome.i18n.getMessage('editStyles');
document.getElementById('savePageLabel').innerHTML = chrome.i18n.getMessage('savePage');
document.getElementById('saveSelectionLabel').innerHTML = chrome.i18n.getMessage('saveSelection');
document.getElementById('pageChapterLabel').innerHTML = chrome.i18n.getMessage('pageChapter');
document.getElementById('selectionChapterLabel').innerHTML = chrome.i18n.getMessage('selectionChapter');
document.getElementById('editChapters').innerHTML = chrome.i18n.getMessage('editChapters');
document.getElementById('waitMessage').innerHTML = chrome.i18n.getMessage('waitMessage');

function removeEbook() {
    chrome.runtime.sendMessage({
        type: "remove"
    }, function(response) {});
}

chrome.runtime.sendMessage({
    type: "is busy?"
}, function(response) {
    if (response.isBusy) {
        document.getElementById('busy').style.display = 'block';
    } else {
        document.getElementById('busy').style.display = 'none';
    }
});

chrome.runtime.sendMessage({
    type: "get styles"
}, function(response) {
    createStyleList(response.styles);
});

function createStyleList(styles) {
    allStyles = styles;
    chrome.tabs.query({'active': true}, function (tabs) {
        let currentUrl = tabs[0].url;

        if (!styles || styles.length === 0) {
            return;
        }

        let foundMatchingUrl = false;

        // if multiple URL regexes match, select the longest one
        let allMatchingStyles = [];

        for (let i = 0; i < styles.length; i++) {
            let listItem = document.createElement('option');
            listItem.id = 'option_' + i;
            listItem.className = 'cssEditor-chapter-item';
            listItem.value = 'option_' + i;
            listItem.innerText = styles[i].title;

            currentUrl = currentUrl.replace(/(http[s]?:\/\/|www\.)/i, '').toLowerCase();
            let styleUrl = styles[i].url;
            let styleUrlRegex = null;

            try {
                styleUrlRegex =  new RegExp(styleUrl, 'i');
            } catch (e) {
            }

            if (styleUrlRegex && styleUrlRegex.test(currentUrl)) {
                allMatchingStyles.push({
                    index: i,
                    length: styleUrl.length
                });
            }
        }

        if (allMatchingStyles.length >= 1) {
            allMatchingStyles.sort(function (a, b) {
                return b.length - a.length;
            });
            let selStyle = allMatchingStyles[0];
            currentStyle = styles[selStyle.index];

            chrome.runtime.sendMessage({
                type: "set current style",
                currentStyle: currentStyle
            }, function(response) {
            });
        }
    });
}

function createJapaneseStyle(data) {
    let japaneseStyleCheck = document.getElementById('japaneseStyleCheck');
    japaneseStyleCheck.checked = data;
}

chrome.runtime.sendMessage({
    type: "get japanese style"
}, function(response) {
    createJapaneseStyle(response.japaneseStyle);
});

document.getElementById('japaneseStyleCheck').onclick = function () {
    let japaneseStyleCheck = document.getElementById('japaneseStyleCheck');
    chrome.runtime.sendMessage({
        type: "set japanese style",
        japaneseStyle: japaneseStyleCheck.checked
    }, function(response) {
    });
}

function createIncludeStyle(data) {
    let includeStyleCheck = document.getElementById('includeStyleCheck');
    includeStyleCheck.checked = data;
}

chrome.runtime.sendMessage({
    type: "get include style"
}, function(response) {
    createIncludeStyle(response.includeStyle);
});

document.getElementById('includeStyleCheck').onclick = function () {
    let includeStyleCheck = document.getElementById('includeStyleCheck');
    chrome.runtime.sendMessage({
        type: "set include style",
        includeStyle: includeStyleCheck.checked
    }, function(response) {
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

        chrome.tabs.executeScript(tab[0].id, {file: './libs/jquery.js'});
        chrome.tabs.executeScript(tab[0].id, {file: './libs/jquery-sortable.js'});
        chrome.tabs.insertCSS(tab[0].id, {file: '/chapterEditor.css'});

        chrome.tabs.executeScript(tab[0].id, {
            file: '/chapterEditor.js'
        });

         window.close();
    });
};

function dispatch(commandType, justAddToBuffer) {
    document.getElementById('busy').style.display = 'block';
    if (!justAddToBuffer) {
        removeEbook();
    }
    chrome.runtime.sendMessage({
        type: commandType
    }, function(response) {
        //FIXME - hidden before done
        document.getElementById('busy').style.display = 'none';
    });
}

document.getElementById('savePage').onclick = function() {
    dispatch('save-page', false);
};

document.getElementById('saveSelection').onclick = function() {
    dispatch('save-selection', false);
};

document.getElementById('pageChapter').onclick = function() {
    dispatch('add-page', true);
};

document.getElementById('selectionChapter').onclick = function() {
    dispatch('add-selection', true);
};

// get all shortcuts and display them in the menuTitle
chrome.commands.getAll((commands) => {
    for (let command of commands) {
        if (command.name === 'save-page') {
            document.getElementById('savePageShortcut').appendChild(document.createTextNode(command.shortcut));
        } else if (command.name === 'save-selection') {
            document.getElementById('saveSelectionShortcut').appendChild(document.createTextNode(command.shortcut));
        } else if (command.name === 'add-page') {
            document.getElementById('pageChapterShortcut').appendChild(document.createTextNode(command.shortcut));
        } else if (command.name === 'add-selection') {
            document.getElementById('selectionChapterShortcut').appendChild(document.createTextNode(command.shortcut));
        }
    }
})
