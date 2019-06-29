// ==UserScript==
// @name         Aardvark (experimental)
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @include      https://*
// @include      http://*
// @grant        none
// ==/UserScript==

//// uncomment to debug:
// debugger;

    // Just run the bookmarklet without a warning...
    // javascript:document.getElementsByTagName('head')[0].appendChild(document.createElement('script')).setAttribute('src','http://www.karmatics.com/aardvark/bookmarklet.js')
//    document.getElementsByTagName('head')[0].appendChild(document.createElement('script')).setAttribute('src','http://www.karmatics.com/aardvark/bookmarklet.js');


var showHtml = function (elem) {
    };

var aardvark = {

isBookmarklet: true,
resourcePrefix: "http://karmatics.com/aardvark/",
srcFiles: [
  'aardvarkStrings.js',
  'aardvarkUtils.js',
  'aardvarkDBox.js',
  'aardvarkCommands.js',
  'aardvarkMain.js'
  ],

//------------------------------------------------
// onload function for script elements
loadObject: function  (obj) {
  var c = 0;

  for (var x in obj) {
    if (aardvark[x] == undefined)
      aardvark[x] = obj[x];
     c++;
    }

  if (this.objectsLeftToLoad == undefined) {
    this.objectsLeftToLoad = this.srcFiles.length;
    }
  this.objectsLeftToLoad--;

  if (this.objectsLeftToLoad < 1) {
    // add anything here you want to happen when it is loaded
    // copy our own functions etc over aardvark's

    // start aardvark and show its help tip
    this.start ();
    this.showHelpTip(0);

    // add our custom commands
    aardvark.addCommand ("xpath", function(e) {
      if (window.SimplePath)
        SimplePath.showPathInSnippetEditor(e);
      else
        alert("please load snippet editor");
      });
    // add our custom commands
    }
  }
};


// load the aardvark code from karmatics.com
(function () {

// leave commented out if you wish to have it load a new
// copy each time (for dev purposes...no need to refresh page)
/*if (window.aardvark) {
  aardvark.start ();
  return;
  } */

// anti caching....dev only (leave empty string otherwise)
var ensureFresh = ""; // "?" + Math.round(Math.random()*100);

for (var i=0; i<aardvark.srcFiles.length; i++) {
	var scriptElem = document.createElement('script');
	scriptElem.isAardvark = true;
	scriptElem.src = ((aardvark.srcFiles[i].indexOf("http://") == 0) ?
	    aardvark.srcFiles[i] : aardvark.resourcePrefix + aardvark.srcFiles[i]) + ensureFresh;
	document.body.appendChild(scriptElem);
	}
})();
