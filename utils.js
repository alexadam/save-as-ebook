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

/////
function getCurrentUrl() {
    var url = window.location.href;
    if (url.indexOf('?') > 0) {
        url = window.location.href.split('?')[0];
    }
    url = url.substring(0, url.lastIndexOf('/') + 1);
    return url;
}

function getOriginUrl() {
    var originUrl = window.location.origin;
    if (!originUrl) {
        originUrl = window.location.protocol + "//" + window.location.host;
    }
    return originUrl;
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
    // hrefTxt = escape(hrefTxt);
    return hrefTxt;
}

function getImgDownloadUrl(imgSrc) {
    var baseUrl = getOriginUrl();
    if (imgSrc.indexOf('//') === 0) {
        return baseUrl.split('//')[0] + imgSrc;
    }
    if (imgSrc.indexOf('http') !== 0) {
        if (imgSrc.indexOf('/') === 0) {
            return baseUrl + imgSrc;
        }
        return baseUrl + '/' + imgSrc;
    }
    return imgSrc;
}

// https://gist.github.com/jonleighton/958841
function base64ArrayBuffer(arrayBuffer) {
    var base64 = '';
    var encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

    var bytes = new Uint8Array(arrayBuffer);
    var byteLength = bytes.byteLength;
    var byteRemainder = byteLength % 3;
    var mainLength = byteLength - byteRemainder;

    var a, b, c, d;
    var chunk;

    for (var i = 0; i < mainLength; i = i + 3) {
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
