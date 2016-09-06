var allImages = [];
var extractedImages = [];
var maxNrOfElements = 20000;
var allowedTags = [
    'address', 'article', 'aside', 'footer', 'header', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'hgroup', 'nav', 'section', 'dd', 'div', 'dl', 'dt', 'figcaption', 'figure', 'hr', 'li',
    'main', 'ol', 'p', 'pre', 'ul', 'a', 'abbr', 'b', 'bdi', 'bdo', 'br', 'cite', 'code', 'data',
    'dfn', 'em', 'i', 'img', 'kbd', 'mark', 'q', 'rp', 'rt', 'rtc', 'ruby', 's', 'samp', 'small', 'span',
    'strong', 'sub', 'sup', 'time', 'u', 'var', 'wbr', 'del', 'ins', 'caption', 'col', 'colgroup',
    'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'tr',
    'math', 'maction', 'menclose', 'merror', 'mfenced', 'mfrac', 'mglyph', 'mi', 'mlabeledtr', 'mmultiscripts', 'mn', 'mo', 'mover', 'mpadded', 'mphantom', 'mroot',
    'mrow', 'ms', 'mspace', 'msqrt', 'mstyle', 'msub', 'msup', 'msubsup', 'mtable', 'mtd', 'mtext', 'mtr', 'munder', 'munderover', 'msgroup', 'mlongdiv', 'mscarries',
    'mscarry', 'mstack'
];

//////

function getImageSrc(srcTxt) {
    if (!srcTxt) {
        return '';
    }
    srcTxt = srcTxt.trim();
    if (srcTxt === '') {
        return '';
    }
    var isB64Img = isBase64Img(srcTxt);
    var fileExtension = getFileExtension(srcTxt);
    var newImgFileName = 'img-' + (Math.floor(Math.random()*1000000*Math.random()*100000)) + '.' + fileExtension;

    if (isB64Img) {
        extractedImages.push({
            filename: newImgFileName, // TODO name
            data: getBase64ImgData(srcTxt)
        });
    } else {
        allImages.push({
            originalUrl: getImgDownloadUrl(srcTxt),
            filename: newImgFileName,  // TODO name
        });
    }

    return '../images/' + newImgFileName;
}

