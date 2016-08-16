var allImgSrc = {};
var allImgsData = {};
var maxNrOfElements = 10000;
//////

function getImageSrc(srcTxt) {
    if (!srcTxt) {
        return '';
    }
    allImgSrc[srcTxt] = 'img-' + (Math.floor(Math.random()*1000000)) + '.' + getFileExtension(srcTxt);
    return '../images/' + allImgSrc[srcTxt];
}

function force(contentString) {
    try {
        var tagOpen = '@@@'; //TODO
        var tagClose = '###';
        var inlineElements = ['h1', 'h2', 'h3', 'sup', 'b', 'i', 'em', 'code', 'pre', 'p'];
        var replaceElements = [['li', 'p']];

        var $content = $(contentString);

        // TODO replace li with p

        $content.find('img').each(function (index, elem) {
            $(elem).replaceWith('<span>' + tagOpen + 'img src="' + getImageSrc($(elem).attr('src')) + '"' + tagClose + tagOpen + '/img' + tagClose + '</span>');
        });

        $content.find('a').each(function (index, elem) {
            $(elem).replaceWith('<span>' + tagOpen + 'a href="' + getHref($(elem).attr('href')) + '"' + tagClose + $(elem).html() + tagOpen + '/a' + tagClose + '</span>');
        });

        if ($('*').length < maxNrOfElements) { // TODO
            inlineElements.forEach(function (tagName) {
                $content.find(tagName).each(function (index, elem) {
                    var $elem = $(elem);
                    $elem.replaceWith('<span>' + tagOpen + tagName + tagClose + $elem.html() + tagOpen + '/' + tagName + tagClose + '</span>');
                });
            });

            replaceElements.forEach(function (replacePair) {
                var tagName = replacePair[1];
                $content.find(replacePair[0]).each(function (index, elem) {
                    var $elem = $(elem);
                    $elem.replaceWith('<span>' + tagOpen + tagName + tagClose + $elem.html() + tagOpen + '/' + tagName + tagClose + '</span>');
                });
            });
        }

        contentString = $content.text();

        var tagOpenRegex = new RegExp(tagOpen, 'gi');
        var tagCloseRegex = new RegExp(tagClose, 'gi');
        contentString = contentString.replace(tagOpenRegex, '<');
        contentString = contentString.replace(tagCloseRegex, '>');
        contentString = contentString.replace(/&amp;/gi, '&');
        contentString = contentString.replace(/&/gi, '&amp;');

        return contentString;
    } catch(e) {
        console.log(e);
    }
}

// https://github.com/blowsie/Pure-JavaScript-HTML5-Parser
function sanitize(rawContentString) {
    allImgSrc = {};
    var srcTxt = '';
    var dirty = null;
    try {
        // dirty = getHtmlAsString(rawContent);
        wdirty = $.parseHTML(rawContentString);
        $wdirty = $(wdirty);
        $wdirty.find('script, style, svg, canvas, noscript').remove();
        $wdirty.find('*:empty').not('img').remove();

        dirty = '<div>' + $wdirty.html() + '</div>';

        ////////////////

        return force(dirty); // TODO


        /// TODO

        if ($('*').length < maxNrOfElements) { // TODO
            return force(dirty); // TODO
        }




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

                var tattrs = null;
                if (tag === 'img') {
                    tattrs = attrs.filter(function(attr) {
                        return attr.name === 'src';
                    }).map(function(attr) {
                        return getImageSrc(attr.escaped);
                    });
                    lastFragment = tattrs.length === 0 ? '<img></img>' : '<img src="' + tattrs[0] + '" alt=""></img>';
                } else if (tag === 'a') {
                    tattrs = attrs.filter(function(attr) {
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

function getContent(htmlContent) {
    try {
        var tmp = document.createElement('div');
        tmp.appendChild(htmlContent.cloneNode(true));
        var dirty = '<div>' + tmp.innerHTML + '</div>';
        return sanitize(dirty);
    } catch (e) {
        console.log(e);
        return '';
    }
}

/////

function getPageUrl(url) {
    return url.toLowerCase().replace(/\s+/g,'_').replace(/[^a-z0-9_]/g,'') + Math.floor(Math.random() * 10000) + '.xhtml';
}

function getPageTitle(inp) { //TODO
    return inp;
}

function getSelectedNodes() {
    if (document.selection) {
        // return document.selection.createRange().parentElement();
        return document.selection.createRange();
    }
    var selection = window.getSelection();
    var docfrag = [];
    for (var i = 0; i < selection.rangeCount; i++) {
        docfrag.push(selection.getRangeAt(i).cloneContents());
    }
    return docfrag;
}

/////

function deferredAddZip(url, filename, zip) {
    var deferred = $.Deferred();
    JSZipUtils.getBinaryContent(url, function(err, data) {
        if (err) {
            deferred.reject(err);
        } else {
            allImgsData[filename] = base64ArrayBuffer(data);
            deferred.resolve(data);
        }
    });
    return deferred;
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log('Extract Html...');
    var imgsPromises = [];
    allImgSrc = {};
    allImgsData = {};
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
    }

    if (tmpContent.trim() === '') {
        return;
    }

    Object.keys(allImgSrc).forEach(function(imgSrc, index) {
        try {
            var tmpDeffered = deferredAddZip(getImgDownloadUrl(imgSrc), allImgSrc[imgSrc]);
            imgsPromises.push(tmpDeffered);
        } catch (e) {
            alert(e);
            console.log(e);
        }
    });

    $.when.apply($, imgsPromises).done(function() {
        result = {
            url: getPageUrl(document.title),
            title: getPageTitle(document.title), //gatPageTitle(document.title),
            baseUrl: getCurrentUrl(),
            imgs: allImgSrc,
            imgsData: allImgsData,
            content: tmpContent
        };
        sendResponse(result);
    }).fail(function(err) {
        console.log('ERROR', JSON.stringify(err));
    });

    return true;
});
