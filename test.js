// document.body.style.border = "5px solid red";


// https://stuk.github.io/jszip/
// https://github.com/eligrey/FileSaver.js/


var cssFileName = 'ebook.css';
var pageName = 'ebook.xhtml';
var ebookName = "ebook-" + document.title + ".epub";
var imageIndex = 0;
var allImgSrc = {};
var allExternalLinks = [];
var allPages = [];

//////

function force(contentString) {
    try {
        var tagOpen = '@@@';
        var tagClose = '###';
        var inlineElements = ['h1', 'h2', 'h3', 'sup', 'b', 'i', 'em', 'code', 'pre', 'p'];

        var $content = $(contentString);

        $content.find('img').each(function (index, elem) {
            $(elem).replaceWith('<span>' + tagOpen + 'img src="' + getImageSrc($(elem).attr('src')) + '"' + tagClose + tagOpen + '/img' + tagClose + '</span>');
        });

        $content.find('a').each(function (index, elem) {
            $(elem).replaceWith('<span>' + tagOpen + 'a href="' + getHref($(elem).attr('href')) + '"' + tagClose + $(elem).html() + tagOpen + '/a' + tagClose + '</span>');
        });

        inlineElements.forEach(function (tagName) {
            $content.find(tagName).each(function (index, elem) {
                $(elem).replaceWith('<span>' + tagOpen + tagName + tagClose + $(elem).html() + tagOpen + '/' + tagName + tagClose + '</span>');
            });
        });

        contentString = $content.text();

        var tagOpenRegex = new RegExp(tagOpen, 'gi');
        var tagCloseRegex = new RegExp(tagClose, 'gi');
        contentString = contentString.replace(tagOpenRegex, '<');
        contentString = contentString.replace(tagCloseRegex, '>');
        contentString = contentString.replace(/&amp;/gi, '&'); // TODO ??
        contentString = contentString.replace(/&/gi, '&amp;');

        return contentString;
    } catch(e) {
        console.log(e);
    }
}

//////
function getImageSrc(srcTxt) {
    if (!srcTxt) {
        return '';
    }
    allImgSrc[srcTxt] = 'img-' + (imageIndex++) + '.' + getFileExtension(srcTxt);
    return '../images/' + allImgSrc[srcTxt];
}

function getHref(hrefTxt) {
    if (!hrefTxt) {
        return '';
    }
    if (hrefTxt.indexOf('#') === 0) {
        hrefTxt = window.location.href + hrefTxt;
    }
    if (hrefTxt.indexOf('/') === 0) {
        hrefTxt = window.location.protocol + '//' + window.location.hostname + hrefTxt;
    }
    // hrefTxt = escape(hrefTxt); // TODO
    return hrefTxt;
}

// https://github.com/blowsie/Pure-JavaScript-HTML5-Parser
function sanitize(rawContent) {

    var srcTxt = '';
    var dirty = null;
    try {
        var tel = document.createElement('div');
        tel.appendChild(rawContent.cloneNode(true));
        dirty = '<div>' + tel.innerHTML + '</div>';


        /////////////////

        wdirty = $.parseHTML(dirty);
        $wdirty = $(wdirty);
        $wdirty.find('script, style, svg, canvas, noscript').remove();
        $wdirty.find('*:empty').not('img').remove();

        dirty = $wdirty.html();

        // dirty = dirty.replace(/&nbsp;/gi, '');
        // dirty = HTMLtoXML(dirty);

        ////////////////


        return force(dirty);


        // var dirty = '<div>' + document.getElementsByTagName('body')[0].innerHTML + '</div>';

        var results = '';
        var lastFragment = '';
        var lastTag = '';
        var inList = false;
        var allowedTags = ['div', 'p', 'code', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'blockquote',
            'img', 'a', 'ol', 'ul', 'li', 'b', 'i', 'sup', 'strong', 'strike',
            'table', 'tr', 'td', 'th', 'thead', 'tbody', 'pre', 'em'
        ];
        var allowedTextTags = ['h4', 'h5', 'h6', 'span'];

        HTMLParser(dirty, {
            start: function(tag, attrs, unary) {
                lastTag = tag;
                if (allowedTags.indexOf(tag) < 0) {
                    return;
                }

                if (tag === 'ol' || tag === 'ul') {
                    inList = true;
                }
                if (tag === 'li' && !inList) {
                    tag = 'p';
                }


                if (tag === 'img') {
                    var tattrs = attrs.filter(function(attr) {
                        return attr.name === 'src';
                    }).map(function(attr) {
                        return getImageSrc(attr.escaped);
                    });
                    lastFragment = tattrs.length === 0 ? '<img></img>' : '<img src="' + tattrs[0] + '" alt=""></img>';
                } else if (tag === 'a') {
                    var tattrs = attrs.filter(function(attr) {
                        return attr.name === 'href';
                    }).map(function(attr) {
                        return getHref(attr.escaped);
                    });
                    lastFragment = tattrs.length === 0 ? '<a>' : '<a href="' + tattrs[0] + '">';
                } else {
                    lastFragment = '<' + tag + '>';
                }

                results += lastFragment;
                lastFragment = '';
            },
            end: function(tag) {
                if (allowedTags.indexOf(tag) < 0 || tag === 'img') {
                    return;
                }

                if (tag === 'ol' || tag === 'ul') {
                    inList = false;
                }
                if (tag === 'li' && !inList) {
                    tag = 'p';
                }

                results += "</" + tag + ">\n";
            },
            chars: function(text) {
                if (lastTag !== '' && allowedTags.indexOf(lastTag) < 0) {
                    return;
                }
                results += text;
            },
            comment: function(text) {
                // results += "<!--" + text + "-->";
            }
        });

        // results = results.replace(/<([^>]+?)>\s*<\/\1>/gim, '');
        results = results.replace(/&[a-z]+;/gim, '');

        return results;

    } catch (e) {
        console.trace();
        console.log(e);

        return force(dirty);
    }

}


