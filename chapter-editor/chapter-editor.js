var win = null;

document.getElementById("superbuton").onclick = function() {
    win = window.open(chrome.extension.getURL('chapter-editor/editor.html'), '_blank');
    win.focus();
};

document.getElementById('savepage').onclick = function() {
    // chrome.tabs.query({
    //     currentWindow: true,
    //     active: true
    // }, function(tab) {
    //     chrome.tabs.sendMessage(
    //         tab[0].id, {
    //             type: 'page-to-buffer'
    //         }
    //     );
    // });
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