function generateRandomTag() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

    for(var i = 0; i < 5; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

function formatPreCodeElements($jQueryElement) {
    $jQueryElement.find('pre').each(function (i, pre) {
        $(pre).replaceWith('<pre>' + pre.innerText + '</pre>');
    });
    $jQueryElement.find('code').each(function (i, pre) {
        $(pre).replaceWith('<code>' + pre.innerText + '</code>');
    });
}

function extractMathMl($htmlObject) {
    $htmlObject.find('span[id^="MathJax-Element-"]').each(function (i, el) {
        $(el).replaceWith('<span>' + el.getAttribute('data-mathml') + '</span>');
    });
}

function preProcess($htmlObject) {
    extractMathMl($htmlObject);
    $htmlObject.find('script, style, svg, canvas, noscript, iframe').remove();
    $htmlObject.find('*:empty').not('img').remove();
    formatPreCodeElements($htmlObject);
}

function force($content, withError) {
    try {
        var tagOpen = '@@@' + generateRandomTag();
        var tagClose = '###' + generateRandomTag();
        var startEl = '<object>';
        var endEl = '</object>';

        if (withError) {
            $content = $($content);
            preProcess($content);
        }

        $content.find('img').each(function (index, elem) {
            var imgSrc = getImageSrc($(elem).attr('src'));
            if (imgSrc === '') {
                $(elem).replaceWith('');
            } else {
                $(elem).replaceWith(startEl + tagOpen + 'img src="' + imgSrc + '"' + tagClose + tagOpen + '/img' + tagClose + endEl);
            }
        });

        $content.find('a').each(function (index, elem) {
            var aHref = getHref($(elem).attr('href'));
            if (aHref === '') {
                $(elem).replaceWith('');
            } else {
                $(elem).replaceWith(startEl + tagOpen + 'a href="' + aHref + '"' + tagClose + $(elem).html() + tagOpen + '/a' + tagClose + endEl);
            }
        });

        if ($('*').length < maxNrOfElements) {
            allowedTags.forEach(function (tagName) {
                var tmpElems = $content.find(tagName);
                while (tmpElems.length > 0) {
                    $tmpElem = $(tmpElems[0]);
                    $tmpElem.replaceWith(startEl + tagOpen + tagName + tagClose + $tmpElem.html() + tagOpen + '/' + tagName + tagClose + endEl);
                    tmpElems = $content.find(tagName);
                }
            });
        }

        var contentString = $content.text();

        var tagOpenRegex = new RegExp(tagOpen, 'gi');
        var tagCloseRegex = new RegExp(tagClose, 'gi');
        contentString = contentString.replace(tagOpenRegex, '<');
        contentString = contentString.replace(tagCloseRegex, '>');
        contentString = contentString.replace(/&nbsp;/gi, '&#160;');

        return contentString;
    } catch (e) {
        console.log('Error:', e);
        return '';
    }
}

function sanitize(rawContentString) {
    allImages = [];
    extractedImages = [];
    var srcTxt = '';
    var dirty = null;
    try {
        var wdirty = $.parseHTML(rawContentString);
        $wdirty = $(wdirty);

        preProcess($wdirty);

        if ($('*').length > maxNrOfElements) {
            return force($wdirty, false);
        }

        dirty = '<div>' + $wdirty.html() + '</div>';

        var results = '';
        var lastFragment = '';
        var lastTag = '';

        HTMLParser(dirty, {
            start: function(tag, attrs, unary) {
                lastTag = tag;
                if (allowedTags.indexOf(tag) < 0) {
                    return;
                }

                var tattrs = null;
                if (tag === 'img') {
                    tattrs = attrs.filter(function(attr) {
                        return attr.name === 'src';
                    }).map(function(attr) {
                        return getImageSrc(decodeHtmlEntity(attr.value));
                    });
                    lastFragment = tattrs.length === 0 ? '<img></img>' : '<img src="' + tattrs[0] + '" alt=""></img>';
                } else if (tag === 'a') {
                    tattrs = attrs.filter(function(attr) {
                        return attr.name === 'href';
                    }).map(function(attr) {
                        return getHref(decodeHtmlEntity(attr.value));
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

        results = results.replace(/&nbsp;/gi, '&#160;');

        return results;

    } catch (e) {
        console.log('Error:', e);
        return force(dirty, true);
    }

}

function getContent(htmlContent) {
    try {
        var tmp = document.createElement('div');
        tmp.appendChild(htmlContent.cloneNode(true));
        var dirty = '<div>' + tmp.innerHTML + '</div>';
        return sanitize(dirty);
    } catch (e) {
        console.log('Error:', e);
        return '';
    }
}

/////

function getPageUrl(url) {
    return url.toLowerCase().replace(/\s+/g,'_').replace(/[^a-z0-9_]/g,'') + Math.floor(Math.random() * 10000) + '.xhtml';
}

function getPageTitle(title) { //TODO
    return title;
}

function getSelectedNodes() {
    // if (document.selection) {
        // return document.selection.createRange().parentElement();
        // return document.selection.createRange();
    // }
    var selection = window.getSelection();
    var docfrag = [];
    for (var i = 0; i < selection.rangeCount; i++) {
        docfrag.push(selection.getRangeAt(i).cloneContents());
    }
    return docfrag;
}

/////

function deferredAddZip(url, filename) {
    var deferred = $.Deferred();
    JSZipUtils.getBinaryContent(url, function(err, data) {
        if (err) {
            // deferred.reject(err); TODO
            console.log('Error:', err);
            deferred.resolve();
        } else {
            extractedImages.push({
                filename: filename,
                data: base64ArrayBuffer(data)
            });
            deferred.resolve();
        }
    });
    return deferred;
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    var imgsPromises = [];
    var result = {};
    var pageSrc = '';
    var tmpContent = '';

    if (request.type === 'extract-page') {
        pageSrc = document.getElementsByTagName('body')[0];
        tmpContent = getContent(pageSrc);
    } else if (request.type === 'extract-selection') {
        pageSrc = getSelectedNodes();
        pageSrc.forEach(function (page) {
            tmpContent += getContent(page);
        });
    } else if (request.type === 'echo') {
        sendResponse({
            echo: true
        });
        return;
    }

    if (tmpContent.trim() === '') {
        return;
    }

    allImages.forEach(function (tmpImg) {
        imgsPromises.push(deferredAddZip(tmpImg.originalUrl, tmpImg.filename));
    });

    $.when.apply($, imgsPromises).done(function() {
        result = {
            url: getPageUrl(document.title),
            title: getPageTitle(document.title),
            baseUrl: getCurrentUrl(),
            images: extractedImages,
            content: tmpContent
        };
        sendResponse(result);
    }).fail(function(e) {
        console.log('Error:', e);
    });

    return true;
});
