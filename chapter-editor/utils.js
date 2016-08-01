
// function getEbookPages() {
//     try {
//         // var allPages = localStorage.getItem('ebook');
//         // chrome.storage.local.get('ebook', function (allPages) {
//         //
//         // });
//         if (!allPages) {
//             allPages = [];
//         } else {
//             allPages = JSON.parse(allPages);
//         }
//         return allPages;
//     } catch (e) {
//         alert(e);
//         return [];
//     }
// }

function getEbookPages(callback) {
    chrome.runtime.sendMessage({type: "get"}, function(response) {
       callback(response.allPages);
    });
}

function saveEbookPages(pages) {
    // localStorage.setItem('ebook', JSON.stringify(pages));
    // chrome.storage.local.set({'ebook': JSON.stringify(pages)});
    chrome.runtime.sendMessage({type: "set", pages: pages}, function(response) {});
}

function removeEbook() {
    // localStorage.removeItem('ebook');
    // chrome.storage.local.remove('ebook');

    chrome.runtime.sendMessage({type: "remove"}, function(response) {});
}
