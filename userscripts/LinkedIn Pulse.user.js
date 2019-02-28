// ==UserScript==
// @name         LinkedIn Pulse
// @version      0.1
// @description  Innovation Articles
// @author       M.M.
// @include      https://www.linkedin.com/pulse/*
// @grant        none
// ==/UserScript==

'use strict';

//// uncomment to debug:
// debugger;

/* probably again a wordpress based blog? */


var myCSS = window.document.createElement('style');
myCSS.innerHTML = `
/* -----------------------------
Name: LinkedIn Pulse
URL: https://www.linkedin.com/pulse
-------------------------------- */

header.navbar, footer,
.related-articles-container,
div.article-comment__container {
 display:none !important;
}

article {
  position: relative;
  width: 100%;
  max-width: 100% !important;
  margin: 0px !important;
  padding: 0px !important;
  border: none;
}

.hype-blog-post-banner {
 background-color: rgb(200, 90, 50) !important;
}

.row-fluid [class*="span"],
.widget-type-cell, .widget-type-blog,  .hs-container {
  float: none !important;
}

/* All paragraphs without specific formatting should
   use font of ebook readers choice */
div.MMM,
p:not([class]), p[class=""]
{
  text-align: justify;
  text-justify: inter-word;
  -webkit-hyphens: auto;
  -moz-hyphens: auto;
  -ms-hyphens: auto;
   hyphens: auto;
}

div.MMM > * {
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

