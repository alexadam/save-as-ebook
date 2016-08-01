var allImgSrc = {};
var allImgsData = {};
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
        console.log('ERROR');
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

/////

function base64ArrayBuffer(arrayBuffer) {
  var base64    = '';
  var encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

  var bytes         = new Uint8Array(arrayBuffer);
  var byteLength    = bytes.byteLength;
  var byteRemainder = byteLength % 3;
  var mainLength    = byteLength - byteRemainder;

  var a, b, c, d;
  var chunk;

  // Main loop deals with bytes in chunks of 3
  for (var i = 0; i < mainLength; i = i + 3) {
    // Combine the three bytes into a single integer
    chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];

    // Use bitmasks to extract 6-bit segments from the triplet
    a = (chunk & 16515072) >> 18; // 16515072 = (2^6 - 1) << 18
    b = (chunk & 258048)   >> 12; // 258048   = (2^6 - 1) << 12
    c = (chunk & 4032)     >>  6; // 4032     = (2^6 - 1) << 6
    d = chunk & 63;               // 63       = 2^6 - 1

    // Convert the raw binary segments to the appropriate ASCII encoding
    base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d];
  }

  // Deal with the remaining bytes and padding
  if (byteRemainder == 1) {
    chunk = bytes[mainLength];

    a = (chunk & 252) >> 2; // 252 = (2^6 - 1) << 2

    // Set the 4 least significant bits to zero
    b = (chunk & 3)   << 4; // 3   = 2^2 - 1

    base64 += encodings[a] + encodings[b] + '==';
  } else if (byteRemainder == 2) {
    chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1];

    a = (chunk & 64512) >> 10; // 64512 = (2^6 - 1) << 10
    b = (chunk & 1008)  >>  4; // 1008  = (2^6 - 1) << 4

    // Set the 2 least significant bits to zero
    c = (chunk & 15)    <<  2; // 15    = 2^4 - 1

    base64 += encodings[a] + encodings[b] + encodings[c] + '=';
  }

  return base64;
}

function deferredAddZip(url, filename, zip) {
    var deferred = $.Deferred();
    JSZipUtils.getBinaryContent(url, function(err, data) {
        if (err) {
            deferred.reject(err);
        } else {
            allImgsData[filename] = base64ArrayBuffer(data);
            // zip.file(filename, data, {
            //     binary: true
            // });
            deferred.resolve(data);
        }
    });
    return deferred;
}

function getImgDownloadUrl(baseUrl, imgSrc) {
    if (imgSrc.indexOf('//') === 0) {
        return baseUrl.split('//')[0] + imgSrc;
    }
    if (imgSrc.indexOf('http') !== 0) {
        return baseUrl + '/' + imgSrc;
    }
    return imgSrc;
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
        tmpContent = getContent(pageSrc);
    }

    if (tmpContent.trim() === '') {
        return;
    }

    Object.keys(allImgSrc).forEach(function(imgSrc, index) {
        try {
            var tmpDeffered = deferredAddZip(getImgDownloadUrl(getCurrentUrl(), imgSrc), allImgSrc[imgSrc]);
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
        console.log('Html Extracted');
        sendResponse(result);
    }).fail(function(err) {
        console.log('ERROR', JSON.stringify(err));
        // alert('99999 ' + JSON.stringify(err));
    });

    return true;
});
