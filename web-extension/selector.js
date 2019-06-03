var lastTargetElem = null
var lastElementData = {}
var lastParentElem = null
var lastParentData = {}


let bodyElem = document.getElementsByTagName('body')[0]
let bodyInner = bodyElem.innerHTML
bodyElem.innerHTML = ''

let container = document.createElement('div')
container.style.display = "flex"
container.style.flexFlow = "row"
let menu = document.createElement('div')
menu.style.width = '300px'
menu.style.minWidth = '300px'
menu.style.height = '100%'
let page = document.createElement('div')
page.id= 'super-selector'
page.style.width = '100%'
page.style.height = '100%'
page.innerHTML = bodyInner

container.appendChild(menu)
container.appendChild(page)
bodyElem.appendChild(container)

document.getElementById('super-selector').addEventListener('mousemove', (e) => {
// document.getElementsByTagName('body')[0].addEventListener('mousemove', (e) => {
    e.preventDefault()

        if (lastTargetElem) {
            lastTargetElem.style.backgroundColor = lastElementData.backgroundColor
        }

    let targetElem = document.elementFromPoint(e.clientX, e.clientY);

        let targetParent = targetElem.parentNode
        lastElementData.backgroundColor = targetElem.style.backgroundColor

        targetElem.style.backgroundColor = 'rgba(255,0,0,0.25)'
        targetElem.dataset.excluded = 'true'

    targetElem.onclick = (e) => {
        e.preventDefault() // FIXME except for my menu
        e.stopPropagation();

        console.log(createXPathFromElement(e.target));

        if (!e.target.style.opacity || e.target.style.opacity  > 0.2) {
            e.target.style.opacity = 0.1
            e.target.style.border = 'solid 3px black'
        }
        else {
            e.target.style.opacity = 1
            e.target.style.border = 'none'
        }
    }

    lastTargetElem = targetElem
})

// src https://stackoverflow.com/questions/2661818/javascript-get-xpath-of-a-node
function createXPathFromElement(elm) {
    var allNodes = document.getElementsByTagName('*');
    for (var segs = []; elm && elm.nodeType == 1; elm = elm.parentNode)
    {
        if (elm.hasAttribute('id')) {
                var uniqueIdCount = 0;
                for (var n=0;n < allNodes.length;n++) {
                    if (allNodes[n].hasAttribute('id') && allNodes[n].id == elm.id) uniqueIdCount++;
                    if (uniqueIdCount > 1) break;
                };
                if ( uniqueIdCount == 1) {
                    segs.unshift('id("' + elm.getAttribute('id') + '")');
                    return segs.join('/');
                } else {
                    segs.unshift(elm.localName.toLowerCase() + '[@id="' + elm.getAttribute('id') + '"]');
                }
        } else if (elm.hasAttribute('class')) {
            segs.unshift(elm.localName.toLowerCase() + '[@class="' + elm.getAttribute('class') + '"]');
        } else {
            for (i = 1, sib = elm.previousSibling; sib; sib = sib.previousSibling) {
                if (sib.localName == elm.localName)  i++; };
                segs.unshift(elm.localName.toLowerCase() + '[' + i + ']');
        };
    };
    return segs.length ? '/' + segs.join('/') : null;
};
