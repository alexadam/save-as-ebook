for (var i=0; i<document.styleSheets.length; i++) {
    document.styleSheets.item(i).disabled = true;
}

var tmp = document.getElementById('cssEditor-Modal');
if (tmp) {
    tmp.parentNode.removeChild(tmp);
}

var allPagesRef = null;
var allStyles = [];
var currentStyle = null;
var currentStyleIndex = -1;


showEditor();


function showEditor() {

    var body = document.getElementsByTagName('body')[0];
    var modalContent = document.createElement('div');
    modalContent.id = 'cssEditor-modalContent';
    var modalHeader = document.createElement('div');
    modalHeader.id = 'cssEditor-modalHeader';
    var modalList = document.createElement('div');
    modalList.id = 'cssEditor-modalList';
    var modalFooter = document.createElement('div');
    modalFooter.id = 'cssEditor-modalFooter';

    ////////
    // Header
    var title = document.createElement('span');
    title.id = "cssEditor-Title";
    title.innerText = chrome.i18n.getMessage('styleEditor');
    var upperCloseButton = document.createElement('button');
    modalHeader.appendChild(title);
    upperCloseButton.onclick = closeModal;
    upperCloseButton.innerText = 'X';
    upperCloseButton.className = 'cssEditor-text-button cssEditor-float-right';
    modalHeader.appendChild(upperCloseButton);
    /////////////////////
    // Content List

    var titleHolder = document.createElement('div');
    titleHolder.id = 'cssEditor-ebookTitleHolder';

    var existingStyles = document.createElement('select');
    existingStyles.id = "cssEditor-selectStyle";
    existingStyles.onchange = function (event) {
        if (existingStyles.selectedIndex === 0) {
            currentStyle = null;
            currentStyleIndex = -1;
            hideStyleEditor();
            hideRemoveStyle();
            hideSaveStyle();
            return;
        }
        currentStyle = allStyles[existingStyles.selectedIndex - 1];
        currentStyleIndex = existingStyles.selectedIndex - 1;
        editCurrentStyle();
    };
    var defaultOption = document.createElement('option');
    defaultOption.innerText = chrome.i18n.getMessage('selectExistingCSS');
    existingStyles.appendChild(defaultOption);
    titleHolder.appendChild(existingStyles);

    var titleLabel = document.createElement('label');
    titleLabel.id = 'cssEditor-orLabel';
    titleLabel.innerText = chrome.i18n.getMessage('orLabel');
    titleHolder.appendChild(titleLabel);

    var createNewStyleButton = document.createElement('button');
    createNewStyleButton.id = 'cssEditor-createNewStyle';
    createNewStyleButton.innerText = chrome.i18n.getMessage('createNewStyle');
    createNewStyleButton.onclick = createNewStyle;
    titleHolder.appendChild(createNewStyleButton);

    modalList.appendChild(titleHolder);

    function createNewStyle() {
        currentStyle = null;
        currentStyleIndex = -1;
        resetFields();
        showStyleEditor();
        showSaveStyle();
        hideRemoveStyle();
        createStyleList();
    }

    //////

    var editorHolder = document.createElement('div');
    editorHolder.style.display = 'none';
    editorHolder.id = 'cssEditor-styleEditor';

    var editorHolderLeft = document.createElement('div');
    editorHolderLeft.className = 'cssEditor-left-panel';
    var editorHolderRight = document.createElement('div');
    editorHolderRight.className = 'cssEditor-right-panel';

    var nameLabelHolder = document.createElement('div');
    nameLabelHolder.className = 'cssEditor-field-label-holder';
    var nameLabel = document.createElement('label');
    nameLabel.className = 'cssEditor-field-label';
    nameLabel.innerText = chrome.i18n.getMessage('styleNameLabel');
    nameLabelHolder.appendChild(nameLabel);
    editorHolderLeft.appendChild(nameLabelHolder);

    var nameInputHolder = document.createElement('div');
    nameInputHolder.className = 'cssEditor-field-holder';
    var cssNameInput = document.createElement('input');
    cssNameInput.id = 'cssEditor-styleName';
    cssNameInput.type = 'text';
    nameInputHolder.appendChild(cssNameInput);
    editorHolderLeft.appendChild(nameInputHolder);


    var urlLabelHolder = document.createElement('div');
    urlLabelHolder.className = 'cssEditor-field-label-holder';
    var urlLabel = document.createElement('label');
    urlLabel.className = 'cssEditor-field-label';
    urlLabel.innerText = 'URL Regex'; // TODO addd link to regex tutorial
    var regexHelp = document.createElement('a');
    regexHelp.innerText = chrome.i18n.getMessage('howToWriteRegexLabel');
    regexHelp.setAttribute('href', 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions');
    urlLabelHolder.appendChild(urlLabel);
    urlLabelHolder.appendChild(regexHelp);
    editorHolderLeft.appendChild(urlLabelHolder);

    var urlInputHolder = document.createElement('div');
    urlInputHolder.className = 'cssEditor-field-holder';
    var urlInput = document.createElement('input');
    urlInput.id = 'cssEditor-matchUrl';
    urlInput.type = 'text';
    urlInputHolder.appendChild(urlInput);
    editorHolderLeft.appendChild(urlInputHolder);

    var contentLabelHolder = document.createElement('div');
    contentLabelHolder.className = 'cssEditor-field-label-holder';
    var contentLabel = document.createElement('label');
    contentLabel.className = 'cssEditor-field-label';
    contentLabel.innerText = 'CSS';
    contentLabelHolder.appendChild(contentLabel);
    editorHolderRight.appendChild(contentLabelHolder);

    var contentInputHolder = document.createElement('div');
    contentInputHolder.className = 'cssEditor-field-holder';
    var contentInput = document.createElement('textarea');
    contentInput.id = 'cssEditor-styleContent';
    contentInput.setAttribute('data', 'language: css');
    contentInputHolder.appendChild(contentInput);
    editorHolderRight.appendChild(contentInputHolder);

    editorHolder.appendChild(editorHolderLeft);
    editorHolder.appendChild(editorHolderRight);
    modalList.appendChild(editorHolder);



    var saveButtonsHolder = document.createElement('div');

    var removeCssButton = document.createElement('button');
    removeCssButton.id = 'cssEditor-removeStyle';
    removeCssButton.innerText = chrome.i18n.getMessage('removeStyle');
    removeCssButton.className = 'cssEditor-footer-button cssEditor-float-left cssEditor-cancel-button';
    removeCssButton.onclick = removeStyle;
    saveButtonsHolder.appendChild(removeCssButton);

    var saveCssButton = document.createElement('button');
    saveCssButton.id = 'cssEditor-saveStyle';
    saveCssButton.innerText = chrome.i18n.getMessage('saveStyle');
    saveCssButton.className = 'cssEditor-footer-button cssEditor-float-right cssEditor-save-button';
    saveCssButton.onclick = saveStyle;
    saveButtonsHolder.appendChild(saveCssButton);

    modalFooter.appendChild(saveButtonsHolder);

    //////////////////////////

    function createStyleList(allStylesTmp) {
        if (allStylesTmp && allStylesTmp.length > 0) {
            allStyles = allStyles.concat(allStylesTmp);
        }

        while (existingStyles.hasChildNodes() && existingStyles.childElementCount > 1) {
            existingStyles.removeChild(existingStyles.lastChild);
        }

        for (var i = 0; i < allStyles.length; i++) {
            var listItem = document.createElement('option');
            listItem.id = 'option_' + i;
            listItem.className = 'cssEditor-chapter-item';
            listItem.value = 'option_' + i;
            listItem.innerText = allStyles[i].title;
            if (currentStyle && (allStyles[i].title === currentStyle.title)) {
                listItem.selected = 'selected';
            }
            existingStyles.appendChild(listItem);
        }
    }

    function editCurrentStyle() {
        if (!currentStyle) {
            return;
        }

        showStyleEditor();
        showRemoveStyle();
        showSaveStyle();

        document.getElementById('cssEditor-styleName').value = currentStyle.title;
        document.getElementById('cssEditor-matchUrl').value = currentStyle.url;
        document.getElementById('cssEditor-styleContent').value = currentStyle.style;

    }

    function resetFields() {
        document.getElementById('cssEditor-styleName').value = '';
        document.getElementById('cssEditor-matchUrl').value = '';
        document.getElementById('cssEditor-styleContent').value = '';
    }

    function hideStyleEditor() {
        document.getElementById('cssEditor-styleEditor').style.display = 'none';
    }

    function showStyleEditor() {
        document.getElementById('cssEditor-styleEditor').style.display = 'flex';
    }

    function showRemoveStyle() {
        document.getElementById('cssEditor-removeStyle').style.display = 'inline-block';
    }

    function hideRemoveStyle() {
        document.getElementById('cssEditor-removeStyle').style.display = 'none';
    }

    function showSaveStyle() {
        document.getElementById('cssEditor-saveStyle').style.display = 'inline-block';
    }

    function hideSaveStyle() {
        document.getElementById('cssEditor-saveStyle').style.display = 'none';
    }

    function saveStyle() {
        var isRegexValid = checkRegex();
        if (!isRegexValid) {
            alert(chrome.i18n.getMessage('invalidRegex'));
            return;
        }
        var tmpValue = {
            title: document.getElementById('cssEditor-styleName').value,
            url: document.getElementById('cssEditor-matchUrl').value,
            style: document.getElementById('cssEditor-styleContent').value
        }
        if (currentStyle === null) {
            allStyles.push(tmpValue);
            currentStyle = tmpValue;
            currentStyleIndex = allStyles.length - 1;
        } else {
            currentStyle = tmpValue;
            allStyles[currentStyleIndex] = currentStyle;
        }
        setStyles(allStyles);
        createStyleList();
        showRemoveStyle();
        alert(chrome.i18n.getMessage('styleSaved'));
    }

    function checkRegex() {
        var regexContent = document.getElementById('cssEditor-matchUrl').value;
        var isValid = true;
        try {
            new RegExp(regexContent);
        } catch(e) {
            isValid = false;
        }
        return isValid;
    }

    function removeStyle() {
        if (confirm(chrome.i18n.getMessage('confirmDeleteStyle')) == true) {
            allStyles.splice(currentStyleIndex, 1);
            setStyles(allStyles);
            hideSaveStyle();
            hideRemoveStyle();
            hideStyleEditor();
            createStyleList();
        }
    }


    /////////////////////

    var modal = document.createElement('div');
    modal.id = 'cssEditor-Modal';

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

    function saveChanges() {
        var newChapters = [];
        var newEbookTitle = ebookTilte.value;
        if (newEbookTitle.trim() === '') {
            newEbookTitle = 'eBook';
        }

        try {
            var tmpChaptersList = document.getElementsByClassName('cssEditor-chapter-item');
            if (!tmpChaptersList || !allPagesRef) {
                return;
            }

            for (var i = 0; i < tmpChaptersList.length; i++) {
                var listIndex = Number(tmpChaptersList[i].id.replace('li', ''));
                if (allPagesRef[listIndex].removed === false) {
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

    getStyles(createStyleList);
}
