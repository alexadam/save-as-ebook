var allPagesRef = null;

var body = document.getElementsByTagName('body')[0];
var modalContent = document.createElement('div');
var modalHeader = document.createElement('div');
var modalList = document.createElement('div');
var modalFooter = document.createElement('div');

////////
// Header
modalHeader.innerHTML = '<div class="close">x</div>';


/////////////////////
// Content List

getEbookPages(createChapterList);

function createChapterList(allPages) {
    allPagesRef = allPages;

    var list = document.createElement('ul');
    list.className = 'chapters-list';
    for (var i = 0; i < allPages.length; i++) {
        if (!allPages[i]) {
            continue;
        }
        var listItem = document.createElement('li');
        listItem.id = 'li' + i;
        listItem.className = 'chapter-item';

        var label = document.createElement('textarea');
        label.id = 'textarea' + i;
        label.rows = 1;
        // label.cols = 100;
        label.style.width = '75%';
        label.style.display = 'inline';
        label.innerText = allPages[i].title;

        var buttons = document.createElement('span');

        var previewButton = document.createElement('button');
        previewButton.innerText = 'raw preview';
        previewButton.onclick = previewListItem(i);

        var removeButton = document.createElement('button');
        removeButton.innerText = 'remove';
        removeButton.onclick = removeListItem(i);

        buttons.appendChild(previewButton);
        buttons.appendChild(removeButton);

        listItem.appendChild(label);
        listItem.appendChild(buttons);
        list.appendChild(listItem);
    }
    modalList.appendChild(list);
}

////////
// Footer
var buttons = document.createElement('div');
var closeButton = document.createElement('button');
closeButton.innerText = 'close';
closeButton.onclick = closeModal;
buttons.appendChild(closeButton);

var saveButton = document.createElement('button');
saveButton.onclick = function () {
    buildEbook();
};
saveButton.innerText = 'save';
buttons.appendChild(saveButton);
modalFooter.appendChild(buttons);

/////////////////////




var modal = document.createElement('div');
modalContent.appendChild(modalHeader);
modalContent.appendChild(modalList);
modalContent.appendChild(modalFooter);
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
span.onclick = closeModal;

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


function closeModal() {
    modal.style.display = "none";
    modalContent.parentNode.removeChild(modalContent);
    modal.parentNode.removeChild(modal);
}

function removeListItem(atIndex) {
    return function () {
        allPagesRef[atIndex].removed = true;
        var tmpListElem = document.getElementById('li' + atIndex);
        tmpListElem.style.display = 'none';
    };
}

function previewListItem(atIndex) {
    return function () {
        alert(allPagesRef[atIndex].content.trim().substring(0, 500) + ' ...');
    };
}
