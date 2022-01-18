function setIncludeStyle(includeStyle) {
    chrome.runtime.sendMessage({
        type: "set include style",
        includeStyle: includeStyle
    }, function(response) {
    });
}

function getIncludeStyle(callback) {
    chrome.runtime.sendMessage({
        type: "get include style"
    }, function(response) {
        callback(response.includeStyle);
    });
}

function setCurrentStyle(currentStyle) {
    chrome.runtime.sendMessage({
        type: "set current style",
        currentStyle: currentStyle
    }, function(response) {
    });
}

function getCurrentStyle(callback) {
    chrome.runtime.sendMessage({
        type: "get current style"
    }, function(response) {
        callback(response.currentStyle);
    });
}

function getStyles(callback) {
    chrome.runtime.sendMessage({
        type: "get styles"
    }, function(response) {
        callback(response.styles);
    });
}

function setStyles(styles) {
    chrome.runtime.sendMessage({
        type: "set styles",
        styles: styles
    }, function(response) {
    });
}

function getEbookTitle(callback) {
    chrome.runtime.sendMessage({
        type: "get title"
    }, function(response) {
        callback(response.title);
    });
}

function saveEbookTitle(title) {
    chrome.runtime.sendMessage({
        type: "set title",
        title: title
    }, function(response) {
    });
}

function getEbookPages(callback) {
    chrome.runtime.sendMessage({
        type: "get"
    }, function(response) {
        callback(response.allPages);
    });
}

function saveEbookPages(pages) {
    chrome.runtime.sendMessage({
        type: "set",
        pages: pages
    }, function(response) {});
}

function removeEbook() {
    chrome.runtime.sendMessage({
        type: "remove"
    }, function(response) {});
}

function checkIfBusy(callback) {
    chrome.runtime.sendMessage({
        type: "is busy?"
    }, function(response) {
        callback(response);
    });
}

function setIsBusy(isBusy) {
    chrome.runtime.sendMessage({
        type: "set is busy",
        isBusy: isBusy
    }, function(response) {});
}

/////
function getBaseUrl() {
	const base = document.querySelector("base");
	if (base) {
		return base.getAttribute("href");
	}
    let url = window.location.href;
    if (url.indexOf('?') > 0) {
        url = window.location.href.split('?')[0];
    }
    url = url.substring(0, url.lastIndexOf('/') + 1);
    return url;
}

function getOriginUrl() {
    let originUrl = window.location.origin;
    if (!originUrl) {
        originUrl = window.location.protocol + "//" + window.location.host;
    }
    return originUrl;
}

function getFileExtension(fileName) {
    try {
        let tmpFileName = '';

        if (isBase64Img(fileName)) {
            tmpFileName = getBase64ImgType(fileName);
        } else {
            tmpFileName = fileName.split('.').pop();
        }

        if (tmpFileName.indexOf('?') > 0) {
            tmpFileName = tmpFileName.split('?')[0];
        }
        tmpFileName = tmpFileName.toLowerCase();
        if (tmpFileName === 'jpg') {
            tmpFileName = 'jpeg';
        } else if (tmpFileName === 'svg+xml') {
            tmpFileName = 'svg';
        } 

        if (['png', 'gif', 'jpeg', 'svg'].indexOf(tmpFileName.trim()) < 0) {
            return ''
        }
        return tmpFileName;
    } catch (e) {
        console.log('Error:', e);
        return '';
    }
}

function getImageType(fileName) {
    let imageType = getFileExtension(fileName);
    if (imageType === 'svg') {
        imageType = 'svg+xml';
    }
    return imageType;
}

function getHref(hrefTxt) {
    return getAbsoluteUrl(hrefTxt);
}

function getImgDownloadUrl(imgSrc) {
    return getAbsoluteUrl(imgSrc);
}

function getAbsoluteUrl(urlStr) {    
    if (!urlStr) {
        return '';
    }
    if (urlStr.length === 0) {
        return '';
    }
    try {
        urlStr = decodeHtmlEntity(urlStr);    
        let currentUrl = getBaseUrl();
        let originUrl = getOriginUrl();
        let absoluteUrl = urlStr;

        originUrl = removeEndingSlash(originUrl)
        currentUrl = removeEndingSlash(currentUrl)

        if (urlStr.indexOf('//') === 0) {
            absoluteUrl = window.location.protocol + urlStr;
        } else if (urlStr.indexOf('/') === 0) {
            absoluteUrl = originUrl + urlStr;
        } else if (urlStr.indexOf('#') === 0) {
            absoluteUrl = currentUrl + urlStr;
        } else if (urlStr.indexOf('http') !== 0) {
            absoluteUrl = currentUrl + '/' + urlStr;
        }
        // TODO is this needed?
        // absoluteUrl = escapeXMLChars(absoluteUrl);
        return absoluteUrl;
    } catch (e) {
        console.log('Error:', e);
        return urlStr;
    }
}

function removeEndingSlash(inputStr) {
    if (inputStr.endsWith('/')) {
        return inputStr.substring(0, inputStr.length - 1);
    }
    return inputStr;
}

