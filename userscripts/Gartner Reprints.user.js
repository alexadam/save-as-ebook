// ==UserScript==
// @name         Gartner Reprints
// @version      0.1
// @description  Gartner Magic Quadrants etc.
// @author       M.M.
// @include      https://www.gartner.com/doc/*
// @grant        none
// ==/UserScript==

'use strict';

//// uncomment to debug:
// debugger;

var myCSS = window.document.createElement('style');
myCSS.innerHTML = `
/* -----------------------------
Name: Gartner reprints
URL: https://www.gartner.com/doc/
-------------------------------- */

div.reprint-section > div:not(.content-section),
div.disclaimer > div:not(.content-section),
button[aria-label="View Columns"],
div.footer-reprint,
div.container, div.prms,
div.right-rail {
  display:none !important;
}

.content-section {
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
div.summary,
div.disclaimer > div.content-section,
div.para, p:not([class]), p[class=""]
{
  text-align: justify !important;
  text-justify: inter-word !important;
  -webkit-hyphens: auto;
  -moz-hyphens: auto;
  -ms-hyphens: auto;
   hyphens: auto;
}

/* fix/emulate <li>:before */
ul.bullets-yes>li {
    list-style-type: square !important;
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



