
function getEbookPages() {
    try {
        var allPages = localStorage.getItem('ebook');
        if (!allPages) {
            allPages = [];
        } else {
            allPages = JSON.parse(allPages);
        }
        return allPages;
    } catch (e) {
        console.log(e);
        return [];
    }
}

function saveEbookPages(pages) {
    localStorage.setItem('ebook', JSON.stringify(pages));
}
