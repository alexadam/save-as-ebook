var cssFileName = 'ebook.css';
var ebookTitle = null;

chrome.runtime.onMessage.addListener((obj) => {
    if (obj.shortcut && obj.shortcut === 'build-ebook') {
        buildEbook(obj.response);
    } else if (obj.alert) {
        console.log(obj.alert);
        alert(obj.alert);
    }
})

function getImagesIndex(allImages) {
    return allImages.reduce(function(prev, elem, index) {
        return prev + '\n' + '<item href="images/' + elem.filename + '" id="img' + elem.filename + '" media-type="image/' + getImageType(elem.filename) + '"/>';
    }, '');
}

function getExternalLinksIndex() { // TODO
    return allExternalLinks.reduce(function(prev, elem, index) {
        return prev + '\n' + '<item href="' + elem + '" />';
    }, '');
}

function buildEbookFromChapters() {
    getEbookTitle(function (title) {
        ebookTitle = title;
        if (!ebookTitle || ebookTitle.trim().length === 0) {
            ebookTitle = 'eBook';
        }
        getEbookPages(_buildEbook);
    })
}

// FIXME remove  - keep one  function
function buildEbook(allPages, fromMenu=false) {
    _buildEbook(allPages, fromMenu);
}

// http://ebooks.stackexchange.com/questions/1183/what-is-the-minimum-required-content-for-a-valid-epub
function _buildEbook(allPages, fromMenu=false) {
    allPages = allPages.filter(function(page) {
        return page !== null;
    });

    console.log('Prepare Content...');

    var ebookFileName = 'eBook.epub';

    if (ebookTitle) {
        // ~TODO a pre-processing function to apply escapeXMLChars to all page.titles
        ebookName = escapeXMLChars(ebookTitle);
        ebookFileName = getEbookFileName(removeSpecialChars(ebookTitle)) + '.epub';
    } else {
        ebookName = escapeXMLChars(allPages[0].title);
        ebookFileName = getEbookFileName(removeSpecialChars(allPages[0].title)) + '.epub';
    }

    var zip = new JSZip();
    zip.file('mimetype', 'application/epub+zip');

    var metaInfFolder = zip.folder("META-INF");
    metaInfFolder.file('container.xml',
        '<?xml version="1.0"?>' +
        '<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">' +
        '<rootfiles>' +
        '<rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>' +
        '</rootfiles>' +
        '</container>'
    );


    var oebps = zip.folder("OEBPS");
    oebps.file('toc.xhtml',
        '<?xml version="1.0" encoding="utf-8"?>' +
        '<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">' +
        '<head>' +
        '<title>toc.xhtml</title>' +
        '<link href="' + cssFileName + '" rel="stylesheet" type="text/css" />' +
        '</head>' +
        '<body>' +
        '<nav id="toc" epub:type="toc">' +
        '<h1 class="frontmatter">Table of Contents</h1>' +
        '<ol class="contents">' +
        allPages.reduce(function(prev, page) {
            var tmpPageTitle = escapeXMLChars(page.title);
            return prev + '\n' + '<li><a href="pages/' + page.url + '">' + tmpPageTitle + '</a></li>';
        }, '') +
        '</ol>' +
        '</nav>' +
        '</body>' +
        '</html>'
    );

    oebps.file('toc.ncx',
        '<?xml version="1.0" encoding="UTF-8" ?>' +
        '<ncx version="2005-1" xml:lang="en" xmlns="http://www.daisy.org/z3986/2005/ncx/">' +
        '<head>' +
        '<meta name="dtb:uid" content="isbn"/>' +
        '<meta name="dtb:depth" content="1"/>' +
        '</head>' +
        '<docTitle>' +
        '<text>' + ebookName + '</text>' +
        '</docTitle>' +
        '<navMap>' +
        allPages.reduce(function(prev, page, index) {
            var tmpPageTitle = escapeXMLChars(page.title);
            return prev + '\n' +
                '<navPoint id="ebook' + index + '" playOrder="' + (index + 1) + '">' +
                '<navLabel><text>' + tmpPageTitle + '</text></navLabel>' +
                '<content src="pages/' + page.url + '" />' +
                '</navPoint>';
        }, '') +
        '</navMap>' +
        '</ncx>'
    );

    oebps.file(cssFileName, ''); //TODO
    var styleFolder = oebps.folder('style');
    allPages.forEach(function(page) {
        styleFolder.file(page.styleFileName, page.styleFileContent);
    });

    var pagesFolder = oebps.folder('pages');
    allPages.forEach(function(page) {
        var tmpPageTitle = escapeXMLChars(page.title);
        pagesFolder.file(page.url,
            '<?xml version="1.0" encoding="utf-8"?>' +
            '<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">' +
            '<head>' +
            '<title>' + tmpPageTitle+ '</title>' +
            '<link href="../style/' + page.styleFileName + '" rel="stylesheet" type="text/css" />' +
            '</head><body>' +
            page.content +
            '</body></html>'
        );
    });

    oebps.file('content.opf',
        '<?xml version="1.0" encoding="UTF-8" ?>' +
        '<package xmlns="http://www.idpf.org/2007/opf" xmlns:dc="http://purl.org/dc/elements/1.1/" unique-identifier="db-id" version="3.0">' +
        '<metadata>' +
        '<dc:title id="t1">'+ ebookName + '</dc:title>' +
        '<dc:identifier id="db-id">isbn</dc:identifier>' +
        '<meta property="dcterms:modified">' + new Date().toISOString().replace(/\.[0-9]+Z/i, 'Z') + '</meta>' +
        '<dc:language>en</dc:language>' +
        '</metadata>' +
        '<manifest>' +
        '<item id="toc" properties="nav" href="toc.xhtml" media-type="application/xhtml+xml" />' +
        '<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml" />' +
        '<item id="template_css" href="' + cssFileName + '" media-type="text/css" />' +
        allPages.reduce(function(prev, page, index) {
            return prev + '\n' + '<item id="ebook' + index + '" href="pages/' + page.url + '" media-type="application/xhtml+xml" />';
        }, '') +
        allPages.reduce(function(prev, page, index) {
            return prev + '\n' + '<item id="style' + index + '" href="style/' + page.styleFileName + '" media-type="text/css" />';
        }, '') +
        allPages.reduce(function(prev, page, index) {
            return prev + '\n' + getImagesIndex(page.images);
        }, '') +
        '</manifest>' +
        '<spine toc="ncx">' +
        allPages.reduce(function(prev, page, index) {
            return prev + '\n' + '<itemref idref="ebook' + index + '" />';
        }, '') +
        '</spine>' +
        '</package>'
    );

    ///////////////
    var imgsFolder = oebps.folder("images");
    allPages.forEach(function(page) {
        for (var i = 0; i < page.images.length; i++) {
            var tmpImg = page.images[i];
            imgsFolder.file(tmpImg.filename, tmpImg.data, {
                base64: true
            });
        }
    });

    var done = false;

    // FIXME
    // var saveData = (function () {
    //         var a = document.createElement("a");
    //         document.body.appendChild(a);
    //         a.style = "display: none";
    //         return function (data, fileName) {
    //             var wURL = window.URL || window.mozURL;
    //             var blob = new Blob([data], {type: "application/epub+zip"}),
    //                 url = wURL.createObjectURL(blob);
    //
    //             chrome.downloads.download({
    //               url: url,
    //               filename: fileName,
    //               saveAs: true
    //             });
    //         };
    //     }());

    zip.generateAsync({
            type: "blob"
        })
        .then(function(content) {
            done = true;
            console.log("done !");
            saveAs(content, ebookFileName);
        });

    // FIXME - remove or fix?
    setTimeout(function() {
        if (done) {
            return;
        }
        zip.generateAsync({
                type: "blob"
            })
            .then(function(content) {
                saveAs(content, ebookFileName);
            });
    }, 60000);

}
