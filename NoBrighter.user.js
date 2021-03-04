// ==UserScript==
// @name        NoBrighter
// @namespace   https://github.com/ajhad1/userjs/NoBrighter.user.js
// @description Change element's background color that is too bright to a light green. AND continuously monitor for updates to page without page load
// @author      henix
// @version     20210304.1
// @include     http://*
// @include     https://*
// @license     MIT License
// @grant       none
// @require     chrome.storage.sync.get(['@source#b6300f30-cb03-498d-86a3-0acfe20d30d4']);
// ==/UserScript==

/**
 * ChangeLog:
 *
 * see https://github.com/henix/userjs/commits/master/NoBrighter.js
 *
 * 2013-12-4	henix
 * 		changeTransparent should be called on <html> tag, because it can set background-color. fix #1
 * 		Provided other colors, you can uncomment them to use. The number after them is brightness.
 *
 * 2013-6-17	henix
 * 		The latest version of TamperMonkey don't support "*", change to "http://*" and "https://*"
 *
 * 2012-8-16	henix
 * 		Change transparent body only when in top frame.
 *
 * 		There could be a transparent iframe in a dark parent frame, in which case the old logic will do wrong.
 *
 * 2012-7-19	henix
 * 		Remove prependSheet because it may clash with <body bgcolor="XX">
 *
 * 2012-7-15	henix
 *		Exclude boards.4chan.org
 *
 *		Because users could choose their own style from 4chan which loads after NoBrighter
 *
 * 2012-7-14	henix
 * 		Add changeTransparent()
 *
 * 2012-7-14	henix
 * 		Use css stylesheet to set body's default background-color
 *
 * 2012-7-12	henix
 * 		Version 0.1
 */

// ========== Config ========== //

// Uncomment to use, number after is its brightness

/* Green */
// var targetColor = '#C7EDCC'; // 93
// var targetColor = '#C1E6C6'; // 90

/* Gray */
var targetColor = '#dddddd'; // 90
var newBorderColor = '#ffffff'; // 90

/* Wheat */
// var targetColor = '#E6D6B8'; // 90
// var targetColor = '#E3E1D1'; // 89

var Brightness_Threshold = 0.94; // a number between 0 and 1

/* For websites updating their contents via ajax, NoBrighter can run in background and convert background color periodically. vvvvvvvvvvvvvvv */
// Replaced with code that intercepts ajax requests and runs functions when they finish
/*
var longRunSites = [
  'mail.google.com',
  'docs.google.com',
  'plus.google.com',
  'groups.google.com',
    'calendar.google.com',

  'twitter.com',
  'github.com',

  'www.coursera.org',
  'class.coursera.org',

  'weibo.com',
  'www.weibo.com',
  'www.renren.com',

  'feedly.com',
  'reader.aol.com',
  'identityfusion.atlassian.net',
];
*/
/* For websites updating their contents via ajax, NoBrighter can run in background and convert background color periodically. ^^^^^^^^^^^^^^^ */

var $minHeight = 6;

// ========== End of config ========== //

// ========== Instantiation ========== //

var alltags = document.getElementsByTagName("*"); // query all elements to change background
var bodyChanged = false; // for tracking changed elements

/* creates css to adjust pseudo after properties vvvvvvvvvvvvvvv */
var newStyleSheet = document.createElement('style');
newStyleSheet.innerHTML = `
    /* changes border color for pseudo after elements */
    .changeBorder:after {
        border-color: `+newBorderColor+`;
    }
    /* changes border colors on class Box */
    .Box, .Box-header {
        border-color: `+newBorderColor+`;
    }
	`;

window.document.head.appendChild(newStyleSheet); // append new style sheet to website
/* creates css to adjust pseudo after properties ^^^^^^^^^^^^^^^ */

/* check if background is transparent vvvvvvvvvvvvvvv */
function isTransparent(color) {
    return color === 'transparent' || color.replace(/ /g, '') === 'rgba(0,0,0,0)';
}
/* check if background is transparent ^^^^^^^^^^^^^^^ */

