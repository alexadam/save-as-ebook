for (var i=0; i<document.styleSheets.length; i++) {
    document.styleSheets.item(i).disabled = true;
}

var tmp = document.getElementById('chapterEditor-Modal');
if (tmp) {
    tmp.parentNode.removeChild(tmp);
}
showEditor();




function showEditor() {
    var allPagesRef = null;

    var body = document.getElementsByTagName('body')[0];
    var modalContent = document.createElement('div');
    modalContent.id = 'chapterEditor-modalContent';
    var modalHeader = document.createElement('div');
    modalHeader.id = 'chapterEditor-modalHeader';
    var modalList = document.createElement('div');
    modalList.id = 'chapterEditor-modalList';
    var modalFooter = document.createElement('div');
    modalFooter.id = 'chapterEditor-modalFooter';

    ////////
    // Header
    var title = document.createElement('span');
    title.id = "chapterEditor-Title";
    title.innerText = "Chapter Editor";
    var upperCloseButton = document.createElement('button');
    modalHeader.appendChild(title);
    upperCloseButton.onclick = closeModal;
    upperCloseButton.innerText = 'X';
    upperCloseButton.className = 'chapterEditor-text-button chapterEditor-float-right';
    modalHeader.appendChild(upperCloseButton);
    /////////////////////
    // Content List

    // TODO change ids - add prefix !!!!

    function createChapterList(allPages) {
        allPagesRef = allPages;

        var list = document.createElement('ul');
        list.className = 'chapterEditor-chapters-list';
        // list.style.listStyle = 'none';
        for (var i = 0; i < allPages.length; i++) {
            if (!allPages[i]) {
                continue;
            }
            var listItem = document.createElement('li');
            listItem.id = 'li' + i;
            listItem.className = 'chapterEditor-chapter-item';

            var dragHandler = document.createElement('span');
            dragHandler.id = 'dragHandler';
            dragHandler.innerText = '\u21f5';

            var label = document.createElement('input');
            label.type = 'text';
            label.id = 'text' + i;
            label.rows = 1;
            // label.cols = 100;
            label.style.width = '80%';
            label.style.display = 'inline';
            label.value = allPages[i].title;

            var buttons = document.createElement('span');

            var previewButton = document.createElement('button');
            previewButton.innerText = 'Raw Preview';
            previewButton.className = 'chapterEditor-text-button';
            previewButton.onclick = previewListItem(i);

            var removeButton = document.createElement('button');
            removeButton.innerText = 'Remove';
            removeButton.className = 'chapterEditor-text-button chapterEditor-text-red';
            removeButton.onclick = removeListItem(i);

            buttons.appendChild(previewButton);
            buttons.appendChild(removeButton);

            listItem.appendChild(dragHandler);
            listItem.appendChild(label);
            listItem.appendChild(buttons);
            list.appendChild(listItem);
        }
        modalList.appendChild(list);
        $(list).sortable({
            handle: '#dragHandler',
        });
    }

    ////////
    // Footer
    var buttons = document.createElement('div');
    var closeButton = document.createElement('button');
    closeButton.innerText = 'Cancel';
    closeButton.className = 'chapterEditor-footer-button chapterEditor-float-left chapterEditor-cancel-button';
    closeButton.onclick = closeModal;
    buttons.appendChild(closeButton);

    var saveButton = document.createElement('button');
    saveButton.onclick = function() {
        buildEbook();
    };
    saveButton.innerText = 'Generate eBook ...';
    saveButton.className = 'chapterEditor-footer-button chapterEditor-float-right chapterEditor-generate-button';
    buttons.appendChild(saveButton);
    modalFooter.appendChild(buttons);

    /////////////////////

    var modal = document.createElement('div');
    modal.id = 'chapterEditor-Modal';

    modalContent.appendChild(modalHeader);
    modalContent.appendChild(modalList);
    modalContent.appendChild(modalFooter);
    modal.appendChild(modalContent);

    body.appendChild(modal);

    modal.style.display = "none";
    modal.style.position = 'fixed';
    modal.style.zIndex = '1';
    modal.style.left = '0';
    modal.style.top = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.overflow = 'auto';
    modal.style.backgroundColor = 'rgba(210, 210, 210, 1)';

    modalContent.style.zIndex = '2';
    modalContent.style.backgroundColor = '#fff';
    modalContent.style.margin = '5% auto';
    modalContent.style.padding = '0';
    modalContent.style.width = '70%';

    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function(event) {
        if (event.target == modal) {
            closeModal();
        }
    };

    modal.style.display = "block";


    function closeModal() {
        for (var i=0; i<document.styleSheets.length; i++) {
            document.styleSheets.item(i).disabled = false;
        }
        modal.style.display = "none";
        modalContent.parentNode.removeChild(modalContent);
        modal.parentNode.removeChild(modal);
    }

    function removeListItem(atIndex) {
        return function() {
            allPagesRef[atIndex].removed = true;
            var tmpListElem = document.getElementById('li' + atIndex);
            tmpListElem.style.display = 'none';
        };
    }

    function previewListItem(atIndex) {
        return function() {
            alert(allPagesRef[atIndex].content.trim().substring(0, 500) + ' ...');
        };
    }

    /////////////////////

    getEbookPages(createChapterList);
}
