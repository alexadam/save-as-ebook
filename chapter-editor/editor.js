// var chapterHolder = document.getElementById('chapters');
var list = document.getElementById('chapters');
var title = localStorage.getItem('title');
if (title === null) {
    title = [];
} else {
    title = JSON.parse(title);
}

for (var i = 0; i < title.length; i++) {
    var listItem = document.createElement('li');
    var label = document.createElement('span');
    label.innerHTML = title[i].title;
    listItem.appendChild(label);
    list.appendChild(listItem);
}


document.getElementById('closeButton').onclick = function () {
    chrome.tabs.query({
		currentWindow: true,
		active: true
	// Select active tab of the current window
	}, function(tab) {
		chrome.tabs.sendMessage(
			// Send a message to the content script
			tab[0].id, { line: 'countparas' }
		);
	});
};

browser.runtime.onMessage.addListener(function(request) {
    console.log('cccccc', request);


});

document.getElementById('saveButton').onclick = function () {
    window.open(window.location, '_self').close();
};