// https://gist.github.com/jonleighton/958841
function base64ArrayBuffer(arrayBuffer) {
    let base64 = '';
    let encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

    let bytes = new Uint8Array(arrayBuffer);
    let byteLength = bytes.byteLength;
    let byteRemainder = byteLength % 3;
    let mainLength = byteLength - byteRemainder;

    let a, b, c, d;
    let chunk;

    for (let i = 0; i < mainLength; i = i + 3) {
        chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
        a = (chunk & 16515072) >> 18;
        b = (chunk & 258048) >> 12;
        c = (chunk & 4032) >> 6;
        d = chunk & 63;
        base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d];
    }

    if (byteRemainder === 1) {
        chunk = bytes[mainLength];
        a = (chunk & 252) >> 2;
        b = (chunk & 3) << 4;
        base64 += encodings[a] + encodings[b] + '==';
    } else if (byteRemainder === 2) {
        chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1];
        a = (chunk & 64512) >> 10;
        b = (chunk & 1008) >> 4;
        c = (chunk & 15) << 2;
        base64 += encodings[a] + encodings[b] + encodings[c] + '=';
    }

    return base64;
}

// http://stackoverflow.com/questions/7394748/whats-the-right-way-to-decode-a-string-that-has-special-html-entities-in-it
function decodeHtmlEntity(str) {
  return str.replace(/&#(\d+);/g, function(match, dec) {
    return String.fromCharCode(dec);
  });
}

function isBase64Img(srcTxt) {
    return srcTxt.indexOf('data:image/') === 0 && srcTxt.indexOf(';base64,') > 0;
}

function getBase64ImgType(srcTxt) {
    try {
        return srcTxt.split(';')[0].split('/')[1];
    } catch (e) {
        console.log('Error:', e);
        return '';
    }
}

function getBase64ImgData(srcTxt) {
    try {
        return srcTxt.split(';base64,')[1];
    } catch (e) {
        console.log('Error:', e);
        return '';
    }
}

function getXPath(elm) {
    if (!elm) return ''

    let allNodes = document.getElementsByTagName('*');
    for (let segs = []; elm && elm.nodeType === 1; elm = elm.parentNode) {
        if (elm.hasAttribute('id')) {
            let uniqueIdCount = 0;
            for (let n = 0; n < allNodes.length; n++) {
                if (allNodes[n].hasAttribute('id') && allNodes[n].id === elm.id) {
                    uniqueIdCount++;
                }
                if (uniqueIdCount > 1) {
                    break;
                }
            }
            if (uniqueIdCount === 1) {
                segs.unshift('id("' + elm.getAttribute('id') + '")');
                return segs.join('/');
            } else {
                segs.unshift(elm.localName.toLowerCase() + '[@id="' + elm.getAttribute('id') + '"]');
            }
        } else if (elm.hasAttribute('class')) {
            segs.unshift(elm.localName.toLowerCase() + '[@class="' + elm.getAttribute('class') + '"]');
        } else {
            for (i = 1, sib = elm.previousSibling; sib; sib = sib.previousSibling) {
                if (sib.localName === elm.localName) {
                    i++;
                }
            }
            segs.unshift(elm.localName.toLowerCase() + '[' + i + ']');
        }
    }
    return segs.length ? '/' + segs.join('/') : null;
}

function lookupElementByXPath(path) {
    let evaluator = new XPathEvaluator();
    let result = evaluator.evaluate(path, document.documentElement, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    return  result.singleNodeValue;
}

function generateRandomTag(tagLen) {
    tagLen = tagLen || 5;
    let text = '';
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    for(let i = 0; i < tagLen; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

function generateRandomNumber(bigNr) {
    if (bigNr) {
        return Math.floor(Math.random()*1000000*Math.random()*1000000)        
    }
    return Math.floor(Math.random()*1000000)
}

function removeSpecialChars(text) {
    // FIXME remove white spaces ?
    return text.replace(/\//g, '-')
}

function escapeXMLChars(text) {
    return text.replace(/&/g, '&amp;')
                   .replace(/>/g, '&gt;')
                   .replace(/</g, '&lt;')
                   .replace(/"/g, '&quot;')
                   .replace(/'/g, '&apos;');
}

function getEbookFileName(name) {
    return name.replace(/&amp;/ig, '&')
                   .replace(/&gt;/ig, '')
                   .replace(/&lt;/ig, '')
                   .replace(/&quot;/ig, '')
                   .replace(/&apos;/ig, '');
}

function getPageUrl(url) {
    return url.toLowerCase().replace(/\s+/g,'_').replace(/[^a-z0-9_]/g,'') + Math.floor(Math.random() * 10000) + '.xhtml';
}

function getPageTitle(title) {
    if (title.trim().length === 0) {
        return 'ebook';
    }
    return title;
}

function jsonToCss(jsonObj) {
    let keys = Object.keys(jsonObj);
    let result = '';
    for (let i = 0; i < keys.length; i++) {
        let tmpJsonObj = jsonObj[keys[i]];
        let tmpKeys = Object.keys(tmpJsonObj);
        result += '.' + keys[i] + ' {';
        for (let j = 0; j < tmpKeys.length; j++) {
            result += tmpKeys[j] + ':' + tmpJsonObj[tmpKeys[j]] + ';';
        }
        result += '} ';
    }
    return result;
}
