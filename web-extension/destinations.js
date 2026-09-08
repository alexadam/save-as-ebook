async function readSaveDestinationFromContent() {
    const data = await chrome.runtime.sendMessage({
        type: 'get save destination',
        keys: ['protocol', 'crosspointUrl', 'crosspointPath'].map(_namespaceKey)
    });
    return _readSaveDestination(data);
}

async function readSaveDestinationFromBackground() {
    let data;
    try {
        data = await chrome.storage.local.get(
            ['protocol', 'crosspointUrl', 'crosspointPath'].map(_namespaceKey)
        );
    } catch {
        data = {};
    }
    return _readSaveDestination(data);
}

function _readSaveDestination(data) {
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

async function setSaveDestinationFromContent(state) {
    let data = {};
    for (const [k, v] of Object.entries(state)) {
        data[_namespaceKey(k)] = v;
    }
    await chrome.runtime.sendMessage({type: 'set save destination', ...data});
};

function _namespaceKey(k) {
    return `saveDestination${k.substring(0, 1).toUpperCase()}${k.substring(1)}`;
}

async function saveEbookFromContent(dest, blob, fileName) {
    switch (dest.protocol) {
        case 'crosspoint':
            // Posting a blob will only work in Chrome 148 and above with structured clone messaging enabled.
            // https://developer.chrome.com/blog/structured-clone-messaging#how_to_opt-in
            // (It has always worked in Firefox.)
            const error = await chrome.runtime.sendMessage({type: 'save to crosspoint', blob, fileName});
            if (error) {
                throw error;
            }
            break;
        case 'download':
        default:
            downloadBlob(blob, fileName);
            break;
    }
}

async function saveEbookToCrosspoint(dest, blob, fileName) {
    const {crosspointUrl, crosspointPath} = dest;

    const body = new FormData();
    body.append('file', blob, _fixFileName(fileName));

    // Note that Manifest V3 attempts to upgrade this to an HTTPS connection by default.
    // We can avoid this by specifying our own content security policy in manifest.json.
    // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_Security_Policy#default_content_security_policy
    const response = await fetch(`${crosspointUrl}/upload?path=${crosspointPath}`, {method: 'POST', body});
    if (!response.ok) {
        throw 'CrossPoint upload failed with status code ' + response.status;
    }
}

function _fixFileName(s) {
    return s.replace(/[<>:"\/\\\|\?\*]/g, '_');
}
