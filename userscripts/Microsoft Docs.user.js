// ==UserScript==
// @name         Microsoft Docs
// @version      0.1
// @description  Microsoft documentation
// @author       M.M.
// @include      https://docs.microsoft.com/en-us/*
// @grant        none
// ==/UserScript==

'use strict';

//// uncomment to debug:
// debugger;

var myCSS = window.document.createElement('style');
myCSS.innerHTML = `
/* -----------------------------
Name: Microsoft Docs
URL: https://docs.microsoft.com/en-us/
-------------------------------- */

/* just examples:
div.reprint-section > div:not(.content-section),
div.disclaimer > div:not(.content-section),
button[aria-label="View Columns"],
*/

nav, .c-uhfh-actions,
button.action, .contributors-holder,
.footerContainer, .action-bar,
div#openFeedbackContainer,
#sidebarContent, nav.sidebar,
div.moniker-picker,
#left-container,
a.m-skip-to-main,
main ~ *, section ~ *
{
  display:none !important;
}

.columns, .has-large-gaps,
section.primary-holder,
div.column {
  position: relative;
  float: none !important;
  margin: 0px !important;
  padding: 0px !important;
  width: 100% !important;
  max-width: 100% !important;
  flex-basis: 100% !important;
  top: 0px;
  border: none;
  text-align: left !important;  /* line numbers in Code snippets... */
}

/* All paragraphs without specific formatting should
   use font of ebook readers choice */
p.x-hidden-focus,
p:not([class]), p[class=""]
{
  text-align: justify !important;
  text-justify: inter-word !important;
  -webkit-hyphens: auto;
  -moz-hyphens: auto;
  -ms-hyphens: auto;
   hyphens: auto;
}

div.codeHeader {
  background-color: rgb(190,190,190);
}

.codeHeader+pre, code {
  background-color: rgb(240,240,240);
}



/* fix: little svg buttons, not needed in epub/print */
svg, .enlarge-table{
   display:none !important;
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
isolateElement( document.getElementsByTagName("main")[0] ) ;



