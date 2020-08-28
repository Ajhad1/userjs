// ==UserScript==
// @name        NoBrighter
// @namespace   https://github.com/henix/userjs/NoBrighter
// @description Change element's background color that is too bright to a light green.
// @author      henix
// @version     20160608.1
// @include     http://*
// @include     https://*
// @exclude     http://boards.4chan.org/*
// @exclude     https://boards.4chan.org/*
// @license     MIT License
// @grant       none
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
// append new style sheet to website
window.document.head.appendChild(newStyleSheet);
/* creates css to adjust pseudo after properties ^^^^^^^^^^^^^^^ */

/* check if background is transparent vvvvvvvvvvvvvvv */
function isTransparent(color) {
    return color === 'transparent' || color.replace(/ /g, '') === 'rgba(0,0,0,0)';
}
/* check if background is transparent ^^^^^^^^^^^^^^^ */

/* change background to set color vvvvvvvvvvvvvvv */
function changeBgcolor(elem) {
    // check if appropriate type of element
    if (elem.nodeType !== Node.ELEMENT_NODE) {
        return;
    }

    // compute effective background color of element
    var bgcolor = window.getComputedStyle(elem, null).backgroundColor;

    // if background is not transparent and within set height change the background color
    if (bgcolor && !isTransparent(bgcolor) && elem.clientHeight >= $minHeight) {
        var arRGB = bgcolor.match(/\d+/g);
        var r = parseInt(arRGB[0], 10);
        var g = parseInt(arRGB[1], 10);
        var b = parseInt(arRGB[2], 10);

        // we adopt HSL's lightness definition, see http://en.wikipedia.org/wiki/HSL_and_HSV
        var brightness = (Math.max(r, g, b) + Math.min(r, g, b)) / 255 / 2;

        // compare background brightness with threshold set
        if (brightness > Brightness_Threshold) {
            // change background color if threshold was exceeded
            elem.style.backgroundColor = targetColor;
        }
        return true;
    } else {
        return false;
    }
}
/* change background to set color ^^^^^^^^^^^^^^^ */

/* unknown function at this time vvvvvvvvvvvvvvv */
function changeTransparent(elem) {
    // computer background color of element
    var bgcolor = window.getComputedStyle(elem, null).backgroundColor;

    // if background color does not match or is transparent
    if (!bgcolor || isTransparent(bgcolor)) {
        // change background color to set color
        elem.style.backgroundColor = targetColor;
    }
}
/* unknown function at this time ^^^^^^^^^^^^^^^ */

function changeAll() {
    // iterate through all elements on site
    var len = alltags.length;
    for (var i = 0; i < len; i++) {
        // change background colors and track changed elements
        var changed = changeBgcolor(alltags[i]);

        // format elements names for tracking
        var tagName = alltags[i].tagName.toUpperCase();

        // if element changed was BODY or HTML mark bodyChanged as true
        if (changed && (tagName === "BODY" || tagName === "HTML")) {
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
    // confirm appropriate type of element
    if (elem.nodeType !== Node.ELEMENT_NODE) {
        return;
    }
    // computer bordercolor of element
    var borderColor = window.getComputedStyle(elem, null).borderColor;

    // checks if element has a border color and if it is transparent or not
    if (borderColor && !isTransparent(borderColor)) {
        var arRGB = borderColor.match(/\d+/g);
        var r = parseInt(arRGB[0], 10);
        var g = parseInt(arRGB[1], 10);
        var b = parseInt(arRGB[2], 10);

        // we adopt HSL's lightness definition, see http://en.wikipedia.org/wiki/HSL_and_HSV
        var brightness = (Math.max(r, g, b) + Math.min(r, g, b)) / 255 / 2;

        // computes whether element has pseudo :after css
        var pseudoVar = window.getComputedStyle(elem, ":after").borderColor;

        // currently debugging brightness levels
        if (brightness > .5) {
            // changes element border to newBorderColor
            elem.style.borderColor = newBorderColor;

            // if element has pseudo :after css adds preset css class to override it
            if (pseudoVar) {
                // adds class to element
                elem.classList.add("changeBorder");
            }
            // console.log(elem.nodeName + " brightness is greater than 5")
        } else {
            // changes element border to newBorderColor
            elem.style.borderColor = newBorderColor;

            // if element has pseudo :after css adds preset css class to override it
            if (pseudoVar) {
                // adds class to element
                elem.classList.add("changeBorder");
            }
            // console.log(elem.nodeName + " brightness is less than 5")
        }
        return true;
    } else {
        return false;
    }
}
/* change border color ^^^^^^^^^^^^^^^ */

/* iterate through all divs in grid to change border colors vvvvvvvvvvvvvvv */
function changeAllBorder() {
    // choose elements to target for change border
    var allDivs = document.querySelectorAll('div[role="grid"]'); // example: var allDivs = document.querySelectorAll('div[role="grid"],div[role="gridcell"],div[role="row"]');

    // get all matching divs and iterate through them
    var len = allDivs.length;
    for (var i = 0; i < len; i++) {
        // changes all top elements
        changeBorderColor(allDivs[i]);

        // calculates all descendants
        var allDivsDescendants = getDescendants(allDivs[i]);

        // iterates through all descendants
        var len2 = allDivsDescendants.length;
        for (var i2 = 0; i2 < len2; i2++) {
            // changes border of all descendants
            changeBorderColor(allDivsDescendants[i2]);

            // checks if descendants have children and changes those as well
            if (allDivsDescendants.hasChildren) {
                // calculates all children of descendants
                var allDivsDescendantsChildren = allDivsDescendants.children;

                // iterates through all children of descendants
                var len3 = allDivsDescendantsChildren.length;
                for (var i3 = 0; i3 < len3; i3++) {
                    // changes border of all children of descendants
                    changeBorderColor(allDivsDescendantsChildren[i3]);
                }
            }
        }
    }
}
/* iterate through all divs in grid to change border colors ^^^^^^^^^^^^^^^ */

/* group change functions together vvvvvvvvvvvvvvv */
function changeAllElements() {
    changeAll();
    changeAllBorder();
}
/* group change functions together ^^^^^^^^^^^^^^^ */

changeAll();
changeAllBorder();

if (window.top == window) {
    // change transparent only when in top frame
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

    // console.log('Request sent');

    this.onreadystatechange = onReadyStateChangeReplacement;
    return send.apply(this, arguments);
}

function onReadyStateChangeReplacement() {

    changeAllElements()
    // console.log('All elements should be changed');

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
