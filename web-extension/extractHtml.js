
// Used to replace <img> src links that don't have a file extension
// If the image src doesn't have a file type:
// 1. Create a dummy link
// 2. Detect image type from the binary data & create new links
// 3. Replace all the dummy links in tmpGlobalContent with the new links
var tmpGlobalContent = null

var allImages = [];
var extractedImages = [];
var allowedTags = [
    'address', 'article', 'aside', 'footer', 'header', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'hgroup', 'nav', 'section', 'dd', 'div', 'dl', 'dt', 'figcaption', 'figure', 'hr', 'li',
    'main', 'ol', 'p', 'pre', 'ul', 'a', 'abbr', 'b', 'bdi', 'bdo', 'br', 'cite', 'code', 'data',
    'dfn', 'em', 'i', 'img', 'kbd', 'mark', 'q', 'rp', 'rt', 'rtc', 'ruby', 's', 'samp', 'small', 'span',
    'strong', 'sub', 'sup', 'time', 'u', 'var', 'wbr', 'del', 'ins', 'caption', 'col', 'colgroup',
    'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'tr',
    'math', 'maction', 'menclose', 'merror', 'mfenced', 'mfrac', 'mglyph', 'mi', 'mlabeledtr', 'mmultiscripts', 'mn', 'mo', 'mover', 'mpadded', 'mphantom', 'mroot',
    'mrow', 'ms', 'mspace', 'msqrt', 'mstyle', 'msub', 'msup', 'msubsup', 'mtable', 'mtd', 'mtext', 'mtr', 'munder', 'munderover', 'msgroup', 'mlongdiv', 'mscarries',
    'mscarry', 'mstack', 'semantics'
    // TODO ? 
    // ,'form', 'button'

    // TODO svg support ?
    // , 'svg', 'g', 'path', 'line', 'circle', 'text'
];
// const svgTags = ['svg', 'g', 'path', 'line', 'circle', 'text']
var mathMLTags = [
    'math', 'maction', 'menclose', 'merror', 'mfenced', 'mfrac', 'mglyph', 'mi', 'mlabeledtr', 'mmultiscripts', 'mn', 'mo', 'mover', 'mpadded', 'mphantom', 'mroot',
    'mrow', 'ms', 'mspace', 'msqrt', 'mstyle', 'msub', 'msup', 'msubsup', 'mtable', 'mtd', 'mtext', 'mtr', 'munder', 'munderover', 'msgroup', 'mlongdiv', 'mscarries',
    'mscarry', 'mstack', 'semantics'
]
var cssClassesToTmpIds = {};
var tmpIdsToNewCss = {};
var tmpIdsToNewCssSTRING = {};

