var allImgSrc = {};

//////

function getCurrentUrl() {
    var url = window.location.href;
    if (url.indexOf('?') > 0) {
        url = window.location.href.split('?')[0];
    }
    url = url.substring(0, url.lastIndexOf('/')+1);
    return url;
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

function getImageSrc(srcTxt) {
    if (!srcTxt) {
        return '';
    }
    allImgSrc[srcTxt] = 'img-' + (Math.floor(Math.random()*1000000)) + '.' + getFileExtension(srcTxt);
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

        if ($('*').length < 3000) { // TODO
            inlineElements.forEach(function (tagName) {
                $content.find(tagName).each(function (index, elem) {
                    $(elem).replaceWith('<span>' + tagOpen + tagName + tagClose + $(elem).html() + tagOpen + '/' + tagName + tagClose + '</span>');
                });
            });
        }

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
    if (selection.rangeCount > 0) {
        var range = selection.getRangeAt(0);
        var selectionContents = range.cloneContents();
        return selectionContents;
    }
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log('Extract Html...');
    var result = {};
    var pageSrc = '';

    if (request.type === 'extract-page') {
        pageSrc = document.getElementsByTagName('body')[0];
        result = {
            url: getPageUrl(document.title),
            title: getPageTitle(document.title), //gatPageTitle(document.title),
            baseUrl: getCurrentUrl(),
            imgs: allImgSrc,
            content: getContent(pageSrc)
        };
    } else if (request.type === 'extract-selection') {
        pageSrc = getSelectedNodes();
        result = {
            url: getPageUrl(document.title),
            title: getPageTitle(document.title),
            baseUrl: getCurrentUrl(),
            imgs: allImgSrc,
            content: getContent(pageSrc)
        };
    }

    sendResponse(result);
    console.log('Html Extracted');
});
