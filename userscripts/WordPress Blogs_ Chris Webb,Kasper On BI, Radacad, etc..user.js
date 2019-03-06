// ==UserScript==
// @name         WordPress Blogs: Chris Webb,Kasper On BI, Radacad, etc.
// @version      0.3
// @description  Power BI, Power Query and DAX related posts
// @author       M.M.
// @include      https://blog.crossjoin.co.uk/*/*/*
// @include      https://www.kasperonbi.com/*/*
// @exclude      https://www.kasperonbi.com/page/*
// @include      http://radacad.com/*
// @include      https://radacad.com/*
// @include      https://prathy.com/*
// @grant        none
// ==/UserScript==

'use strict';

/* probably similar for most WordPress blogs? */
// Tested with, e.g.:
// https://prathy.com/2019/02/sync-slicers-sync-slicers-advanced-options/
// http://radacad.com/remove-duplicate-doesnt-work-in-power-query-for-power-bi-here-is-the-solution
// https://www.kasperonbi.com/use-more-variables-in-dax-to-simplify-your-life/
// https://blog.crossjoin.co.uk/2019/02/12/splitting-text-by-character-transition-power-bi-power-query-excel/

//// uncomment to debug:
// debugger;

//------------------------------------------------------------
// experimental to preprocess/further simplify document prior to
// producing an eBook format.
function isolateElement(o) {
    if (o && o.parentNode != null) {
        var clone = o.cloneNode (true);
        for (var i = document.body.childNodes.length -1; i >= 0 ; i--) {
            document.body.removeChild ( document.body.childNodes.item(i) );
        }
        document.body.appendChild (clone);
    } else {
      console.log("Warning: isolate did not find element...");
    }
}
//--------------------------------------------------------------

var myCSS = window.document.createElement('style');
myCSS.innerHTML = `
/* -----------------------------
Name: Wordpress Blogs: Chris Webb , Kasper On BI, Radacad
URL: https://blog.crossjoin.co.uk/...
URL2: https://www.kasperonbi.com/...
etc. see above
-------------------------------- */

header#branding, footer#colophon,
aside#mobile-header,
div#secondary, div#actionbar,
div.main-navbar, div.header-top,
div.sd-social, div.sharedaddy, .synved-social-button,
.yarpp-related, div.post-related, div#disqus_thread,
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
    background: none !important;
    background-color: white;
    color: #010101;  /* default text almost black for better readability */
}

`;
document.getElementsByTagName("HEAD")[0].appendChild(myCSS);

// actually, after all that work so far, we just keep the DOM-tree below "Article" ;-)
isolateElement( document.getElementsByTagName("article")[0] ) ;
// div#page
// isolateElement( document.getElementById("page") ) ;