// src: https://idpf.github.io/a11y-guidelines/content/style/reference.html
var supportedCss = [
    'background-color',
    'border',
    'color', 
    'font',
    'line-height',
    'list-style',
    'padding',
    'text-align', 
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

    // TODO move
    srcTxt = srcTxt.replace(/&amp;/g, '&')

    // TODO - convert <imgs> with svg sources to jpeg OR add support for svg

    let fileExtension = getFileExtension(srcTxt);
    if (fileExtension === '') {
       fileExtension = "TODO-EXTRACT"
    }
    let newImgFileName = 'img-' + generateRandomNumber(true) + '.' + fileExtension;

    let isB64Img = isBase64Img(srcTxt);
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

// tested
function extractMathMl($htmlObject) {
    $htmlObject.find('span[id^="MathJax-Element-"]').each(function (i, el) {
        $(el).replaceWith('<span>' + el.getAttribute('data-mathml') + '</span>');
    });
}

// tested
function extractCanvasToImg($htmlObject) {
    $htmlObject.find('canvas').each(function (index, elem) {
        try {
            let imgUrl = docEl.toDataURL('image/jpeg');
            $(elem).replaceWith('<img src="' + imgUrl + '" alt=""></img>');
        } catch (e) {
            console.log(e)
        }
    });
}

// tested
function extractSvgToImg($htmlObject) {
    let serializer = new XMLSerializer();
    $htmlObject.find('svg').each(function (index, elem) {
        // add width & height because the result image was too big
        let bbox = elem.getBoundingClientRect()
        let newWidth = bbox.width
        let newHeight = bbox.height
        let svgXml = serializer.serializeToString(elem);
        let imgSrc = 'data:image/svg+xml;base64,' + window.btoa(svgXml);
        $(elem).replaceWith('<img src="' + imgSrc + '" width="'+newWidth+'" height="'+newHeight+'">' + '</img>');
    });
}

// replaces all iframes by divs with the same innerHTML content
function extractIFrames() {
    let allIframes = document.getElementsByTagName('iframe')
    let changeIFrames = []
    let newDivs = []
    for (let iFrame of allIframes) {
        let bodyContent = iFrame.contentDocument.body.innerHTML        
        let bbox = iFrame.getBoundingClientRect()
        let newDiv = document.createElement('div')
        newDiv.style.width = bbox.width
        newDiv.style.height = bbox.height
        newDiv.innerHTML = bodyContent
        changeIFrames.push(iFrame)
        newDivs.push(newDiv)
    }
    for (let i = 0; i < newDivs.length; i++) {
        let newDiv = newDivs[i]
        let iFrame = changeIFrames[i]
        let iframeParent = iFrame.parentNode
        iframeParent.replaceChild(newDiv, iFrame)
    }
}

function preProcess($htmlObject) {
    // TODO
    // $htmlObject.find('script, style, noscript, iframe').remove();
    // $('body').find('script, style, noscript, iframe').remove()
    // $('body').find('script, style, noscript, iframe').contents().remove()
    // $('body').find('iframe').remove()
    // $('body').find('*:empty').not('img').not('br').not('hr').remove();
    // formatPreCodeElements($('body'));

    extractMathMl($htmlObject);
    extractCanvasToImg($htmlObject);
    extractSvgToImg($htmlObject);
}

function parseHTML(rawContentString) {
    allImages = [];
    extractedImages = [];
    let results = '';
    let lastFragment = '';
    let lastTag = '';

    try {
        HTMLParser(rawContentString, {
            start: function(tag, attrs, unary) {
                lastTag = tag;
                if (allowedTags.indexOf(tag) < 0) {
                    return;
                }

                if (tag === 'img') {
                    let tmpAttrsTxt = '';
                    let tmpSrc = ''
                    for (let i = 0; i < attrs.length; i++) {
                        if (attrs[i].name === 'src') {
                            tmpSrc = getImageSrc(attrs[i].value)
                            tmpAttrsTxt += ' src="' + tmpSrc + '"';
                        } else if (attrs[i].name === 'data-class') {
                            tmpAttrsTxt += ' class="' + attrs[i].value + '"';
                        } else if (attrs[i].name === 'width') {
                            // used when converting svg to img - the result image was too big
                            tmpAttrsTxt += ' width="' + attrs[i].value + '"';
                        } else if (attrs[i].name === 'height') {
                            // used when converting svg to img - the result image was too big
                            tmpAttrsTxt += ' height="' + attrs[i].value + '"';
                        }
                    }
                    if (tmpSrc === '') {
                        // ignore imgs without source
                        lastFragment = ''
                    } else {
                        lastFragment = tmpAttrsTxt.length === 0 ? '<img></img>' : '<img' + tmpAttrsTxt + ' alt=""></img>';
                    }
                } else if (tag === 'a') {
                    let tmpAttrsTxt = '';
                    for (let i = 0; i < attrs.length; i++) {
                        if (attrs[i].name === 'href') {
                            tmpAttrsTxt += ' href="' + getHref(attrs[i].value) + '"';
                        } else if (attrs[i].name === 'data-class') {
                            tmpAttrsTxt += ' class="' + attrs[i].value + '"';
                        }
                    }
                    lastFragment = tmpAttrsTxt.length === 0 ? '<a>' : '<a' + tmpAttrsTxt + '>';
                } else if (tag === 'br' || tag === 'hr') {
                    let tmpAttrsTxt = '';
                    for (let i = 0; i < attrs.length; i++) {
                        if (attrs[i].name === 'data-class') {
                            tmpAttrsTxt += ' class="' + attrs[i].value + '"';
                        }
                    }
                    lastFragment = '<' + tag + tmpAttrsTxt + '></' + tag + '>';
                } else if (tag === 'math') {
                    let tmpAttrsTxt = '';
                    tmpAttrsTxt += ' xmlns="http://www.w3.org/1998/Math/MathML"';
                    for (let i = 0; i < attrs.length; i++) {
                        if (attrs[i].name === 'alttext') {
                            tmpAttrsTxt += ' alttext="' + attrs[i].value + '"';
                        }
                    }
                    lastFragment = '<' + tag + tmpAttrsTxt + '>';
                } else {
                    let tmpAttrsTxt = '';
                    for (let i = 0; i < attrs.length; i++) {
                        if (attrs[i].name === 'data-class') {
                            tmpAttrsTxt += ' class="' + attrs[i].value + '"';
                        }
                    }
                    lastFragment = '<' + tag + tmpAttrsTxt + '>';
                }

                results += lastFragment;
                lastFragment = '';
            },
            end: function(tag) {
                if (allowedTags.indexOf(tag) < 0 || tag === 'img' || tag === 'br' || tag === 'hr') {
                    return;
                }

                results += "</" + tag + ">";
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

        // TODO - (re)move
        results = results.replace(/&nbsp;/gi, '&#160;');

        return results;

    } catch (e) {
        console.log('Error:', e);
        return 'Error: ' + e  //+"  " + force($(rawContentString))
    }

}

function getContent(htmlContent) {
    try {
        // TODO - move; called multiple times on selection
        preProcess($('body'))
        let tmp = document.createElement('div');
        tmp.appendChild(htmlContent.cloneNode(true));
        let tmpHtml = '<div>' + tmp.innerHTML + '</div>';
        return parseHTML(tmpHtml);
    } catch (e) {
        console.log('Error:', e);
        return htmlContent;
    }
}

/////

function getSelectedNodes() {
    // if (document.selection) {
        // return document.selection.createRange().parentElement();
        // return document.selection.createRange();
    // }
    let selection = window.getSelection();
    let docfrag = [];
    for (let i = 0; i < selection.rangeCount; i++) {
        docfrag.push(selection.getRangeAt(i).cloneContents());
    }
    return docfrag;
}

/////

function extractCss(includeStyle, appliedStyles) {
    if (includeStyle) {
        $('body').find('*').each((i, pre) => {
            let $pre = $(pre);

            if (allowedTags.indexOf(pre.tagName.toLowerCase()) < 0) return;
            if (mathMLTags.indexOf(pre.tagName.toLowerCase()) > -1) return;

            if (!$pre.is(':visible')) {
                $pre.replaceWith('');
            } else {
                if (pre.tagName.toLowerCase() === 'svg') return;

                let classNames = pre.getAttribute('class');
                if (!classNames) {
                    classNames = pre.getAttribute('id');
                    if (!classNames) {
                        classNames = pre.tagName + '-' + generateRandomNumber();
                    }
                }
                let tmpName = cssClassesToTmpIds[classNames];
                let tmpNewCss = tmpIdsToNewCss[tmpName];
                if (!tmpName) {
                    // TODO - collision  between class names when multiple pages
                    tmpName = generateRandomTag(2) + i
                    cssClassesToTmpIds[classNames] = tmpName;
                }
                if (!tmpNewCss) {
                    tmpNewCss = {};

                    for (let cssTagName of supportedCss) {
                        let cssValue = $pre.css(cssTagName);
                        if (cssValue && cssValue.length > 0) {
                            tmpNewCss[cssTagName] = cssValue;
                        }
                    }

                    // Reuse CSS - if the same css code was generated for another element, reuse it's class name

                    let tcss = JSON.stringify(tmpNewCss)
                    let found = false

                    if (Object.keys(tmpIdsToNewCssSTRING).length === 0) {
                        tmpIdsToNewCssSTRING[tmpName] = tcss;
                        tmpIdsToNewCss[tmpName] = tmpNewCss;
                    } else {
                        for (const key in tmpIdsToNewCssSTRING) {
                            if (tmpIdsToNewCssSTRING[key] === tcss) {
                                tmpName = key
                                found = true
                                break
                            }
                        }
                        if (!found) {
                            tmpIdsToNewCssSTRING[tmpName] = tcss;
                            tmpIdsToNewCss[tmpName] = tmpNewCss;
                        }
                    }
                }
                pre.setAttribute('data-class', tmpName);
            }
        });
        return jsonToCss(tmpIdsToNewCss);
    } else {
        // remove hidden elements when style is not included
        $('body').find('*').each((i, pre) => {
            let $pre = $(pre)
            if (!$pre.is(':visible')) {
                $pre.replaceWith('')
            }
        })
        let mergedCss = '';
        if (appliedStyles && appliedStyles.length > 0) {
            for (let i = 0; i < appliedStyles.length; i++) {
                mergedCss += appliedStyles[i].style;
            }
            return mergedCss;
        }
    }
    return null
}

/////

function deferredAddZip(url, filename) {
    let deferred = $.Deferred();
    JSZipUtils.getBinaryContent(url, function(err, data) {        
        if (err) {
            // deferred.reject(err); TODO
            console.log('Error:', err);
            deferred.resolve();
        } else {
            // TODO - move to utils.js
            if (filename.endsWith("TODO-EXTRACT")) {
                let oldFilename = filename
                let arr = (new Uint8Array(data)).subarray(0, 4);
                let header = "";
                for(let i = 0; i < arr.length; i++) {
                    header += arr[i].toString(16);
                }
                if (header.startsWith("89504e47")) {
                    filename = filename.replace("TODO-EXTRACT", "png")
                } else if (header.startsWith("47494638")) {
                    filename = filename.replace("TODO-EXTRACT", "gif")
                } else if (header.startsWith("ffd8ff")) {
                    filename = filename.replace("TODO-EXTRACT", "jpg")
                } else {
                    // ERROR
                    console.log("Error! Unable to extract the image type!");
                    deferred.resolve();
                }
                tmpGlobalContent = tmpGlobalContent.replace(oldFilename, filename)
            }
                        
            extractedImages.push({
                filename: filename,
                // TODO - must be JSON serializable
                data: base64ArrayBuffer(data)
            });
            
            deferred.resolve();
        }
    });
    return deferred;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    let imgsPromises = [];
    let result = {};
    let pageSrc = '';
    let tmpContent = '';
    let styleFile = null;

    extractIFrames()

    if (request.type === 'extract-page') {
        styleFile = extractCss(request.includeStyle, request.appliedStyles)
        pageSrc = document.getElementsByTagName('body')[0];
        tmpContent = getContent(pageSrc);
    } else if (request.type === 'extract-selection') {
        styleFile = extractCss(request.includeStyle, request.appliedStyles)
        pageSrc = getSelectedNodes();
        pageSrc.forEach((page) => {
            tmpContent += getContent(page);
        });
    }

    tmpGlobalContent = tmpContent

    allImages.forEach((tmpImg) => {
        imgsPromises.push(deferredAddZip(tmpImg.originalUrl, tmpImg.filename));
    });

    $.when.apply($, imgsPromises).done(() => {
        let tmpTitle = getPageTitle(document.title);
        result = {
            url: getPageUrl(tmpTitle),
            title: tmpTitle,
            baseUrl: getCurrentUrl(),
            styleFileContent: styleFile,
            styleFileName: 'style' + generateRandomNumber() + '.css',
            images: extractedImages,
            content: tmpGlobalContent
        };
        sendResponse(result);
    }).fail((e) => {
        console.log('Error:', e);
        sendResponse(null)
    });

    return true;
});
