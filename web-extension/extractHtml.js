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
    'mscarry', 'mstack', 'semantics'
];
var mathMLTags = [
    'math', 'maction', 'menclose', 'merror', 'mfenced', 'mfrac', 'mglyph', 'mi', 'mlabeledtr', 'mmultiscripts', 'mn', 'mo', 'mover', 'mpadded', 'mphantom', 'mroot',
    'mrow', 'ms', 'mspace', 'msqrt', 'mstyle', 'msub', 'msup', 'msubsup', 'mtable', 'mtd', 'mtext', 'mtr', 'munder', 'munderover', 'msgroup', 'mlongdiv', 'mscarries',
    'mscarry', 'mstack', 'semantics'
]
var cssClassesToTmpIds = {};
var tmpIdsToNewCss = {};

// src: https://idpf.github.io/a11y-guidelines/content/style/reference.html
// MM: maybe not the best idea, but all the extra attributes {background-image, position, z-index, background-*} go somewhat together on fancy article headers ;-)
var supportedCss = [
    'background-color', 
	'background-image', 'position', 'z-index', 'background-position', 'background-repeat', 'background-clip', 'background-origin', 'background-size', 
    'border', 'border-top', 'border-right', 'border-bottom', 'border-left', 'border-collapse', 'border-radius',
    'color', 'font', 'font-size', 'font-weight', 'font-family',
    'letter-spacing', 'line-height', 'float',
    'list-style', 'outline',
    'padding', 'quotes', 'text-align', 'text-justify', 'hyphens',
    'text-decoration', 'text-transform', 'word-spacing'
];
//////

function getFileName(url) {
	//this removes the anchor at the end, if there is one
	url = url.substring(0, (url.indexOf("#") == -1) ? url.length : url.indexOf("#"));
	//this removes the query after the file name, if there is one
	url = url.substring(0, (url.indexOf("?") == -1) ? url.length : url.indexOf("?"));
	//this removes everything before the last slash in the path
	url = url.substring(url.lastIndexOf("/") + 1, url.length);
	url =  decodeURI(url);
	console.log("MM: debug: new image name: "+url);	
	return url;
}

// MM: TODO: could turn landscape images by 90degrees for most portrait eInk readers.
//   -- improve mime detection avoid (larger) svg's for better compatibility...
//   -- Enahnce contrast /Eliminate background on drawing?
//   -- directly save image from cache
// Related: https://zocada.com/compress-resize-images-javascript-browser/
//          https://stackoverflow.com/questions/43467909/how-to-get-img-content-type-using-javascript-after-loading
function getImageSrc(srcTxt) {
    if (!srcTxt) {
        return '';
    }
    srcTxt = srcTxt.trim();
    if (srcTxt === '') {
        return '';
    }

	var newImgFileName = "";
    var fileExtension = getFileExtension(srcTxt);
    if (fileExtension === '') {
	   console.log("TODO: image source without handled extension: " + srcTxt);		
       // MM: return ''; 
	   // some image URLs have no extension
	   // TODO: Mime Type and Referrer would be good
	   // TODO2: better: reuse images already downloaded by Chrome/Firefox
	   // TODO3: svg or jpg... this hack currently depends on source web site ;-)
	   fileExtension = "jpg";
    } else {
	   newImgFileName = getFileName(srcTxt); // MM: get a better filename (easier to debug and dedupes. issue: same name with different content)
	}
	
if (newImgFileName === '' || isBase64Img(srcTxt)) {
         newImgFileName = 'img-' + (Math.floor(Math.random()*1000000*Math.random()*100000)) + '.' + fileExtension;
	}
	
    var isB64Img = isBase64Img(srcTxt);
    if (isB64Img) {
        extractedImages.push({
            filename: newImgFileName, // TODO name
            data: getBase64ImgData(srcTxt)
        });
    } else {
		// MM: console.log("MM: debug: allImages.push: "+ srcTxt + " " + newImgFileName );
        allImages.push({
            originalUrl: getImgDownloadUrl(srcTxt),
            filename: newImgFileName,  // TODO name
        });
    }

    return '../images/' + newImgFileName;
}

function formatPreCodeElements($jQueryElement) {
/* MM:  <pre> and <code> might be have fancy formatting (code snippets...)
    $jQueryElement.find('pre').each(function (i, pre) {
        $(pre).replaceWith('<pre>' + pre.innerText + '</pre>');
    });
    $jQueryElement.find('code').each(function (i, pre) {
        $(pre).replaceWith('<code>' + pre.innerText + '</code>');
    });
*/		
}

function extractMathMl($htmlObject) {
    $htmlObject.find('span[id^="MathJax-Element-"]').each(function (i, el) {
        $(el).replaceWith('<span>' + el.getAttribute('data-mathml') + '</span>');
    });
}