/* change background to set color vvvvvvvvvvvvvvv */
function changeBgcolor(elem) {
    if (elem.nodeType !== Node.ELEMENT_NODE) { // check if appropriate type of element
        return;
    }

    var bgcolor = window.getComputedStyle(elem, null).backgroundColor; // compute effective background color of element

    if (bgcolor && !isTransparent(bgcolor) && elem.clientHeight >= $minHeight) { // if background is not transparent and within set height change the background color
        var arRGB = bgcolor.match(/\d+/g);
        var r = parseInt(arRGB[0], 10);
        var g = parseInt(arRGB[1], 10);
        var b = parseInt(arRGB[2], 10);

        var brightness = (Math.max(r, g, b) + Math.min(r, g, b)) / 255 / 2; // we adopt HSL's lightness definition, see http://en.wikipedia.org/wiki/HSL_and_HSV

        if (brightness > Brightness_Threshold) { // compare background brightness with threshold set
            elem.style.backgroundColor = targetColor; // change background color if threshold was exceeded
        }
        return true;
    } else {
        return false;
    }
}
/* change background to set color ^^^^^^^^^^^^^^^ */

/* unknown function at this time vvvvvvvvvvvvvvv */
function changeTransparent(elem) {
    var bgcolor = window.getComputedStyle(elem, null).backgroundColor; // computer background color of element

    if (!bgcolor || isTransparent(bgcolor)) { // if background color does not match or is transparent
        elem.style.backgroundColor = targetColor; // change background color to set color
    }
}
/* unknown function at this time ^^^^^^^^^^^^^^^ */

function changeAll() {
    var len = alltags.length;

    for (var i = 0; i < len; i++) { // iterate through all elements on site // change background colors and track changed elements
        var changed = changeBgcolor(alltags[i]);

        var tagName = alltags[i].tagName.toUpperCase(); // format elements names for tracking

        if (changed && (tagName === "BODY" || tagName === "HTML")) { // if element changed was BODY or HTML mark bodyChanged as true
            bodyChanged = true;
        }
    }
}

/* get all children of children vvvvvvvvvvvvvvv */
// source https://stackoverflow.com/a/33529528/13033365
function getDescendants(node, accum) {
    var i;
    accum = accum || [];
    for (i = 0; i < node.childNodes.length; i++) {
        accum.push(node.childNodes[i])
        getDescendants(node.childNodes[i], accum);
    }
    return accum;
}
/* get all children of children ^^^^^^^^^^^^^^^ */

/* change border color vvvvvvvvvvvvvvv */
function changeBorderColor(elem) {
    if (elem.nodeType !== Node.ELEMENT_NODE) { // confirm appropriate type of element
        return;
    }

    var borderColor = window.getComputedStyle(elem, null).borderColor; // computer bordercolor of element

    if (borderColor && !isTransparent(borderColor)) { // checks if element has a border color and if it is transparent or not
        var arRGB = borderColor.match(/\d+/g);
        var r = parseInt(arRGB[0], 10);
        var g = parseInt(arRGB[1], 10);
        var b = parseInt(arRGB[2], 10);

        var brightness = (Math.max(r, g, b) + Math.min(r, g, b)) / 255 / 2; // we adopt HSL's lightness definition, see http://en.wikipedia.org/wiki/HSL_and_HSV
        var pseudoVar = window.getComputedStyle(elem, ":after").borderColor; // computes whether element has pseudo :after css

        if (brightness > .5) { // currently debugging brightness levels
            elem.style.borderColor = newBorderColor; // changes element border to newBorderColor

            if (pseudoVar) { // if element has pseudo :after css adds preset css class to override it
                elem.classList.add("changeBorder"); // adds class to element
            }
            // console.log(elem.nodeName + " brightness is greater than 5") // for debugging
        } else {
            elem.style.borderColor = newBorderColor; // changes element border to newBorderColor

            if (pseudoVar) { // if element has pseudo :after css adds preset css class to override it
                elem.classList.add("changeBorder"); // adds class to element
            }
            // console.log(elem.nodeName + " brightness is less than 5") // for debugging
        }
        return true;
    } else {
        return false;
    }
}
/* change border color ^^^^^^^^^^^^^^^ */

/* iterate through all divs in grid to change border colors vvvvvvvvvvvvvvv */
function changeAllBorder() {
    var allDivs = document.querySelectorAll('div[role="grid"]'); // choose elements to target for change border // example: var allDivs = document.querySelectorAll('div[role="grid"],div[role="gridcell"],div[role="row"]');
    var len = allDivs.length;

    for (var i = 0; i < len; i++) { // get all matching divs and iterate through them
        changeBorderColor(allDivs[i]); // changes all top elements

        var allDivsDescendants = getDescendants(allDivs[i]); // calculates all descendants
        var len2 = allDivsDescendants.length;

        for (var i2 = 0; i2 < len2; i2++) { // iterates through all descendants
            changeBorderColor(allDivsDescendants[i2]); // changes border of all descendants

            if (allDivsDescendants.hasChildren) { // checks if descendants have children and changes those as well
                var allDivsDescendantsChildren = allDivsDescendants.children; // calculates all children of descendants
                var len3 = allDivsDescendantsChildren.length;

                for (var i3 = 0; i3 < len3; i3++) { // iterates through all children of descendants
                    changeBorderColor(allDivsDescendantsChildren[i3]); // changes border of all children of descendants
                }
            }
        }
    }
}
/* iterate through all divs in grid to change border colors ^^^^^^^^^^^^^^^ */

