

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.type === 'get-title') {
        console.log("AAAAAAAA 2", document.title);
        sendResponse({title: document.title});
        return true;
    }
});
