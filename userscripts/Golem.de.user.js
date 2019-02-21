// ==UserScript==
// @name         Golem.de
// @version      0.1
// @description  IT news and articles
// @author       M.M.
// @include      *.golem.de/news/*
// @exclude      *.golem.de/news
// @grant        none
// ==/UserScript==

'use strict';

//// uncomment to debug:
// debugger;

var myCSS = window.document.createElement('style');
myCSS.innerHTML = `
/* -----------------------------
Name: Golem.de News
URL Regex: golem\.de\/news
-------------------------------- */
body {
  /* TODO: Removing default font so Kindle user can select needs to be done in js and/or save-as-ebook or calibre
  font-family: initial !important;
  */
  color: #010101 !important;  /* default text almost black for better readability */
  padding: 10px !important;
}

article {
	padding: 0 0 0 0 !important;
}

body, p:not([class]), p[class=""]
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



#screen > div {  /* main article, screen > div.g.g6 */
  float: none;
}

/* remove everything except plain article */
.toc, .tags,
.social-tools, .social-tools--inverted,
.supplementary, .narando,
#narando-placeholder, #gservices,
#screen > div.g6 ~ div, /* all Divs following main article... */
.iq-site-header, footer
{
 display:none !important;
}
`;
document.getElementsByTagName("HEAD")[0].appendChild(myCSS);


