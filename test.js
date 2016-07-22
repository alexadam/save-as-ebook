// document.body.style.border = "5px solid red";


// https://stuk.github.io/jszip/
// https://github.com/eligrey/FileSaver.js/


var cssFileName = 'ebook.css';
var pageName = 'ebook.xhtml';
var ebookName = "ebook-" + document.title + ".epub";
var imageIndex = 0;
var allImgSrc = {};
var allExternalLinks = [];

//////
//////
function getImageSrc(srcTxt) {
    if (!srcTxt) {
        return '';
    }
    allImgSrc[srcTxt] = 'img-' + (imageIndex++) + '.' + getFileExtension(srcTxt);
    return 'images/' + allImgSrc[srcTxt];
}

function getHref(hrefTxt) {
    if (!hrefTxt) {
        return '';
    }
    if (hrefTxt.indexOf('#') === 0) {
        return window.location.href + hrefTxt;
    }
    if (hrefTxt.indexOf('/') === 0) {
        return window.location.protocol + '//' + window.location.hostname + hrefTxt;
    }
    return hrefTxt;
}

function sanitize(rawContent) {

    var srcTxt = '';
    try {
        var tel = document.createElement('div');
        tel.appendChild(rawContent.cloneNode(true));

        // var dirty = '<div>' + document.getElementsByTagName('body')[0].innerHTML + '</div>';
        var dirty = '<div>' + tel.innerHTML + '</div>';

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

        results = results.replace(/<([^>]+?)>\s*<\/\1>/gim, '');
        results = results.replace(/&[a-z]+;/gim, '');

        return results;

    } catch (e) {
        console.trace();
        console.log(e);
    }

}




chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log('Start saving...');

    if (request.type === 'whole-page') {
        var pageSrc = document.getElementsByTagName('body')[0];
        buildEbook(pageSrc);
    } else if (request.type === 'selection') {
        var pageSrc = getSelectedNodes();
        buildEbook(pageSrc);
    }

    /// TODO use storage
    // else if (request.type === 'selection-to-buffer') {
    //     var pageSrc = getSelectedNodes();
    //     buffer.push(pageSrc)
    // } else if (request.type === 'save-buffer') {
    //     console.log('BUFFER', buffer);
    //     pageSrc = buffer.join();
    //     buildEbook(pageSrc);
    // }


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

function prepareEbookContent(rawContent) {

    var cleanContent = sanitize(rawContent);

    alert();

    return '<?xml version="1.0" encoding="utf-8"?>' +
        '<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">' +
        '<head>' +
        '<title>' + ebookName + '</title>' +
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
function buildEbook(ebookContent) {
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
        '<li><a href="' + pageName + '">' + ebookName + '</a></li>' +
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
        '<navPoint id="ebook" playOrder="1">' +
        '<navLabel><text>cover</text></navLabel>' +
        '<content src="' + pageName + '" />' +
        '</navPoint>' +
        '</navMap>' +
        '</ncx>'
    );

    oebps.file(cssFileName, '');

    oebps.file(pageName,
        prepareEbookContent(ebookContent)
    );

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
        '<item id="ebook" href="' + pageName + '" media-type="application/xhtml+xml" />' + //properties="remote-resources"
        getImagesIndex() +
        getExternalLinksIndex() +
        '</manifest>' +
        '<spine toc="ncx">' +
        '<itemref idref="ebook" />' +
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
