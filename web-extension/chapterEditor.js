for (var i=0; i<document.styleSheets.length; i++) {
    document.styleSheets.item(i).disabled = true;
}

var tmp = document.getElementById('chapterEditor-Modal');
if (tmp) {
    tmp.parentNode.removeChild(tmp);
}
showEditor();

var allPagesRef = null;

function showEditor() {

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
    title.innerText = chrome.i18n.getMessage('chapterEditorTitle');
    var upperCloseButton = document.createElement('button');
    modalHeader.appendChild(title);
    upperCloseButton.onclick = closeModal;
    upperCloseButton.innerText = 'X';
    upperCloseButton.className = 'chapterEditor-text-button chapterEditor-float-right';
    modalHeader.appendChild(upperCloseButton);
    /////////////////////
    // Content List

    var titleHolder = document.createElement('div');
    titleHolder.id = 'chapterEditor-ebookTitleHolder';

    var ebookTilteLabel = document.createElement('span');
    ebookTilteLabel.id = 'chapterEditor-ebookTitleLabel';
    ebookTilteLabel.innerText = chrome.i18n.getMessage('ebookTitleLabel');
    titleHolder.appendChild(ebookTilteLabel);

    var ebookTilte = document.createElement('input');
    ebookTilte.id = 'chapterEditor-ebookTitle';
    ebookTilte.type = 'text';
    getEbookTitle(function (title) {
        ebookTilte.value = title;
    });
    titleHolder.appendChild(ebookTilte);
    modalList.appendChild(titleHolder);

    function createChapterList(allPages) {
        allPagesRef = allPages;

        var list = document.createElement('ul');
        list.className = 'chapterEditor-chapters-list';

        for (var i = 0; i < allPagesRef.length; i++) {
            if (!allPagesRef[i]) {
                continue;
            }
            allPagesRef[i].removed = false;

            var listItem = document.createElement('li');
            listItem.id = 'li' + i;
            listItem.className = 'chapterEditor-chapter-item';

            var dragHandler = document.createElement('span');
            dragHandler.className = 'chapterEditor-drag-handler';
            dragHandler.innerText = '\u21f5';

            var label = document.createElement('input');
            label.type = 'text';
            label.id = 'text' + i;
            label.value = allPagesRef[i].title;

            var buttons = document.createElement('span');

            var previewButton = document.createElement('button');
            previewButton.innerText = chrome.i18n.getMessage('rawPreview');
            previewButton.className = 'chapterEditor-text-button';
            previewButton.onclick = previewListItem(i);

            var removeButton = document.createElement('button');
            removeButton.innerText = chrome.i18n.getMessage('remove');
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
            handle: '.chapterEditor-drag-handler',
        });
    }

    ////////
    // Footer
    var buttons = document.createElement('div');
    var closeButton = document.createElement('button');
    closeButton.innerText = chrome.i18n.getMessage('cancel');
    closeButton.className = 'chapterEditor-footer-button chapterEditor-float-left chapterEditor-cancel-button';
    closeButton.onclick = closeModal;
    buttons.appendChild(closeButton);

    var removeButton = document.createElement('button');
    removeButton.innerText = chrome.i18n.getMessage('removeChapters');
    removeButton.className = 'chapterEditor-footer-button hapterEditor-float-left';
    removeButton.onclick = function() {
        var result = confirm(chrome.i18n.getMessage('removeChaptersConfirm'));
        if (result) {
            removeEbook();
            closeModal();
        }
    };
    buttons.appendChild(removeButton);

    var saveButton = document.createElement('button');
    saveButton.onclick = function() {
        var newChapters = saveChanges();
        prepareEbook(newChapters);
    };
    saveButton.innerText = chrome.i18n.getMessage('generateEbook');
    saveButton.className = 'chapterEditor-footer-button chapterEditor-float-right chapterEditor-generate-button';
    buttons.appendChild(saveButton);

    var saveChangesButton = document.createElement('button');
    saveChangesButton.onclick = function() {
        saveChanges();
    };
    saveChangesButton.innerText = chrome.i18n.getMessage('saveChanges');
    saveChangesButton.className = 'chapterEditor-footer-button chapterEditor-float-right';
    buttons.appendChild(saveChangesButton);

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

    window.onclick = function(event) {
        if (event.target == modal) {
            closeModal();
        }
    };

    modal.style.display = "block";

    document.onkeydown = function(evt) {
        evt = evt || window.event;
        if (evt.keyCode == 27) {
            closeModal();
        }
    };

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
            alert(allPagesRef[atIndex].content.trim().replace(/<[^>]+>/gi, '').replace(/\s+/g, ' ').substring(0, 1000) + ' ...');
        };
    }

    function prepareEbook(newChapters) {
        try {
            if (newChapters.length === 0) {
                alert(chrome.i18n.getMessage('emptyBookWarning'));
                return;
            }
            buildEbookFromChapters();
        } catch (e) {
            console.log('Error:', e);
        }
    }

    function saveChanges() {
        var newChapters = [];
        var newEbookTitle = ebookTilte.value;
        if (newEbookTitle.trim() === '') {
            newEbookTitle = 'eBook';
        }

        try {
            var tmpChaptersList = document.getElementsByClassName('chapterEditor-chapter-item');
            if (!tmpChaptersList || !allPagesRef) {
                return;
            }

            for (var i = 0; i < tmpChaptersList.length; i++) {
                var tmpChapterItem = tmpChaptersList[i];
                var listIndex = Number(tmpChapterItem.id.replace('li', ''));
                if (allPagesRef[listIndex].removed === false) {
                    var newChapterTitle = tmpChapterItem.children.namedItem('text'+listIndex).value;
                    allPagesRef[listIndex].title = newChapterTitle;
                    newChapters.push(allPagesRef[listIndex]);
                }
            }

            saveEbookTitle(newEbookTitle);
            saveEbookPages(newChapters);
            return newChapters;
        } catch (e) {
            console.log('Error:', e);
        }
    }

    /////////////////////

    getEbookPages(createChapterList);
}
