// ==UserScript==
// @name         Computerworld.ch
// @version      0.1
// @description  Computer News
// @author       M.M.
// @include      https://www.computerworld.ch/*/*
// @grant        none
// ==/UserScript==

'use strict';

//// uncomment to debug:
// debugger;

/* probably again a wordpress based blog? */


var myCSS = window.document.createElement('style');
myCSS.innerHTML = `
/* -----------------------------
Name: Computerworld.ch
URL: https://www.computerworld.ch
-------------------------------- */

nav#breadcrumb, script,
div.autoren ~ div.row,
div.dachleiste-mobil,
div.container-themenleiste,
div.container-themenleiste ~ *,
header.header, div#sidebar,
div#footer, div.wrapper-top,
.navbar-collapse {
 display:none !important;
}

div#content, div.col-xs-30,
div#seite, div.row {
  position: relative;
  width: 100%;
  max-width: 100% !important;
  margin: 0px !important;
  padding: 0px !important;
  border: none;
}

div.col-xs-30 {
  float: none;
}

/* All paragraphs without specific formatting should
   use font of ebook readers choice */
div.fliesstext,
p:not([class]), p[class=""]
{
  text-align: justify;
  text-justify: inter-word;
  -webkit-hyphens: auto;
  -moz-hyphens: auto;
  -ms-hyphens: auto;
   hyphens: auto;
}

div.fliesstext > * {
 text-align: left;
}

body {
    padding: 15px !important;
    background: none;
    background-color: white;
    color: #010101;  /* default text almost black for better readability */
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
isolateElement( document.getElementsByTagName("article")[0] ) ;
//isolateElement( document.querySelector('div.tp_content') ) ;


