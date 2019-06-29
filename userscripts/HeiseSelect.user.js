// ==UserScript==
// @name         HeiseSelect
// @version      0.2
// @description  Heise Select (iX and others). Better image quality inline and simplified structure.
// @author       M.M.
// @include      https://*.heise.de/select/*/*/*/*
// @exclude      https://*.heise.de/select/*/*/*/*/*.html
// @grant        none
// ==/UserScript==

'use strict';

//// uncomment to debug:
// debugger;

/*
var myCSS = "/select/assets/ix/stylesheet/tabelle-20140819.css";
// Set custom CSS:
var link = window.document.createElement('link');
link.rel = 'stylesheet';
link.type = 'text/css';
link.href = myCSS;
document.getElementsByTagName("HEAD")[0].appendChild(link);
*/


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

///////////////////////////////////////////////////////////////////////////
// actually, we reduce the DOM tree a bit, isolate the main "Article" ;-)
isolateElement( document.getElementsByTagName("main")[0] ) ;

var myCSS = window.document.createElement('style');
myCSS.innerHTML = `
/* -----------------------------
Name: Heise Select
Additional Hint: .jpeg images are provided as WebP instead which corrupts
the resulting books.
use another Chrome extension to change Request headers for *.jpg to ask for image/jpeg
-------------------------------- */
body {
  color: #010101 !important;  /* default text almost black for better readability */
  padding: 25px !important;
  background-color: white;
}

.article__head,
main.content {
 width: 100% !important;
 padding: 0 0 0 0 !important;
 margin: 0 0 0 0 !important;
}

.article__header-text {
    padding: 0 20px;
}

span.initial {  /* Drop caps */
 float: left;
 font-weight:normal;
 font-size: 4em !important;
 line-height: 1.3 !important;
 margin-bottom: -0.3em !important;
 margin-top: -0.3em !important;
 font-stretch: normal;
}

p.normal, p:not([class]), p[class=""]
/* All paragraphs without specific formatting should
   use font of ebook readers choice */
{
  text-align: justify;
  hyphens: auto;
}

p.x, .kasten--ixtract .x {
  list-style-type: square; /* looks nicer and can be distinguished from "default" while extracting CSS - TODO */
}

/* remove everything except plain article */
a-analytics, body>footer,
.topbar, .toolbar, .comment, .bottom-links, .shariff
{
 display: none !important;
}
`;
document.getElementsByTagName("HEAD")[0].appendChild(myCSS);


myCSS = window.document.createElement('style');
myCSS.innerHTML = `
table {
  border-collapse: collapse;
  border: 2px solid black;
  table-layout: auto;
  width: 100%;
  font-size: 5pt;
}

th,td {
  border: 1px solid black;
}

tr:nth-child(odd) {
    background-color: #eeeeee;
}

tr.table_title {  background-color: #333333; color: #eeeeee; font-style: bold;  }
tr.table_columnNames {  background-color: #cccccc; font-style: bold;  }
tr.tr_even  {  background-color: #dddddd;   }
tr.tr_odd  {  background-color: #eeeeee;  }


ul#fixedTableLeft {
 display: none !important;
}

`;
document.getElementsByTagName("HEAD")[0].appendChild(myCSS);


//////////////////////////////

// https://stackoverflow.com/questions/16791479/how-to-wait-for-div-to-load-before-calling-another-function
function waitForElement(elementId, callBack){
  window.setTimeout(function(){
    var element = document.getElementById(elementId);
    if(element){
      callBack(elementId, element);
    }else{
      waitForElement(elementId, callBack);
    }
  },1000)
}

//lsauer.com, 2012; rev. 2014 by lo sauer
//description: transformTag fully replaces a node by a different Tag, and re-attaches all children to the newly formed Tag
//             Any desired EventHandlers must be re-attached manually
//@param tagIdOrElem:    an HTMLElement Id-Name or an instance of any HTMLElement
//[@param tagType]:      the HTML Tag Type. Default is 'span' (HTMLSpanElement)

function transformTag(doc, tagIdOrElem, tagType){
    var elem = (tagIdOrElem instanceof HTMLElement) ? tagIdOrElem : doc.getElementById(tagIdOrElem);
    if(!elem || !(elem instanceof HTMLElement))return;
    var children = elem.childNodes;
    var parent = elem.parentNode;
    var newNode = doc.createElement(tagType||"span");
    for(var a=0;a<elem.attributes.length;a++){
        newNode.setAttribute(elem.attributes[a].nodeName, elem.attributes[a].value);
    }
    for(var i= 0,clen=children.length;i<clen;i++){
        newNode.appendChild(children[0]); //0...always point to the first non-moved element
    }
    newNode.style.cssText = elem.style.cssText;
    parent.replaceChild(newNode,elem);
}


