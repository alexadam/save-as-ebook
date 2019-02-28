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
body.article {
  color: #010101 !important;  /* default text almost black for better readability */
  padding: 20px !important;
}

article,
div#grandwrapper, #screen, #header,
#footer, div.g6 {
  padding: 0px !important;
  margin: 0px !important;
  border-width: 0px !important;
  width: 100% !important;
}

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