function getPageUrl(url) {
    console.log('ooooo');
    return url.toLowerCase().replace(/\s+/g,'_').replace(/[^a-z0-9_]/g,'') + Math.floor(Math.random() * 10000) + '.xhtml';
}

var pageIndex = 0;
function getPageTitle(title) {
    try {
        console.log('ppppp', title);
        if (title.trim() === '') {
            return 'page-' + pageIndex++;
        }
        var tmp = title;
        console.log('gigi 2', tmp);
        return title;
    } catch (e) {
        console.log(e);
    } finally {

    }

}

function bibi(inp) {
    return inp;
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log('Start saving...');

    var pageSrc = '';
    if (request.type === 'whole-page') {
        pageSrc = document.getElementsByTagName('body')[0];
        allPages.push({
            url: getPageUrl(document.title),
            title: bibi(document.title), //gatPageTitle(document.title),
            content: pageSrc
        });
        console.log('aici');
        buildEbook();
    } else if (request.type === 'selection') {
        pageSrc = getSelectedNodes();
        allPages.push({
            url: getPageUrl(document.title),
            title: gatPageTitle(document.title),
            content: pageSrc
        });
        buildEbook();
    } else if (request.type === 'show-buffer') {
        // window.open(chrome.extension.getURL('chapter-editor/chapter-editor.html'), 'Chapter Editor');

        chrome.tabs.create({
            url: chrome.extension.getURL('chapter-editor/chapter-editor.html'),
            active: false
        }, function(tab) {
            // After the tab has been created, open a window to inject the tab
            chrome.windows.create({
                tabId: tab.id,
                type: 'popup',
                focused: true
                // incognito, top, left, ...
            });
        });
    }

});


function getSelectedNodes() {
    if (document.selection) {
        // return document.selection.createRange().parentElement();
        return document.selection.createRange();
    } else {
        var selection = window.getSelection();
        if (selection.rangeCount > 0) {
            var range = selection.getRangeAt(0);
            var selectionContents = range.cloneContents();
            return selectionContents;
            // console.log(selectionContents.children.length, selectionContents.children[0].outerHTML);
        }
        // return selection.getRangeAt(0);
        // return selection.createRange();
    }
}

function prepareEbookContent(page) {
    var cleanContent = sanitize(page.content);

    alert();

    return '<?xml version="1.0" encoding="utf-8"?>' +
        '<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">' +
        '<head>' +
        '<title>' + page.title + '</title>' +
        '<link href="' + cssFileName + '" rel="stylesheet" type="text/css" />' +
        '</head><body>' +
        cleanContent +
        '</body></html>';
}

function getImagesIndex() {
    return Object.keys(allImgSrc).reduce(function(prev, elem, index) {
        return prev + '\n' + '<item href="images/' + allImgSrc[elem] + '" id="img' + index + '" media-type="image/' + getFileExtension(elem) + '"/>';
    }, '');
}

function getExternalLinksIndex() { // TODO ???
    return allExternalLinks.reduce(function(prev, elem, index) {
        return prev + '\n' + '<item href="' + elem + '" />';
    }, '');
}