/* JIRA update to webpage to make it better to use by moving menu around vvvvvvvvvvvvvvv */
function jiraUpdate() { // moves operation items to top-header
    // await new Promise(r => setTimeout(r, 2000)); // waits for page load
    if ( window.location.href.match(/https\:\/\/identityfusion\.atlassian\.net\/.*/gi) ) {
        // console.log("JIRA Match Found in "+window.location.href); // for debugging

        if (document.getElementById("ghx-operations")) {
            var fragment = document.createDocumentFragment(); // creates fragment to insert later

            // console.log("Found ghx-operations"); // for debugging
            document.getElementById("ghx-operations").style.order = 1; // sets the order for the header for the element
            fragment.appendChild(document.querySelector("#ghx-operations")); // moves the element to the fragment
            document.querySelector("#ghx-header > div").appendChild(fragment); // moves the fragment containing the element to the header

            document.getElementById("ghx-quick-filters").style.marginBottom = '0px'; // adjust the margin for the element to match the header
            document.getElementById("ghx-header").style.paddingBottom = '0px'; // adjusts the headers padding to better fit main content
        } else {
            // console.log("Did not find ghx-operations"); // for debugging
        };
    };
}
/* JIRA update to webpage to make it better to use by moving menu around ^^^^^^^^^^^^^^^ */

/* group change functions together vvvvvvvvvvvvvvv */
function changeAllElements() {
    changeAll();
    changeAllBorder();
    jiraUpdate();
}
/* group change functions together ^^^^^^^^^^^^^^^ */

// changeAll();
// changeAllBorder();
changeAllElements();

if (window.top == window) { // change transparent only when in top frame
    if (!bodyChanged) {
        changeTransparent(document.body.parentNode);
    }
}

/* iterates through all sites set in longRun section vvvvvvvvvvvvvvv */
// replaced with code that intercepts ajax requests and runs functions once they are completed
/*
for (var i = 0; i < longRunSites.length; i++) {
    if (location.hostname === longRunSites[i]) {
        // logs in console if site is going to be checked forever
        console.info('make NoBrighter runs forever...');

        // sets 2 second interval to run functions
        setInterval(changeAll, 2000); // convert every 2s
        setInterval(changeAllBorder, 2000); // convert every 2s
        break;
    }
}
*/
/* iterates through all sites set in longRun section ^^^^^^^^^^^^^^^ */

/* unknown function vvvvvvvvvvvvvvv */
/*
document.body.addEventListener('DOMNodeInserted', function(e) {
  changeBgcolor(e.target);
}, false);
*/
/* unknown function ^^^^^^^^^^^^^^^ */

/* capture ajax requests and run change functions when they are finished vvvvvvvvvvvvvvv */
// source https://dmitripavlutin.com/catch-the-xmlhttp-request-in-plain-javascript/
var open = window.XMLHttpRequest.prototype.open,
    send = window.XMLHttpRequest.prototype.send;

function openReplacement(method, url, async, user, password) {
    this._url = url;
    return open.apply(this, arguments);
}

function sendReplacement(data) {
    if(this.onreadystatechange) {
        this._onreadystatechange = this.onreadystatechange;
    }

    // console.log('Request sent'); // for debugging

    this.onreadystatechange = onReadyStateChangeReplacement;
    return send.apply(this, arguments);
}

function onReadyStateChangeReplacement() {
    changeAllElements();
    // console.log('All elements should be changed'); // for debugging

    if(this._onreadystatechange) {
        return this._onreadystatechange.apply(this, arguments);
    }
}

window.XMLHttpRequest.prototype.open = openReplacement;
window.XMLHttpRequest.prototype.send = sendReplacement;

var request = new XMLHttpRequest();
request.open('GET', '.', true);
request.send();
/* capture ajax requests and run change functions when they are finished ^^^^^^^^^^^^^^^ */
