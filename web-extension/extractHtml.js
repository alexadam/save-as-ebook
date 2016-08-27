var allImages = [];
var extractedImages = [];
var maxNrOfElements = 10000;
//////

function getImageSrc(srcTxt) {
    if (!srcTxt) {
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

// function force3(dirty) {
//     var tagOpen = '@@@';// + generateRandomTag();
//     var tagClose = '###';// + generateRandomTag();
//     var removeElements = ['script', 'style', 'svg', 'canvas', 'noscript'];
//     var inlineElements = ['h1', 'h2', 'h3', 'sup', 'b', 'i', 'em', 'code', 'pre', 'p'];
//     var replaceElements = [['li', 'p'], ['tr', 'p']];
//
//     // var bodyClone = document.getElementsByTagName('body')[0].cloneNode(true);
//
//     var bodyClone = document.createElement('div');
//     bodyClone.innerHTML = dirty;
//
//
//     /////
//
//     var imgs = bodyClone.getElementsByTagName('img');
//     for (var i = 0; i < imgs.length; i++) {
//         var newImg = document.createElement('span');
//         newImg.innerHTML = tagOpen + 'img src="' + getImageSrc(imgs[i].getAttribute('src')) + '"' + tagClose + tagOpen + '/img' + tagClose;
//         imgs[i].parentNode.replaceChild(newImg, imgs[i]);
//     }
//
//     var links = bodyClone.getElementsByTagName('a');
//     for (i = 0; i < links.length; i++) {
//         var newLink = document.createElement('span');
//         newLink.innerHTML = tagOpen + 'a href="' + getHref(links[i].getAttribute('href')) + '"' + tagClose + links[i].innerHTML + tagOpen + '/a' + tagClose;
//         links[i].parentNode.replaceChild(newLink, links[i]);
//     }
//
//     for (i = 0; i < inlineElements.length; i++) {
//         var tagName = inlineElements[i];
//         var miscElements = bodyClone.getElementsByTagName(tagName);
//         for (var j = 0; j < miscElements.length; j++) {
//             var elemToBeReplaced = miscElements[j];
//             var newElement = document.createElement('span');
//             newElement.innerHTML = tagOpen + tagName + tagClose + elemToBeReplaced.innerHTML + tagOpen + '/' + tagName + tagClose;
//             elemToBeReplaced.parentNode.replaceChild(newElement, elemToBeReplaced);
//         }
//     }
//
//     for (i = 0; i < replaceElements.length; i++) {
//         var crtTagPair = replaceElements[i];
//         var searchForTag = crtTagPair[0];
//         var replaceWithTag = crtTagPair[1];
//         var miscElements = bodyClone.getElementsByTagName(searchForTag);
//         for (var j = 0; j < miscElements.length; j++) {
//             var elemToBeReplaced = miscElements[j];
//             var newElement = document.createElement('span');
//             newElement.innerHTML = tagOpen + replaceWithTag + tagClose + elemToBeReplaced.innerHTML + tagOpen + '/' + replaceWithTag + tagClose;
//             elemToBeReplaced.parentNode.replaceChild(newElement, elemToBeReplaced);
//         }
//     }
//
//     var contentString = bodyClone.innerText;
//
//     var tagOpenRegex = new RegExp(tagOpen, 'gi');
//     var tagCloseRegex = new RegExp(tagClose, 'gi');
//     contentString = contentString.replace(tagOpenRegex, '<');
//     contentString = contentString.replace(tagCloseRegex, '>');
//     contentString = contentString.replace(/&amp;/gi, '&');
//     contentString = contentString.replace(/&/gi, '&amp;');
//
//     return contentString;
//
// }

function force(contentString) {
    try {
        var tagOpen = '@@@' + generateRandomTag();
        var tagClose = '###' + generateRandomTag();
        var inlineElements = ['h1', 'h2', 'h3', 'sup', 'b', 'i', 'em', 'code', 'pre', 'p'];
        var replaceElements = [['li', 'p'], ['tr', 'p']];

        var $content = $(contentString);

        formatPreCodeElements($content);

        $content.find('img').each(function (index, elem) {
            $(elem).replaceWith('<span>' + tagOpen + 'img src="' + getImageSrc($(elem).attr('src').trim()) + '"' + tagClose + tagOpen + '/img' + tagClose + '</span>');
        });

        $content.find('a').each(function (index, elem) {
            $(elem).replaceWith('<span>' + tagOpen + 'a href="' + getHref($(elem).attr('href').trim()) + '"' + tagClose + $(elem).html() + tagOpen + '/a' + tagClose + '</span>');
        });

        if ($('*').length < maxNrOfElements) {
            replaceElements.forEach(function (replacePair) {
                var searchFor = replacePair[0];
                var tagName = replacePair[1];
                var tmpElems = $content.find(searchFor);
                while (tmpElems.length > 0) {
                    $tmpElem = $(tmpElems[0]);
                    $tmpElem.replaceWith('<span>' + tagOpen + tagName + tagClose + $tmpElem.html() + tagOpen + '/' + tagName + tagClose + '</span>');
                    tmpElems = $content.find(searchFor);
                }
            });

            inlineElements.forEach(function (tagName) {
                var tmpElems = $content.find(tagName);
                while (tmpElems.length > 0) {
                    $tmpElem = $(tmpElems[0]);
                    $tmpElem.replaceWith('<span>' + tagOpen + tagName + tagClose + $tmpElem.html() + tagOpen + '/' + tagName + tagClose + '</span>');
                    tmpElems = $content.find(tagName);
                }
            });
        }

        contentString = $content.text();

        var tagOpenRegex = new RegExp(tagOpen, 'gi');
        var tagCloseRegex = new RegExp(tagClose, 'gi');
        contentString = contentString.replace(tagOpenRegex, '<');
        contentString = contentString.replace(tagCloseRegex, '>');
        contentString = contentString.replace(/&amp;nbsp;/gi, '&#160;');

        return contentString;
    } catch (e) {
        console.log('Error:', e);
    }
}

// https://github.com/blowsie/Pure-JavaScript-HTML5-Parser
function sanitize(rawContentString) {
    allImages = [];
    extractedImages = [];
    var srcTxt = '';
    var dirty = null;
    try {
        var wdirty = $.parseHTML(rawContentString);
        $wdirty = $(wdirty);
        $wdirty.find('script, style, svg, canvas, noscript').remove(); // TODO remove iframes
        $wdirty.find('*:empty').not('img').remove();
        formatPreCodeElements($wdirty);

        dirty = '<div>' + $wdirty.html() + '</div>';

        if ($('*').length > maxNrOfElements) {
            return force(dirty);
        }

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

                var tattrs = null;
                if (tag === 'img') {
                    tattrs = attrs.filter(function(attr) {
                        return attr.name === 'src';
                    }).map(function(attr) {
                        return getImageSrc(decodeHtmlEntity(attr.value).trim());
                    });
                    lastFragment = tattrs.length === 0 ? '<img></img>' : '<img src="' + tattrs[0] + '" alt=""></img>';
                } else if (tag === 'a') {
                    tattrs = attrs.filter(function(attr) {
                        return attr.name === 'href';
                    }).map(function(attr) {
                        return getHref(decodeHtmlEntity(attr.value).trim());
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

        results = results.replace(/&nbsp;/gi, '&#160;');

        return results;

    } catch (e) {
        console.log('Error:', e);
        return force(dirty);
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
