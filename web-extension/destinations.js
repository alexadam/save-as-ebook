async function readSaveDestination() {
    const data = await chrome.runtime.sendMessage({
        type: 'get save destination',
        keys: ['protocol', 'crosspointUrl', 'crosspointPath'].map(_namespaceKey)
    });

    let protocol;
    if (data.saveDestinationProtocol === 'crosspoint') {
        protocol = 'crosspoint';
    } else {
        protocol = 'download';
    }

    const crosspointUrl = data.saveDestinationCrosspointUrl ?? 'http://crosspoint.local';
    const crosspointPath = data.saveDestinationCrosspointPath ?? '/';

    const state = {
        protocol,
        crosspointUrl,
        crosspointPath
    };
    return state;
};

async function setSaveDestination(state) {
    let data = {};
    for (const [k, v] of Object.entries(state)) {
        data[_namespaceKey(k)] = v;
    }
    await chrome.runtime.sendMessage({type: 'set save destination', ...data});
};

function _namespaceKey(k) {
    return `saveDestination${k.substring(0, 1).toUpperCase()}${k.substring(1)}`;
}

async function saveEbookToDestination(blob, fileName) {
    const state = await readSaveDestination();
    switch (state.protocol) {
        case 'crosspoint':
            const {crosspointUrl, crosspointPath} = state;

            const body = new FormData();
            body.append('file', blob, fileName);

            const response = await fetch(`${crosspointUrl}/upload?path=${crosspointPath}`, {method: 'POST', body});
            if (!response.ok) {
                throw 'CrossPoint upload failed with status code ' + response.status;
            }
            break;
        case 'download':
        default:
            downloadBlob(blob, fileName);
            break;
    }
};
