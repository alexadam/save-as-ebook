var chapterHolder = document.getElementById('chapters');
var list = document.createElement('ul');

for (var i = 0; i < 10; i++) {
    var listItem = document.createElement('li');
    var label = document.createElement('span');
    label.innerHTML = 'i = ' + i;
    listItem.appendChild(label);
    list.appendChild(listItem);
}

chapterHolder.appendChild(list);
