
var body = document.getElementsByTagName('body')[0];
var modalContent = document.createElement('div');
modalContent.innerHTML = '<div class="close">x</div>';


/////////////////////
getEbookPages(createChapterList);

function createChapterList(allPages) {
    var list = document.createElement('ul');
    for (var i = 0; i < allPages.length; i++) {
        if (!allPages[i]) {
            continue;
        }
        var listItem = document.createElement('li');
        var label = document.createElement('span');
        label.innerHTML = allPages[i].title;
        listItem.appendChild(label);
        list.appendChild(listItem);
    }
    modalContent.appendChild(list);
}

var buttons = document.createElement('div');
var closeButton = document.createElement('button');
closeButton.innerText = 'close';
buttons.appendChild(closeButton);
var saveButton = document.createElement('button');
saveButton.onclick = function () {
    buildEbook();
};
saveButton.innerText = 'save';
buttons.appendChild(saveButton);
modalContent.appendChild(buttons);

/////////////////////




var modal = document.createElement('div');
modal.appendChild(modalContent);

body.appendChild(modal);

modal.style.display = "none";
modal.style.position= 'fixed'; /* Stay in place */
modal.style.zIndex= '1'; /* Sit on top */
modal.style.left= '0';
modal.style.top= '0';
modal.style.width= '100%'; /* Full width */
modal.style.height= '100%'; /* Full height */
modal.style.overflow= 'auto'; /* Enable scroll if needed */
modal.style.backgroundColor= 'rgba(0,0,0,0.5)'; /* Fallback color */

var span = document.getElementsByClassName("close")[0];
span.onclick = function() {
    modal.style.display = "none";
    modalContent.parentNode.removeChild(modalContent);
    modal.parentNode.removeChild(modal);
};

modalContent.style.zIndex= '2'; /* Sit on top */
modalContent.style.backgroundColor = '#fff';
modalContent.style.margin= '15% auto'; /* 15% from the top and centered */
modalContent.style.padding= '20px';
modalContent.style.border= '1px solid #888';
modalContent.style.width= '80%'; /* Could be more or less, depending on screen size */

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
        modalContent.parentNode.removeChild(modalContent);
        modal.parentNode.removeChild(modal);
    }
};

modal.style.display = "block";
