// var GLOBAL_CURRENT_STYLE = null;


chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.type === 'get') {
        chrome.storage.local.get('allPages', function (data) {
            if (!data || !data.allPages) {
                sendResponse({allPages: []});
            }
            sendResponse({allPages: data.allPages});
        })
    }
    if (request.type === 'set') {
        chrome.storage.local.set({'allPages': request.pages});
    }
    if (request.type === 'remove') {
        chrome.storage.local.remove('allPages');
        chrome.storage.local.remove('title');
    }
    if (request.type === 'get title') {
        chrome.storage.local.get('title', function (data) {
            if (!data || !data.title || data.title.trim().length === 0) {
                sendResponse({title: 'eBook'});
            } else {
                sendResponse({title: data.title});
            }
        })
    }
    if (request.type === 'set title') {
        chrome.storage.local.set({'title': request.title});
    }
    if (request.type === 'get styles') {
        chrome.storage.local.get('styles', function (data) {
            if (!data || !data.styles) {
                // TODO move defaultStyles in a different file/location ?
                var defaultStyles = [
                    {
                        title: 'Reddit Comments',
                        url: 'reddit\\.com\\/r\\/[^\\/]+\\/comments',
                        style: `.side {
    display: none;
}
#header {
    display: none;
}
.arrow, .expand, .score, .live-timestamp, .flat-list, .buttons, .morecomments, .footer-parent, .icon {
    display: none !important;
}
`
                    },{
                        title: 'Wikipedia Article',
                        url: 'wikipedia\\.org\\/wiki\\/',
                        style: `#mw-navigation {
    display: none;
}
#footer {
    display: none;
}
#mw-panel {
    display: none;
}
#mw-head {
    display: none;
}
`
                    },{
                        title: 'YCombinator News Comments',
                        url: 'news\\.ycombinator\\.com\\/item\\?id=[0-9]+',
                        style: `#hnmain > tbody > tr:nth-child(1) > td > table {
    display: none;
}
* {
    background-color: white;
}
.title, .storylink {
    text-align: left;
    font-weight: bold;
    font-size: 20px;
}
.score {
    display: none;
}
.age {
    display: none;
}
.hnpast {
    display: none;
}
.togg {
    display: none;
}
.votelinks, .rank {
    display: none;
}
.votearrow {
    display: none;
}
.yclinks {
    display: none;
}
form {
    display: none;
}
a.hnuser {
    font-weight: bold;
    color: black !important;
    padding: 3px;
}
.subtext > span, .subtext > a:not(:nth-child(2)) {
    display: none;
}
`
                    },{
                        title: 'Medium Article',
                        url: 'medium\\.com',
                        style: `.metabar {
    display: none !important;
}
header.container {
    display: none;
}
.js-postShareWidget {
    display: none;
}
footer, canvas {
    display: none !important;
}
.u-fixed, .u-bottom0 {
    display: none;
}
`
                    },{
                        title: 'Twitter',
                        url: 'twitter\\.com\\/.+',
                        style: `.topbar {
    display: none !important;
}
.ProfileCanopy, .ProfileCanopy-inner {
    display: none;
}
.ProfileSidebar {
    display: none;
}
.ProfileHeading {
    display: none !important;
}
.ProfileTweet-actionList {
    display: none;
}
`
                    }

/*


*/

                ];
                sendResponse({styles: defaultStyles});
            } else {
                sendResponse({styles: data.styles});
            }
        });
    }
    if (request.type === 'set styles') {
        chrome.storage.local.set({'styles': request.styles});
    }
    if (request.type === 'get current style') {
        chrome.storage.local.get('currentStyle', function (data) {
            if (!data || !data.currentStyle) {
                sendResponse({currentStyle: 0});
            } else {
                sendResponse({currentStyle: data.currentStyle});
            }
        });
    }
    if (request.type === 'set current style') {
        chrome.storage.local.set({'currentStyle': request.currentStyle});
    }
    if (request.type === 'get include style') {
        chrome.storage.local.get('includeStyle', function (data) {
            if (!data) {
                sendResponse({includeStyle: false});
            } else {
                sendResponse({includeStyle: data.includeStyle});
            }
        });
    }
    if (request.type === 'set include style') {
        chrome.storage.local.set({'includeStyle': request.includeStyle});
    }
    return true;
});
