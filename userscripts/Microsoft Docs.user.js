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
Name: Gartner reprints
URL: https://docs.microsoft.com/en-us/
-------------------------------- */

/* just examples:
div.reprint-section > div:not(.content-section),
div.disclaimer > div:not(.content-section),
button[aria-label="View Columns"],
*/

nav, .c-uhfh-actions,
.footerContainer, .action-bar,
div#openFeedbackContainer,
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



