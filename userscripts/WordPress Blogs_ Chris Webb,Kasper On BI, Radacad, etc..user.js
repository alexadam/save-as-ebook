// ==UserScript==
// @name         BI Blogs: Chris Webb & Kasper On BI
// @version      0.2
// @description  Power BI, Power Query and DAX related posts
// @author       M.M.
// @include      https://blog.crossjoin.co.uk/*/*/*
// @include      https://www.kasperonbi.com/*/*
// @exclude      https://www.kasperonbi.com/page/*
// @grant        none
// ==/UserScript==

'use strict';

//// uncomment to debug:
// debugger;

/* probably valid for most wordpress blogs? */
// Test with:    https://prathy.com/2019/02/sync-slicers-sync-slicers-advanced-options/

var myCSS = window.document.createElement('style');
myCSS.innerHTML = `
/* -----------------------------
Name: BI Blogs: Chris Webb & Kasper On BI
URL: https://blog.crossjoin.co.uk/...
URL2: https://www.kasperonbi.com/...
-------------------------------- */

header#branding, footer#colophon,
aside#mobile-header,
div#secondary, div#actionbar,
div.main-navbar, div.header-top,
div.sd-social, div.sharedaddy,
.post-format-icon, .screen-reader-text,
article ~ * {
 display:none !important;
}

#page, #primary {
  width: 100% !important;
  max-width: 100% !important;
  padding: 0px !important;
  margin: 0px !important;
  border: none;

}

#page:before, #page:after { /* remove box-shadow of page... */
   display:none !important;
}

div.content-area {
  float: none !important;
  margin: 0px !important;
  padding: 0px !important;
}

#content, .entry-title, .post-content, #content .post {
  margin: 0px !important;
  padding: 0px !important;
}

.entry-meta {
  position: relative;
  width: 100%;
  top: 0px;
}

.syntaxhighlighter table td.gutter .line {
    text-align: left !important;  /* line numbers in Code snippets... */
}

.entry-meta .entry-date, .entry-meta .byline, .entry-meta .entry-categories,
.entry-meta .entry-tags, .entry-meta .edit-link, .entry-meta .comments-link,
.entry-meta .image-info {
    text-align: left  !important;
}

/* All paragraphs without specific formatting should
   use font of ebook readers choice */
p:not([class]), p[class=""]
{
  text-align: justify;
  text-justify: inter-word;
  -webkit-hyphens: auto;
  -moz-hyphens: auto;
  -ms-hyphens: auto;
   hyphens: auto;
}

body {
    padding: 15px !important;
    background: none;
    background-color: white;
    color: #010101;  /* default text almost black for better readability */
}

`;
document.getElementsByTagName("HEAD")[0].appendChild(myCSS);



