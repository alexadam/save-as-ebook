// ==UserScript==
// @name         sqlbi.com & daxpatterns.com
// @version      0.2
// @description  sqlbi - articles and blog entries about DAX and PowerBI.
// @author       M.M.
// @include      https://*.sqlbi.com/articles/*
// @include      https://www.sqlbi.com/daxpuzzle/*
// @include      https://www.daxpatterns.com/*
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
.connect, .breadcrumb,
#disqus_thread, .comments-note {
 display:none !important;
}

.syntaxhighlighter table td.gutter .line,
.gutter .line {
    text-align: left !important;  /* line numbers in Code snippets... */
}

.content-wrapper, .entry-content, .wrapper {
    padding: 0px !important;
    width: 100% !important;
    max-width: 100% !important;
}

.entry-content {
   float: none !important;
}

body {
    padding: 15px !important;
    background-color: white;
    color: #010101;  /* default text almost black for better readability */
}

`;
document.getElementsByTagName("HEAD")[0].appendChild(myCSS);



