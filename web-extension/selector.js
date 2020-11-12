var lastTargetElem = null
var lastElementData = {}
var lastParentElem = null
var lastParentData = {}

let cleanXPaths = []


let bodyElem = document.getElementsByTagName('body')[0]
let bodyInner = bodyElem.innerHTML
bodyElem.innerHTML = ''

// let container = document.createElement('div')
// container.style.display = "flex"
// container.style.flexFlow = "row"
// let menuContainer = document.createElement('div')
// menuContainer.style.width = '300px'
// menuContainer.style.minWidth = '300px'
// menuContainer.style.height = '600px'
// menuContainer.style.minHeight = '600px'
// let page = document.createElement('div')
// page.id= 'super-selector'
// page.style.width = '90%'
// page.style.height = '90%'
// page.innerHTML = bodyInner

// let menu = document.createElement('div')
// menu.id = "slector-main-menu"
// menu.style.width = '300px'
// menu.style.minWidth = '300px'
// menu.style.height = '600px'
// menu.style.minHeight = '600px'
// menu.style.backgroundColor = 'black'
// menu.style.position = 'fixed'
// menu.style.top = '0'


// container.appendChild(menuContainer)
// container.appendChild(page)
// bodyElem.appendChild(container)
// bodyElem.appendChild(menu)

bodyElem.innerHTML = `<div style="width: 100%;">
        <div id="super-selector" style="max-width:75%; position: absolute;">${bodyInner}'</div>
        <div id="slector-main-menu" style="width:25%; min-width: 300px; height: 100%; right: 0; position: fixed;">MENU</div>
    </div>`


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

        let originalClickedElem = e.target
        let clickedElem = e.target

        if (!clickedElem) {
            return
        }

        // console.log(createXPathFromElement(clickedElem));

          ///
        let tmpElem = document.createElement('div')
        tmpElem.innerText = createXPathFromElement(clickedElem);
        document.getElementById('slector-main-menu').appendChild(tmpElem)

        let clickedElemParent = clickedElem.parentNode;
        let foundClickedEleme = false
        while (clickedElemParent) {            
            if (!clickedElemParent || !clickedElemParent.style) {
                break
            }
            if (clickedElemParent.id === 'slector-main-menu') {
                // ignore main menu
                return
            }
            if (clickedElemParent.style.opacity === '0.1') {
                foundClickedEleme = true
                clickedElem = clickedElemParent
                break
            }
            clickedElemParent = clickedElemParent.parentNode;
        }       

        if (!clickedElem.style.opacity || clickedElem.style.opacity  > 0.2) {
            clickedElem.style.opacity = 0.1
            clickedElem.style.border = 'solid 3px black'
        }
        else {
            clickedElem.style.opacity = 1
            clickedElem.style.border = 'none'
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
