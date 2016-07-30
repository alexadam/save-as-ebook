// var chapterHolder = document.getElementById('chapters');
var list = document.getElementById('chapters');
var allPages = getEbookPages();

console.log(allPages.length);

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


document.getElementById('closeButton').onclick = function () {
    window.open(window.location, '_self').close();
};

document.getElementById('saveButton').onclick = function () {
    try {
        buildEbook();
        // window.open(window.location, '_self').close();
    } catch (e) {
        alert(e);
    }
};
