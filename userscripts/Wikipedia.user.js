// ==UserScript==
// @name         Wikipedia
// @version      0.1
// @description  Strip stuff from Wikipedia Articles.
// @author       M.M.
// @include      *.wikipedia.org/wiki/*
// @include      *.wikipedia.org/w/*
// @grant        none
// ==/UserScript==

'use strict';

//// uncomment to debug:
// debugger;

var myCSS = window.document.createElement('style');
myCSS.innerHTML = `
/* -----------------------------
Name: Wikipedia Article
URL Regex: wikipedia\.org\/(wiki|w)\/
Additional trick: Login and personalize "Appearance" to
 show thubnails with 400px instead of 200px
-------------------------------- */

p:not([class]), p[class=""]
/* All paragraphs without specific formatting should
   use font of ebook readers choice */
{
  text-align: justify;
  text-justify: inter-word;
  -webkit-hyphens: auto;
  -moz-hyphens: auto;
  -ms-hyphens: auto;
   hyphens: auto;
}

.toc , .toc-mobile,
.mw-jump-link,
.mw-editsection,
.navigation-drawer, .navbox, .catlinks,
.header-container, .minerva-footer,
#footer, #mw-panel, #mw-head,
#mw-navigation,
#page-actions {
  display: none !important;
}

.mw-body {
    margin-left: 0px !important;
	border-style: none !important;
}

.noprint, .cnotice {
   display: none !important;
}
ul {
  padding: 20px !important;
  list-style-type: square !important;
  list-style-image: none  !important;
}

`;
document.getElementsByTagName("HEAD")[0].appendChild(myCSS);



