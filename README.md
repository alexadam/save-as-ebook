# save-as-ebook

Save a web page/selection as an eBook (.epub format) - a Chrome/Firefox/Opera Web Extension

<img src="https://github.com/alexadam/save-as-ebook/blob/master/ex11.png?raw=true" width="350">

![alt ex2.png](https://github.com/alexadam/save-as-ebook/blob/master/ex2.png?raw=true)

![alt ex3.png](https://github.com/alexadam/save-as-ebook/blob/master/ex3.png?raw=true)

## How to install it

### From [Chrome Web Store](https://chrome.google.com/webstore/detail/save-as-ebook/haaplkpoiimngbppjihnegfmpejdnffj)

or manually (tested on v. 52.0.2743.116)

```
1. Navigate to chrome://extensions/
2. Load unpacked extension ...
3. Select the extension's directory
```

### From [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/saveasebook/)

or manually (tested on v. 50.0a2)

```
1. Navigate to about:debugging
2. Load temporary add-on ...
3. Select the extension's directory
```

### Opera (tested on v. 39.0.2256.48)

```
1. Navigate to opera:extensions
2. Load unpacked extension ...
3. Select the extension's directory
```

## Convert .epub to .mobi

```
sudo apt-get install calibre
ebook-convert "book.epub" "book.mobi"
```

## Default Keyboard Shortcuts

**NOTE** These shortcuts are not fixed and the browser will assign a different shortcut if the default one is taken

| Shortcut | Description |
| --- | --- |
| Alt + Shift + 1 | Save current page as eBook |
| Alt + Shift + 2 | Save current selection as eBook |
| Alt + Shift + 3 | Add current page as chapter |
| Alt + Shift + 4 | Add current selection as chapter |

## How to change the default Shortcuts

in Chrome:

```
1. Navigate to chrome://extensions/
2. Scroll down
3. Click on Keyboard shortcuts
```

## Added in v1.3
 - Keyboard shortcuts
 - Simplified tool bar menu
 - Misc bug fixes

## Added in v1.2.2
 - fixed &  &amp; issue in title; Issue # 10

## Added in v1.2.1
 - support for hr/br html tags

## Added in v1.2
 - BETA: Support for CSS
 - BETA: Create / edit custom Styles
 - No errors from EPUB Validator (http://validator.idpf.org/) + this should fix the Google Play upload issue

## Added in v1.1
 - Chapter Editor: option to save changes
 - Chapter Editor: option to remove all chapters
 - persist Chapter Editor changes & chapters after generating an eBook or after a browser restart

## To-Do
 - make the Custom Style Editor more user friendly
 - support backup / restore for Custom Styles
 - DONE fix all 'epubcheck' errors (https://github.com/IDPF/epubcheck)
 - clean & optimize code
 - create tests
 - support other formats (mobi, pdf etc.)
 - show confirmations (ui/ux)
 - display errors (ui/ux)
 - DONE support custom style
 - add 'remove from ebook' right click menu action

## Credits
 - http://ebooks.stackexchange.com/questions/1183/what-is-the-minimum-required-content-for-a-valid-epub
 - https://github.com/blowsie/Pure-JavaScript-HTML5-Parser
 - https://stuk.github.io/jszip/
 - http://johnny.github.io/jquery-sortable/
 - https://github.com/eligrey/FileSaver.js/
 - https://www.iconfinder.com/icons/753890/book_books_education_library_study_icon#size=128
 - Thanks to [pumpk0n](https://github.com/pumpk0n) and [Francois Bocquet](https://github.com/fbocquet) for helping me with the French translation
