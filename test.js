// document.body.style.border = "5px solid red";


// https://stuk.github.io/jszip/
// https://github.com/eligrey/FileSaver.js/

var cssFileName = 'ebook.css';
var pageName = 'ebook.xhtml';
var ebookName = "ebook-" + document.title + ".epub";

console.log('mmerge');

var pageSrc = document.getElementsByTagName('body')[0].innerHTML;
var pageSrc = document.getElementsByTagName('article')[0].innerHTML;

buildEbook(pageSrc);

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

function getSelectedNode()
{
    if (document.selection)
    	// return document.selection.createRange().parentElement();
    	return document.selection.createRange();
    else
    {
    	var selection = window.getSelection();
    	if (selection.rangeCount > 0) {
            var range = selection.getRangeAt(0);
            var selectionContents = range.cloneContents();
            console.log(selectionContents.children.length, selectionContents.children[0].outerHTML);
        }
    		// return selection.getRangeAt(0);
    		// return selection.createRange();
    }
}

function prepareEbookContent(rawContent) {

    // rawContent = rawContent.replace(/<svg.*<\/svg>/gi, '');
    // rawContent = rawContent.replace(/<script.*<\/script>/gi, '');
    // rawContent = rawContent.replace(/<canvas.*<\/canvas>/gi, '');
    // rawContent = rawContent.replace(/<[^\/].*>/gi, '<p>');
    // rawContent = rawContent.replace(/<\/.*>/gi, '</p>');
    // rawContent = rawContent.replace(/<[^<>]+>/gi, '');

    return '<?xml version="1.0" encoding="utf-8"?>' +
        '<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">' +
        '<head>' +
        '<title>' + ebookName + '</title>' +
        '<link href="' + cssFileName + '" rel="stylesheet" type="text/css" />' +
        '</head><body>' +
        rawContent +
        '</body></html>';
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
        '<item id="ebook" href="' + pageName + '" media-type="application/xhtml+xml" />' +
    '</manifest>' +
    '<spine toc="ncx">' +
        '<itemref idref="ebook" />' +
    '</spine>' +
    '</package>'
    );

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


    zip.generateAsync({type:"blob"})
    .then(function(content) {
        saveAs(content, ebookName);
    });
}