function getFileExtension(fileName) {
    var tmpFileName = fileName.split('.').pop();
    if (tmpFileName.indexOf('?') > 0) {
        tmpFileName = tmpFileName.split('?')[0];
    }
    if (tmpFileName.trim() === '') {
        return 'jpg'; //TODO
    }
    return tmpFileName;
}

// function walkDOM(main) {
//     var arr = [];
//     var loop = function(main) {
//         do {
//             try {
//                 if (allowElements.indexOf(main.tagName.toLowerCase()) > -1) {
//                     arr.push(main);
//                 }
//             } catch (e) {
//             }
//             if (main.hasChildNodes()) {
//                 loop(main.firstChild);
//             }
//         }
//         while (main = main.nextSibling);
//     }
//     loop(main);
//     return arr;
// }


function deferredAddZip(url, filename, zip) {
    var deferred = $.Deferred();
    JSZipUtils.getBinaryContent(url, function(err, data) {
        if (err) {
            deferred.reject(err);
        } else {
            zip.file(filename, data, {
                binary: true
            });
            deferred.resolve(data);
        }
    });
    return deferred;
}

// http://ebooks.stackexchange.com/questions/1183/what-is-the-minimum-required-content-for-a-valid-epub
function buildEbook() {
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
        // '<li><a href="pages/' + pageName + '">' + ebookName + '</a></li>' +
        allPages.reduce(function (prev, page) {
            return prev + '\n' + '<li><a href="pages/' + page.url + '">' + page.title + '</a></li>';
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
        '<text></text>' +
        '</docTitle>' +
        '<navMap>' +
        // '<content src="pages/' + pageName + '" />' +
        allPages.reduce(function (prev, page, index) {
            return prev + '\n' +
            '<navPoint id="ebook' + index + '" playOrder="' + (index+1) + '">' +
            '<navLabel><text>' + page.title + '</text></navLabel>' +
            '<content src="pages/' + page.url + '" />' +
            '</navPoint>';
        }, '') +
        '</navMap>' +
        '</ncx>'
    );

    oebps.file(cssFileName, '');

    var pagesFolder = oebps.folder('pages');
    allPages.forEach(function (page) {
        pagesFolder.file(page.url,
            prepareEbookContent(page)
        );
    });


    oebps.file('content.opf',
        '<?xml version="1.0" encoding="UTF-8" ?>' +
        '<package xmlns="http://www.idpf.org/2007/opf" xmlns:dc="http://purl.org/dc/elements/1.1/" unique-identifier="db-id" version="3.0">' +
        '<metadata>' +
        '<dc:title id="t1">Title</dc:title>' +
        '<dc:identifier id="db-id">isbn</dc:identifier>' +
        '<meta property="dcterms:modified">2014-03-27T09:14:09Z</meta>' +
        '<dc:language>en</dc:language>' +
        '</metadata>' +
        '<manifest>' +
        '<item id="toc" properties="nav" href="toc.xhtml" media-type="application/xhtml+xml" />' +
        '<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml" />' +
        '<item id="template_css" href="' + cssFileName + '" media-type="text/css" />' +
        // '<item id="ebook" href="pages/' + pageName + '" media-type="application/xhtml+xml" />' + //properties="remote-resources"
        allPages.reduce(function (prev, page, index) {
            return prev + '\n' + '<item id="ebook' + index + '" href="pages/' + page.url + '" media-type="application/xhtml+xml" />';
        }, '') +
        getImagesIndex() +
        getExternalLinksIndex() +
        '</manifest>' +
        '<spine toc="ncx">' +
        // '<itemref idref="ebook" />' +
        allPages.reduce(function (prev, page, index) {
            return prev + '\n' + '<itemref idref="ebook' + index + '" />';
        }, '') +
        '</spine>' +
        '</package>'
    );

    ///////////////
    ///////////////
    var imgs = oebps.folder("images");
    var imgsPromises = [];
    // allImgSrc.forEach(function (imgSrc, index) {
    Object.keys(allImgSrc).forEach(function(imgSrc, index) {
        var tmpDeffered = deferredAddZip(imgSrc, allImgSrc[imgSrc], imgs);
        imgsPromises.push(tmpDeffered);
    });

    var done = false;

    $.when.apply($, imgsPromises).done(function() {
        done = true;
        zip.generateAsync({
                type: "blob"
            })
            .then(function(content) {
                saveAs(content, ebookName);
            });
        console.log("done !");
    }).fail(function(err) {
        alert(err);
    });

    setTimeout(function() {
        if (done) {
            return;
        }
        zip.generateAsync({
                type: "blob"
            })
            .then(function(content) {
                saveAs(content, ebookName);
            });
    }, 60000);

}