function extractCanvasToImg($htmlObject) {
    $htmlObject.find('canvas').each(function (index, elem) {
        var tmpXP = getXPath(elem);
        tmpXP = tmpXP.replace(/^\/div\[1\]/m, '/html[1]/body[1]');
        var docEl = lookupElementByXPath(tmpXP);
        var jpegUrl = docEl.toDataURL('image/png');
        $(elem).replaceWith('<img src="' + jpegUrl + '" alt=""></img>');
    });
}

function extractSvgToImg($htmlObject) {
    var serializer = new XMLSerializer();
    $htmlObject.find('svg').each(function (index, elem) {
        try {
            var svgXml = serializer.serializeToString(elem);
            var imgSrc = 'data:image/svg+xml;base64,' + window.btoa(svgXml);
            $(elem).replaceWith('<img src="' + imgSrc + '">' + '</img>');
        } catch (e) {
            console.log(e)
        } finally {}
    });
}

function preProcess($htmlObject) {
    extractMathMl($htmlObject);
    extractCanvasToImg($htmlObject);
    extractSvgToImg($htmlObject);
    $htmlObject.find('script, style, noscript, iframe').remove();
    $htmlObject.find('*:empty').not('td').not('img').not('br').not('hr').remove();  //MM: added <td> important for tables...
    formatPreCodeElements($htmlObject);
}

function force($content, withError) {
	console.log("MM: debug: force() called...");
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
            var $elem = $(elem);
            var imgSrc = getImageSrc($elem.attr('src'));
            if (imgSrc === '') {
                $elem.replaceWith('');
            } else {
                var className = $elem.attr('data-class');
                $elem.replaceWith(startEl + tagOpen + 'img src="' + imgSrc + '" class="' + className + '"' + tagClose + tagOpen + '/img' + tagClose + endEl);
            }
        });

        $content.find('a').each(function (index, elem) {
            var $elem = $(elem);
            var aHref = getHref($elem.attr('href'));
            if (aHref === '') {
                $elem.replaceWith('');
            } else {
                var className = $elem.attr('data-class');
                $elem.replaceWith(startEl + tagOpen + 'a href="' + aHref + '" class="' + className + '"' + tagClose + $(elem).html() + tagOpen + '/a' + tagClose + endEl);
            }
        });

        all($content);

        function all($startElement) {
            var tagName = $startElement.get(0).tagName.toLowerCase();
            if (allowedTags.indexOf(tagName) >= 0) {
                var children = $startElement.children();
                var childrenLen = children.length;
                while (childrenLen--) {
                    all($(children[childrenLen]));
                }
                var className = $startElement.attr('data-class');
                $startElement.replaceWith(startEl + tagOpen + tagName + ' class="' + className + '"' + tagClose + $startElement.html() + tagOpen + '/' + tagName + tagClose + endEl);
            }
        }

        var contentString = $content.text();

        var tagOpenRegex = new RegExp(tagOpen, 'gi');
        var tagCloseRegex = new RegExp(tagClose, 'gi');
        contentString = contentString.replace(tagOpenRegex, '<');
        contentString = contentString.replace(tagCloseRegex, '>');
        contentString = contentString.replace(/&nbsp;/gi, '&#160;');

        // getHref() replace does not work (&amp; is overwritten)
        contentString = escapeXMLChars(contentString);

        return contentString;
    } catch (e) {
        console.log('Error:', e);
        return '';
    }
}

