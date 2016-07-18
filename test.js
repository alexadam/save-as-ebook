// document.body.style.border = "5px solid red";


// https://stuk.github.io/jszip/
// https://github.com/eligrey/FileSaver.js/




chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
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

var cssFileName = 'ebook.css';
var pageName = 'ebook.xhtml';
var ebookName = "ebook-" + document.title + ".epub";
var imgSrcRegex = /<img.*src="([^"]+)"/gi;
var allowElements = ['h1', 'h2', 'span', 'p', 'img', 'a', 'div', 'ul', 'ol', 'li'];
var imageIndex = 0;
var allImgSrc = {};
var allExternalLinks = [];



// console.log(pageSrc);
//
// var myimg = document.getElementsByTagName('img')[0];
// console.log(myimg, 'p[p[p[p[p]]]]');
//
// setTimeout(function () {
//     console.log(getSelectedNode());
// }, 3000);


if (myimg) {
    // var mysrc = myimg.src;
    //
    //
    // var zip = new JSZip();
    // zip.file("Hello.txt", mysrc + "\n");
    // var img = zip.folder("images");
    //
    // JSZipUtils.getBinaryContent(mysrc, function (err, data) {
    //    if(err) {
    //       throw err; // or handle the error
    //    }
    //    img.file("pic.png", data, {binary: true});
    //
    //    zip.generateAsync({type:"blob"})
    //    .then(function(content) {
    //        saveAs(content, "example.zip");
    //    });
    // });

    // deferredAddZip(my);


    // zip.generateAsync({type:"blob"})
    // .then(function(content) {
    //     saveAs(content, "example.zip");
    // });

}

// browser.tabs.insertCSS(
//   tabId,           // optional integer
//   details: {
//       file: "fonts.css"
//   },
//    runAt: "document_start",
//    allFrames: true
// )

function getSelectedNodes()
{
    if (document.selection) {
    	// return document.selection.createRange().parentElement();
    	return document.selection.createRange();
    }
    else
    {
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

function getString(node) {
    var tagName = '';
    if (!node.tagName) {
        tagName = 'p';
    } else {
        tagName = node.tagName.toLowerCase();
    }

    var innerText = node.innerText || node.textContent;
    var innerText = node.innerHTML;

    innerText = innerText.replace(/<[^>]*>[^<]*<[^>]*>/gi,'');
    innerText = innerText.replace(/<[^>]*>/gi,'');

    console.log(innerText);

    if (tagName === 'img') {
        allImgSrc[node.src] = 'img-' + (imageIndex++) + '.' + getFileExtension(node.src);
        return '<img src="' + ('images/' + allImgSrc[node.src]) + '"></img>';
    }
    if (tagName === 'a') {
        // allExternalLinks.push(node.href); // TODO ???
        return '<a href="' + (node.href) + '">'+innerText+'</a>';
    }

    if (innerText === '') {
        return '';
    }

    if (tagName === 'div') {
        if (node.hasChildNodes) {
            return '';
        }
        return '<p>' + innerText + '</p>';
    }

    return '<' + tagName + '>' + innerText + '</' + tagName + '>';
}

function prepareEbookContent(rawContent) {

    var tarr = walkDOM(rawContent);

    if (tarr.length === 0) {
        // if only simple text is selected
        var div = document.createElement('div');
        div.appendChild(rawContent.cloneNode(true));
        var rawContent = div.innerHTML;
        div.parentNode.remove(div);
    } else {
        var reduced = tarr.reduce(function (prev, crt, index) {
            return prev + getString(crt);
        }, '');
        rawContent = reduced;
    }

    alert();

    return '<?xml version="1.0" encoding="utf-8"?>' +
        '<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">' +
        '<head>' +
        '<title>' + ebookName + '</title>' +
        '<link href="' + cssFileName + '" rel="stylesheet" type="text/css" />' +
        '</head><body>' +
        rawContent +
        '</body></html>';
}

// function extractImgs(rawContent) {
//     $(rawContent).find('img').each(function (index, elem) {
//         var imgsrc = $(elem).attr('src');
//         try {
//             if (imgsrc.indexOf('http') === 0) {
//                 allImgSrc[imgsrc] = 'img-' + index + '.' + getFileExtension(imgsrc);
//             }
//         } catch (e) {
//         }
//     });
// }
//
// function replaceImgs(rawContent) {
//     var keys = Object.keys(allImgSrc);
//     for (var i = 0; i < keys.length; i++) {
//         rawContent = rawContent.replace(keys[i], 'images/' + allImgSrc[keys[i]]);
//     }
//     return rawContent;
// }

function getImagesIndex() {
    return Object.keys(allImgSrc).reduce(function (prev, elem, index) {
        return prev + '\n' + '<item href="images/'+allImgSrc[elem]+'" id="img'+index+'" media-type="image/'+getFileExtension(elem)+'"/>';
    }, '');
}

function getExternalLinksIndex() { // TODO ???
    return allExternalLinks.reduce(function (prev, elem, index) {
        return prev + '\n' + '<item href="'+elem+'" />';
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

function walkDOM(main) {
    var arr = [];
    var loop = function(main) {
        do {
            try {
                if (allowElements.indexOf(main.tagName.toLowerCase()) > -1) {
                    arr.push(main);
                }
            } catch (e) {
            }
            if (main.hasChildNodes()) {
                loop(main.firstChild);
            }
        }
        while (main = main.nextSibling);
    }
    loop(main);
    return arr;
}


function deferredAddZip(url, filename, zip) {
    var deferred = $.Deferred();
    JSZipUtils.getBinaryContent(url, function (err, data) {
        if(err) {
            deferred.reject(err);
        } else {
            zip.file(filename, data, {binary:true});
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
        '<item id="ebook" href="' + pageName + '" media-type="application/xhtml+xml" />' +  //properties="remote-resources"
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
    Object.keys(allImgSrc).forEach(function (imgSrc, index) {
        var tmpDeffered = deferredAddZip(imgSrc, allImgSrc[imgSrc], imgs);
        imgsPromises.push(tmpDeffered);
    });

    var done = false;

    $.when.apply($, imgsPromises).done(function () {
        done = true;
        zip.generateAsync({type:"blob"})
        .then(function(content) {
            saveAs(content, ebookName);
        });
        console.log("done !");
        }).fail(function (err) {
            alert(err);
        });

    setTimeout(function () {
        if (done) {
            return;
        }
        zip.generateAsync({type:"blob"})
        .then(function(content) {
            saveAs(content, ebookName);
        });
    }, 50000);

}
