// ==UserScript==
// @name         Telepolis (Heise)
// @version      0.1
// @description  Heise Select (iX and others). eBook stylesheet and a better image quality.
// @author       M.M.
// @include      *.heise.de/tp/*
// @exclude      *.heise.de/tp/
// @grant        none
// ==/UserScript==

'use strict';

//// uncomment to debug:
// debugger;

var myCSS = window.document.createElement('style');
myCSS.innerHTML = `
/* -----------------------------
Name: Telepolis
URL Regex: heise\.de\/tp
-------------------------------- */
body {
  font: initial !important;
  font-family: initial !important;
  color: #010101 !important;  /* default text almost black for better readability */
  margin: 25px;
  background-color: white;
}

p:not([class]), p[class=""]
/* All paragraphs without specific formatting should
   use font of ebook readers choice */
{
  font-family: initial !important;
  text-align: justify;
  text-justify: inter-word;
  -webkit-hyphens: auto;
  -moz-hyphens: auto;
  -ms-hyphens: auto;
   hyphens: auto;
}


main,
.container,
.row_tp_content  {
	padding: 0 0 0 0 !important;
}

.img-responsive, .aufmacherbild {
	width: 100% !important;
}

/* remove everything except plain article  article>footer, .pre-akwa-toc,  */
a-analytics,
body>footer,
.ho-roof, .tp_mainheader, .shariff,
.navbar, .nav, .navbar-nav,
.tp_breadcrumb, .subnavi,
aside, .seitenweise_navigation, .paginiert,
.printversion--hide
{
   display: none !important;
}
`;
document.getElementsByTagName("HEAD")[0].appendChild(myCSS);



//------------------------------------------------------------
// experimental to preprocess/further simplify document prior to
// producing an eBook format.
function isolateElement(o) {
    if (o && o.parentNode != null) {
        var clone = o.cloneNode (true);
        for (var i = document.body.childNodes.length -1; i >= 0 ; i--) {
            document.body.removeChild ( document.body.childNodes.item(i) );
        }
        document.body.appendChild (clone);
    } else {
      console.log("Warning: isolate did not find element...");
    }
}
//--------------------------------------------------------------


// actually, after all that work so far, we just keep the DOM-tree below "Article" ;-)
//isolateElement( document.getElementsByTagName("main")[0] ) ;
isolateElement( document.querySelector('div.tp_content') ) ;