function sanitize(rawContentString) {
	// MM: console.log("MM: debug: sanitize - allImages , extractedImages reset");    
	// MM: allImages = [];	- need to move this as background-image via CSS might already have used this...
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

        // MM: not sure about purpose: leads to extra top-element DIV-element in eBook?
		// dirty = '<div>' + $wdirty.html() + '</div>';
		dirty = $wdirty.html();

        var results = '';
        var lastFragment = '';
        var lastTag = '';

        HTMLParser(dirty, {
            start: function(tag, attrs, unary) {
                lastTag = tag;
                if (allowedTags.indexOf(tag) < 0) {
                    return;
                }

                if (tag === 'img') {
                    var tmpAttrsTxt = '';
                    let tmpSrc = ''
                    for (var i = 0; i < attrs.length; i++) {
                        if (attrs[i].name === 'src') {
                            tmpSrc = getImageSrc(attrs[i].value)
                            tmpAttrsTxt += ' src="' + tmpSrc + '"';
                        } else if (attrs[i].name === 'data-class') {
                            tmpAttrsTxt += ' class="' + attrs[i].value + '"';
                        }
                    }
                    if (tmpSrc === '') {
                        // ignore imgs without source
                        lastFragment = ''
                    } else {
                        lastFragment = tmpAttrsTxt.length === 0 ? '<img></img>' : '<img ' + tmpAttrsTxt + ' alt=""></img>';
                    }
                } else if (tag === 'a') {
                    var tmpAttrsTxt = '';
                    for (var i = 0; i < attrs.length; i++) {
                        if (attrs[i].name === 'href') {
                            tmpAttrsTxt += ' href="' + getHref(attrs[i].value) + '"';
                        } else if (attrs[i].name === 'data-class') {
                            tmpAttrsTxt += ' class="' + attrs[i].value + '"';
                        }
                    }
                    lastFragment = tmpAttrsTxt.length === 0 ? '<a>' : '<a ' + tmpAttrsTxt + '>';
                } else if (tag === 'br' || tag === 'hr') {
                    var tmpAttrsTxt = '';
                    for (var i = 0; i < attrs.length; i++) {
                        if (attrs[i].name === 'data-class') {
                            tmpAttrsTxt += ' class="' + attrs[i].value + '"';
                        }
                    }
                    lastFragment = '<' + tag + ' ' + tmpAttrsTxt + '></' + tag + '>';
                } else if (tag === 'math') {
                    var tmpAttrsTxt = '';
                    tmpAttrsTxt += ' xmlns="http://www.w3.org/1998/Math/MathML"';
                    for (var i = 0; i < attrs.length; i++) {
                        if (attrs[i].name === 'alttext') {
                            tmpAttrsTxt += ' alttext="' + attrs[i].value + '"';
                        }
                    }
                    lastFragment = '<' + tag + ' ' + tmpAttrsTxt + '>';
                } else {
                    var tmpAttrsTxt = '';
                    for (var i = 0; i < attrs.length; i++) {
                        if (attrs[i].name === 'data-class') {
                            tmpAttrsTxt += ' class="' + attrs[i].value + '"';
                        }
                    }
					// +++ MM: some more extras like colspan ...
					var extraAttrs = [ 'colspan', 'title', 'lang', 'span', 'name' ]; 
					for (var i = 0; i < attrs.length; i++) {						
                        if (extraAttrs.indexOf( attrs[i].name ) != -1 ) {
                          tmpAttrsTxt += ' '+attrs[i].name+'="' + attrs[i].value + '"'  ; 
                        }
                    }					
					// +++ MM: end extras...
					////
                    lastFragment = '<' + tag + ' ' + tmpAttrsTxt + '>';
                }

                results += lastFragment;
                lastFragment = '';
            },
            end: function(tag) {
                if (allowedTags.indexOf(tag) < 0 || tag === 'img' || tag === 'br' || tag === 'hr') {
                    return;
                }

                // MM: results += "</" + tag + ">\n";
				// MM: helps with markup inside <pre> tags (\n destroys formatting )
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

function getPageTitle(title) {
    if (title.trim().length === 0) {
        return 'ebook';
    }
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

function jsonToCss(jsonObj) {
    var keys = Object.keys(jsonObj);
    var result = '';
    for (var i = 0; i < keys.length; i++) {
        var tmpJsonObj = jsonObj[keys[i]];
        var tmpKeys = Object.keys(tmpJsonObj);
        result += '.' + keys[i] + ' {';
        for (var j = 0; j < tmpKeys.length; j++) {
            result += tmpKeys[j] + ':' + tmpJsonObj[tmpKeys[j]] + ';';
        }
        result += '} ';
    }
    return result;
}


// MM: refactored, improve later...
function getNodeStyle(pre) {
	tmpNewCss = {};
	for (let cssTagName of supportedCss) {						
		let cssValue = $(pre).css(cssTagName);
		// MM: little hack: might not be perfect, but just takes rules different from (current) parent.
		// might produce better results in most cases
		if (pre.parentNode) { 
			cssValueParent = $(pre.parentNode).css(cssTagName);
		}	
		var special = ['a','em','strong'];  // those do NOT inherit by default , e.g. link color...
        if (special.indexOf(pre.tagName.toLowerCase()) != -1) cssValueParent = "";

		if (cssValue && cssValue.length > 0  && cssValue != cssValueParent) {	// last clause dedupes 						
			if (cssTagName == "background-image" && cssValue != "none") {
			   // only containing url .. but not url("data:image/...  need to be rewritten...
			   var imgSrc = "";
				var tmp = cssValue.replace(/\s+/g, '');   // kill all whitespaces
				var tmp2 = tmp.match(/url\((['"])(.*)\1\)/);  // is it   url(...) with matching pair of quotes ?
				if (tmp2 !== null) { 
					var src = tmp2[2];
					if ( src.search(/^data:/) == -1 ) { // just keep embedded "data:"
						 imgSrc = getImageSrc(src);
						 console.log(cssTagName + " " + cssValue + " src: "+ imgSrc);
						 if (imgSrc !== '') {
							 cssValue = "url('"+imgSrc+"')";
						 }
					}
				}							   								
			}
			tmpNewCss[cssTagName] = cssValue;
		}						
	}
	return tmpNewCss;
}

// MM: ugly approach - maybe using hash later...
function styleToString(styleArr) {
	var tmp="";
	for (var key in styleArr) { 
	    tmp += key + ':' +styleArr[key] + ';';
	}
    //console.log ("MM: debug: styleToString(): "  + tmp);
	return tmp;
}


// TODO: Klasse für builtin style attribute:  lookup:
//  let classNames = pre.getAttribute('style');
//   https://en.wikipedia.org/wiki/Data_warehouse

function extractCss(includeStyle, appliedStyles) {
	styleLookup={};
    if (includeStyle) {
        $('body').find('*').each((i, pre) => {
            let $pre = $(pre);
            // seems to start from end of document? verify...
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
                        //MMv1: classNames =  pre.tagName.toLowerCase() + '-tag'; // MM:  pre.tagName + '-' + Math.floor(Math.random()*100000);
						classNames =  pre.parentNode.tagName.toLowerCase() + '_' + pre.tagName.toLowerCase();  // MM: use the path. as  ul.li and ol.li need different list-style-type for example.					
						//classNames =  pre.parentNode.getAttribute('data-class') + '_' + pre.tagName.toLowerCase();						
						//classNames =  'class-' + Math.floor(Math.random()*100000);
                    }
                } else {
					classNames = classNames.replace(/\s/g,'_'); // MM:  ...merge multiple names,  we basically have combined css anyways.
					classNames = pre.tagName.toLowerCase() + '-' + classNames; // MM: materialize class per tag. had issues with span inside paragraph  //  do NOT concatenate with '.' here ;-)
				}
				////////////////////
				tmpNewCss = getNodeStyle(pre);
				styleString = styleToString(tmpNewCss);
				var tmpId = styleLookup[styleString];

				if ( tmpId !== undefined ) {
				   //console.log ("MM: debug: classname: " + classNames + " dedup to: " + tmpId);				
				} else {
					tmpId = cssClassesToTmpIds[classNames];
					if (tmpId === undefined ) { // seems to be first
					   //console.log ("MM: debug: first encounter with className: " + classNames);
                       tmpId = classNames; 
                       cssClassesToTmpIds[classNames] = tmpId;
					   tmpIdsToNewCss[tmpId] = tmpNewCss;
                    } else {
						classNames = classNames + '_' + Math.floor(Math.random()*100000);
						tmpId = classNames;
						//console.log ("MM: debug: need artifical className Id: " + classNames);
						cssClassesToTmpIds[classNames] = tmpId;
						tmpIdsToNewCss[tmpId] = tmpNewCss;
						styleLookup[ styleString ] = tmpId;
					}
				}				
				/////////////////
				//console.log ("MM: debug: checking data-class=tmpId: " + tmpId);
				//debugger;
                pre.setAttribute('data-class', tmpId);
            }
        });
        return jsonToCss(tmpIdsToNewCss);
    } else {
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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    let imgsPromises = [];
    let result = {};
    let pageSrc = '';
    let tmpContent = '';
    let styleFile = null;

	console.log("chrome.runtime.onMessage.addListener() " + request.type);
	if (request.type === undefined ) { 
	   return;  // MM: no need to run this on undefined... (only extract-*)
	} else {
	   let allImages = []; //MM: instead of inside sanitize()
	} 
	
    if (request.type === 'extract-page') {        
		styleFile = extractCss(request.includeStyle, request.appliedStyles);
        pageSrc = document.getElementsByTagName('body')[0];
        tmpContent = getContent(pageSrc);
		styleFile = extractCss(request.includeStyle, request.appliedStyles);
    } else if (request.type === 'extract-selection') {        
		styleFile = extractCss(request.includeStyle, request.appliedStyles);
        pageSrc = getSelectedNodes();
        pageSrc.forEach((page) => {
            tmpContent += getContent(page);
        });
		
    }
	
	allImages.forEach((tmpImg) => {
		// MM: console.log("MM: debug: deferredAddZip: " + tmpImg.originalUrl + " " + tmpImg.filename );
		imgsPromises.push(deferredAddZip(tmpImg.originalUrl, tmpImg.filename));
	});	
	
    $.when.apply($, imgsPromises).done(() => {
        let tmpTitle = getPageTitle(document.title);
        result = {
            url: getPageUrl(tmpTitle),
            title: tmpTitle,
            baseUrl: getCurrentUrl(),
            styleFileContent: styleFile,
            styleFileName: 'style' + Math.floor(Math.random() * 100000) + '.css',
            images: extractedImages,
            content: tmpContent
        };
        sendResponse(result);
    }).fail((e) => {
        console.log('Error:', e);
        sendResponse(null)
    });
	
    return true;
});
