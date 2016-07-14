// document.body.style.border = "5px solid red";


// https://stuk.github.io/jszip/
// https://github.com/eligrey/FileSaver.js/

console.log('mmerge');

var myimg = document.getElementsByTagName('img')[0];
console.log(myimg, 'p[p[p[p[p]]]]');

// setTimeout(function () {
//     console.log(getSelectedNode());
// }, 2000);


if (myimg) {
    var mysrc = myimg.src;


    var zip = new JSZip();
    zip.file("Hello.txt", mysrc + "\n");
    var img = zip.folder("images");

    JSZipUtils.getBinaryContent(mysrc, function (err, data) {
       if(err) {
          throw err; // or handle the error
       }
       img.file("pic.png", data, {binary: true});

       zip.generateAsync({type:"blob"})
       .then(function(content) {
           saveAs(content, "example.zip");
       });
    });

    // deferredAddZip(my);


    // zip.generateAsync({type:"blob"})
    // .then(function(content) {
    //     saveAs(content, "example.zip");
    // });

}

// browser.tabs.insertCSS(
//   tabId,           // optional integer
//   details: {
//       file: "fonts.css"
//   },
//    runAt: "document_start",
//    allFrames: true
// )

// function getSelectedNode()
// {
//     if (document.selection)
//     	// return document.selection.createRange().parentElement();
//     	return document.selection.createRange();
//     else
//     {
//         console.log('juuuuuuuuuu');
//     	var selection = window.getSelection();
//     	if (selection.rangeCount > 0)
//     		return selection.getRangeAt(0);
//     		// return selection.createRange();
//     }
// }

function createArchive() {

}
