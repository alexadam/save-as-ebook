async function doSave() {
    let protocol;
    if (document.getElementById('saveDestinationCrosspoint').checked) {
        protocol = 'crosspoint';
    } else {
        protocol = 'download';
    }

    const crosspointUrl = document.getElementById('crosspointUrl').value;
    const crosspointPath = document.getElementById('crosspointPath').value;

    await setSaveDestinationFromContent({protocol, crosspointUrl, crosspointPath});
    alert(browser.i18n.getMessage('changesSaved'));
    close();
}

async function main() {
    const saved = await readSaveDestinationFromContent();

    const controls = document.createElement('div');
    controls.id = 'saveControls';

    const title = document.createElement('span');
    title.id = 'saveTitle';
    title.innerText = chrome.i18n.getMessage('saveDestinationTitle');
    controls.appendChild(title);

    const protocolList = document.createElement('ul');
    protocolList.id = 'saveProtocols';
    const protocols = [
        {
            id: 'saveDestinationDownload',
            checked: saved.protocol === 'download'
        },
        {
            id: 'saveDestinationCrosspoint',
            checked: saved.protocol === 'crosspoint'
        }
    ];
    for ({id, checked} of protocols) {
        const li = document.createElement('li');

        const input = document.createElement('input');
        input.id = id;
        input.type = 'radio';
        input.name = 'protocol';
        input.checked = checked;
        li.appendChild(input);

        const label = document.createElement('label');
        label.setAttribute('for', id);
        label.innerText = chrome.i18n.getMessage(id);
        li.appendChild(label);

        protocolList.appendChild(li);
    }
    controls.appendChild(protocolList);

    const cpTable = document.createElement('table');
    cpTable.id = 'saveControlsCrosspoint';
    {
        const tr = document.createElement('tr');
        {
            const td = document.createElement('td');
            const label = document.createElement('label');
            label.setAttribute('for', 'crosspointUrl');
            label.innerText = chrome.i18n.getMessage('saveDestinationCrosspointUrl');
            td.appendChild(label);
            tr.appendChild(td);
        }
        {
            const td = document.createElement('td');
            const input = document.createElement('input');
            input.id = 'crosspointUrl';
            input.value = saved.crosspointUrl;
            td.appendChild(input);
            tr.appendChild(td);
        }
        cpTable.appendChild(tr);
    }
    {
        const tr = document.createElement('tr');
        {
            const td = document.createElement('td');
            const label = document.createElement('label');
            label.setAttribute('for', 'crosspointPath');
            label.innerText = chrome.i18n.getMessage('saveDestinationCrosspointPath');
            td.appendChild(label);
            tr.appendChild(td);
        }
        {
            const td = document.createElement('td');
            const input = document.createElement('input');
            input.id = 'crosspointPath';
            input.value = saved.crosspointPath;
            td.appendChild(input);
            tr.appendChild(td);
        }
        cpTable.appendChild(tr);
    }
    controls.appendChild(cpTable);

    document.body.appendChild(controls);

    const buttons = document.createElement('div');
    buttons.id = 'saveButtons';

    const apply = document.createElement('button');
    apply.id = 'apply';
    apply.onclick = doSave;
    apply.innerText = chrome.i18n.getMessage('saveDestinationApply');
    buttons.appendChild(apply);

    document.body.appendChild(buttons);
}
main();
