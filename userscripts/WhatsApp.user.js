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

.message-in {
 /*  background-color: rgb(197, 247, 255) !important; */
  background-color: rgb(191, 233, 249) !important;
}

`;
document.getElementsByTagName("HEAD")[0].appendChild(myCSS);


