// ==UserScript==
// @name         sqlbi.com
// @version      0.1
// @description  sqlbi - articles and blog entries about DAX and PowerBI.
// @author       M.M.
// @include      https://*.sqlbi.com/articles/*
// @include      https://*.sqlbi.com/blog/*
// @grant        none
// ==/UserScript==

'use strict';

//// uncomment to debug:
// debugger;

var myCSS = window.document.createElement('style');
myCSS.innerHTML = `
/* -----------------------------
Name: sqlbi.com
URL Regex: sqlbi\.com\/(articles|blog)
-------------------------------- */

p:not([class]), p[class=""]
/* All paragraphs without specific formatting should
   use font of ebook readers choice */
{
  /* font-family: initial !important; */
  text-align: justify;
  text-justify: inter-word;
  -webkit-hyphens: auto;
  -moz-hyphens: auto;
  -ms-hyphens: auto;
   hyphens: auto;
}

main {
  width: 100% !important;
}

body>header, footer, aside,
.download, .sharing,
.connect, .breadcrumb  {
 display:none !important;
}


.content-wrapper, .entry-content, body {
    padding: 1px 0 0 0;
    color: #010101;  /* default text almost black for better readability */
}

body {
    padding: 4px !important;
}

`;
document.getElementsByTagName("HEAD")[0].appendChild(myCSS);



