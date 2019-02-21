// ==UserScript==
// @name         Telepolis (Heise)
// @version      0.1
// @description  Heise Select (iX and others). eBook stylesheet and a better image quality.
// @author       M.M.
// @include      *.heise.de/tp/*
// @exclude      *.heise.de/tp/
// @grant        none
// ==/UserScript==

'use strict';

//// uncomment to debug:
// debugger;

var myCSS = window.document.createElement('style');
myCSS.innerHTML = `
/* -----------------------------
Name: Telepolis
URL Regex: heise\.de\/tp
-------------------------------- */
body {
  font: initial !important;
  font-family: initial !important;
  color: #010101 !important;  /* default text almost black for better readability */
  margin: 25px;
  background-color: white;
}

p:not([class]), p[class=""]
/* All paragraphs without specific formatting should
   use font of ebook readers choice */
{
  font-family: initial !important;
  text-align: justify;
  text-justify: inter-word;
  -webkit-hyphens: auto;
  -moz-hyphens: auto;
  -ms-hyphens: auto;
   hyphens: auto;
}


main,
.container,
.row_tp_content  {
	padding: 0 0 0 0 !important;
}

.img-responsive, .aufmacherbild {
	width: 100% !important;
}

/* remove everything except plain article */
a-analytics, nav
body>footer,
.ho-roof, .tp_mainheader,
.pre-akwa-toc,
.navbar, .nav, .navbar-nav,
.tp_breadcrumb, .subnavi,
aside, article>footer,
.printversion--hide
{
   display: none !important;
}
`;
document.getElementsByTagName("HEAD")[0].appendChild(myCSS);



