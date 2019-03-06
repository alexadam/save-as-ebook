// ==UserScript==
// @name         Hyphenator (for Chrome)
// @version      0.1
// @description  Add Hyphenation to Chrome, which unfortunately does not have this feature (yet)
// @author       M.M., using https://github.com/mnater/Hyphenator
// @include      https://*
// @include      http://*
// @exclude      https://www.heise.de/select/*
// @grant        none
// ==/UserScript==

//// uncomment to debug:
// debugger;

var myCSS = window.document.createElement('style');
myCSS.innerHTML = `
p,
p:not([class]), p[class=""]
{
  text-align: justify !important;
  text-justify: inter-word !important;
  -webkit-hyphens: auto;
  -moz-hyphens: auto;
  -ms-hyphens: auto;
   hyphens: auto;
}

bodyMMM {
    padding: 15px !important;
    background: none;
    background-color: white;
    color: #010101;  /* default text almost black for better readability */
}
`;
document.getElementsByTagName("HEAD")[0].appendChild(myCSS);



// TODO: so far using the Bookmarklet, maybe switch to a different/more efficient? version of embedding the script directly...
// https://github.com/mnater/Hyphenator/blob/wiki/en_HowToUseHyphenator.md#using-hyphenator-as-a-bookmarklet

// Just running the bookmarklet for now...
if (document.createElement) {
    void(head = document.getElementsByTagName('head').item(0));
    void(script = document.createElement('script'));
    //void(script.src = 'https://mnater.github.io/Hyphenator/Hyphenator.js?bm=true');
    void(script.src = 'https://mnater.github.io/Hyphenator/Hyphenator.js?bm=true&displaytogglebox=false&defaultlanguage=en');
    void(script.type = 'text/javascript');
    void(head.appendChild(script));
}

/*
// TODO: could explicitly embed en and de from absolute URL... remoteloading=false
<script src="Hyphenator.js" type="text/javascript"></script>
<script src="patterns/en.js" type="text/javascript"></script>
<script type="text/javascript">
	Hyphenator.config({remoteloading : false});
	Hyphenator.run();
</script>
*/