function loadTableToElement(filename, elementId) {
    var xhr = new XMLHttpRequest();
    try {
        xhr.open("GET", filename, false); // sync/wait on .send()
        xhr.onload = function() {
			var parser = new DOMParser();
			var doc = parser.parseFromString( xhr.responseText, "text/html");
            ////////////////////
            /* hack to mod the table back to real HTML table */
            var elems=doc.getElementsByTagName('ul'); //querySelectorAll('#fixedTable, #original');
            for (var d=0; d<elems.length; d++){ transformTag(doc, elems[d], 'table');  }

            elems=doc.querySelectorAll('li');
            for ( d=0; d<elems.length; d++){ transformTag(doc, elems[d], 'tr');  }

            elems=doc.querySelectorAll('div.titel, div.tb_b_head, div.tb_z2_dunkel, div.tb_z1_dunkel, div.tb_z2, div.tb_z1');
            for ( d=0; d<elems.length; d++){ transformTag(doc, elems[d], 'td');  }
            // bit beautifications....
            doc.querySelector('td.titel').colSpan =30; // to be on the safe side

            elems=doc.querySelectorAll('tr:nth-child(odd)');
            for ( d=0; d<elems.length; d++){ elems[d].setAttribute('class', "tr_odd");  }

            elems=doc.querySelectorAll('tr:nth-child(even)');
            for ( d=0; d<elems.length; d++){ elems[d].setAttribute('class', "tr_even");  }

            doc.querySelector('tr td.titel').parentNode.setAttribute('class', "table_title");
            // TODO: real header different class...
            if ( doc.querySelector('tr td.tb_b_head') != null ) {
                doc.querySelector('tr td.tb_b_head').parentNode.setAttribute('class', "table_columnNames");
            }
            // fallback... sibling
            doc.querySelector('tr.table_title + tr').setAttribute('class', "table_columnNames");
            /////////////////////
            var com = document.getElementById(elementId);
            com.innerHTML = doc.getElementById("scroller").innerHTML;
        }
        xhr.send();
    } catch (e) {
        window.alert("Unable to load the requested file: "+filename);
    }
}


var images = document.getElementsByTagName("img");
for(var i=0;i<images.length;i++){
    // Spezialfall: Aufmacherbild (Symbolbild) klein...
    if (images[i].class == "article__lead-image" || images[i].alt == "Aufmacherbild" ) {
        //Old style (redirected anyways...)
        images[i].src =  images[i].src.replace("https://www.heise.de/scale/geometry/900/q65/",
                                               "https://heise.cloudimg.io/width/300/foil1/_www-heise-de_/");
        // newer:
        images[i].src =  images[i].src.replace("https://heise.cloudimg.io/width/900/",
                                               "https://heise.cloudimg.io/width/300/");
    } else {
        if (images[i].parentNode.tagName.toLowerCase() == "a") {
            var parLink = images[i].parentNode.href;
            var parExtension = parLink.substr(parLink.lastIndexOf('.') );
            if (parExtension == ".jpg" || parExtension == ".png" || parExtension == ".gif") {
                images[i].src = images[i].parentNode.href;
                //  images[i].width = "100%";
                //  images[i].height = "auto";
            } else if (parExtension == ".html"){
               /////////////////////////////////
               // fallback for the moment... try to enlarge thumbnail..
               images[i].src =  images[i].src.replace("https://heise.cloudimg.io/bound/500x500/",
                                               "https://heise.cloudimg.io/bound/900x900/");

                // marker on figure element ...
                images[i].parentNode.parentNode.id = "myMarker";
           /*
                // Experimental: include table instead of preview
                // TODO: verify Class/Id name to ensure this is the intended elem.
               var myDIV = window.document.createElement('iframe');
               myDIV.id = "table_content123";  // <div id ="table_content"> </div>
               // myDIV.innerHTML = '<object type="text/html" data="'+ images[i].parentNode.href +'" ></object>';
               myDIV.src= images[i].parentNode.href;
               myDIV.height = "800px";
               // document.getElementById("table_content").innerHTML='<object type="text/html" data="home.html" ></object>';
               //images[i].parentNode.parentNode.appendChild(myDIV);
               document.getElementsByTagName("BODY")[0].appendChild(myDIV);
            */
               ////////////////////////////
               var pos = document.getElementById("myMarker");
               pos.id = "";
               var newTableDIV = window.document.createElement('div');
               newTableDIV.id = "table_content123";
               pos.parentNode.insertBefore( newTableDIV,  pos );
               loadTableToElement(images[i].parentNode.href, 'table_content123' )
               newTableDIV.id ="";
                /////////////////////////////////////
/*
                waitForElement("table_content123",function(){
                     //console.log("done");
                    var myDIV=document.getElementById("table_content123");
                    //myDIV2.innerHTML =  myDIV.contentWindow.document.getElementsByTagName("body")[0].innerHTML;
                    // myDIV2.innerHTML =  myDIV.contentWindow.document.getElementsByClassName("fixme")[0].innerHTML;
                    // myDIV.parentNode.appendChild( myDIV2 );

                    var neu = myDIV.contentWindow.document.getElementsByClassName("DONTfixme")[0].cloneNode(true);
                    // myDIV.parentNode.parentNode.appendChild( neu );
                    var pos = document.getElementById("myMarker");
                    pos.id = "";
                    pos.parentNode.insertBefore( neu,  pos );
                    myDIV.parentNode.removeChild(myDIV);
                    neu.style.left = "0px";
                    neu.style.top = "0px";
                    neu.style.position = "relative";
                    //neu.style.height = "1200px";
                    //neu.style.width = "600px";
                    neu.style.float = "none";
                    var allElem = neu.getElementsByTagName("*");
                    for (var i = 0; i < allElem.length; i++) {
                         allElem[i].removeAttribute("style");
                      //  allElem[i].style.width = null;
                       // allElem[i].style.height = null;
                    }
                });
*/
                /* ----------------------- */
            }
        }
    }
}



