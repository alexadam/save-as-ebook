// ==UserScript==
// @name         WhatsApp
// @version      0.1
// @description  IT news and articles
// @author       M.M.
// @include      *web.whatsapp.com*
// @grant        none
// ==/UserScript==

'use strict';

//// uncomment to debug:
// debugger;

var myCSS = window.document.createElement('style');
myCSS.innerHTML = `
/* -----------------------------
Name: WhatsApp
URL *web.whatsapp.com*
-------------------------------- */

/* Chat background */
div#main > div {
 background-color: rgb(245,250,252) !important;
}

div.message-out {
 background-color: rgb(220,242,250) !important;
}


._12xX7, ._2nFG1, ._1sGGp  {
  background-color: rgb(210,232,240) !important;
}


div.message-in {
  background-color: rgb(191, 233, 249) !important;
}


/* Preview box of links */
._2nFG1, ._2lwig {
  background-color: rgb(181, 223, 239) !important;
}


`;
document.getElementsByTagName("HEAD")[0].appendChild(myCSS);


