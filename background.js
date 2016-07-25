/*
Called when the item has been created, or when creation failed due to an error.
We'll just log success/failure here.
*/
function onCreated(n) {
  if (chrome.runtime.lastError) {
    console.log("error creating item:" + chrome.runtime.lastError);
  } else {
    console.log("item created successfully");
  }
}

/*
Called when the item has been removed, or when there was an error.
We'll just log success or failure here.
*/
function onRemoved() {
  if (chrome.runtime.lastError) {
    console.log("error removing item:" + chrome.runtime.lastError);
  } else {
    console.log("item removed successfully");
  }
}

/*
Create all the context menu items.
*/
chrome.contextMenus.create({
  id: "whole-page",
  title: 'Whole Page',
  contexts: ["all"]
}, onCreated);

chrome.contextMenus.create({
  id: "selection",
  title: "Selection",
  contexts: ["all"]
}, onCreated);

chrome.contextMenus.create({
  id: "separator-1",
  type: "separator",
  contexts: ["all"]
}, onCreated);

chrome.contextMenus.create({
  id: "edit-buffer",
  title: "edit Buffer",
  contexts: ["all"]
}, onCreated);
//
// chrome.contextMenus.create({
//   id: "selection-to-buffer",
//   title: "Selection > Buffer",
//   contexts: ["all"]
// }, onCreated);
//
// chrome.contextMenus.create({
//   id: "separator-2",
//   type: "separator",
//   contexts: ["all"]
// }, onCreated);
//
// chrome.contextMenus.create({
//   id: "save-buffer",
//   title: "save Buffer",
//   contexts: ["all"]
// }, onCreated);


/*
Set a colored border on the document in the given tab.

Note that this only work on normal web pages, not special pages
like about:debugging.
*/
// var blue = 'document.body.style.border = "5px solid blue"';
// var green = 'document.body.style.border = "5px solid green"';
//
// function borderify(tabId, color) {
//   chrome.tabs.executeScript(tabId, {
//     file: 'test.js'
//   });
// }
//
// /*
// Toggle checkedState, and update the menu item's title
// appropriately.
//
// Note that we should not have to maintain checkedState independently like
// this, but have to because Firefox does not currently pass the "checked"
// property into the event listener.
// */
// function updateCheckUncheck() {
//   checkedState = !checkedState;
//   if (checkedState) {
//     chrome.contextMenus.update("check-uncheck", {
//       title: chrome.i18n.getMessage("contextMenuItemUncheckMe"),
//     });
//   } else {
//     chrome.contextMenus.update("check-uncheck", {
//       title: chrome.i18n.getMessage("contextMenuItemCheckMe"),
//     });
//   }
// }

/*
The click event listener, where we perform the appropriate action given the
ID of the menu item that was clicked.
*/
chrome.contextMenus.onClicked.addListener(function(info, tab) {
  switch (info.menuItemId) {
    case "whole-page":
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {type: "whole-page"});
        });
      break;
      case "selection":
          chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
              chrome.tabs.sendMessage(tabs[0].id, {type: "selection"});
          });
        break;
    case "selection-to-buffer":
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {type: "selection-to-buffer"});
        });
      break;
    case "save-buffer":
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {type: "save-buffer"});
        });
        break;
    case "edit-buffer":
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {type: "show-buffer"});
        });
        break;
  }
});
