// ==UserScript==
// @name        Xueqiu Follow Helper
// @namespace   https://github.com/henix/userjs/xueqiu_helper
// @description 在雪球组合上显示最近一个交易日调仓的成交价。允许为每个组合设置预算，并根据预算计算应买卖的股数。
// @author      henix
// @version     20151017.2
// @include     http://xueqiu.com/P/*
// @license     MIT License
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_xmlhttpRequest
// @grant       unsafeWindow
// @grant       GM_addStyle
// ==/UserScript==

/**
 * https://github.com/jed/domo/blob/master/lib/domo.js
 */
// domo.js 0.5.7

// (c) 2012 Jed Schmidt
// domo.js is distributed under the MIT license.
// For more details, see http://domo-js.com

!function() {
  // Determine the global object.
  var global = Function("return this")()

  // Valid HTML5 tag names used to generate DOM functions.
  var tags = [
    "A", "ABBR", "ACRONYM", "ADDRESS", "AREA", "ARTICLE", "ASIDE", "AUDIO",
    "B", "BDI", "BDO", "BIG", "BLOCKQUOTE", "BODY", "BR", "BUTTON",
    "CANVAS", "CAPTION", "CITE", "CODE", "COL", "COLGROUP", "COMMAND",
    "DATALIST", "DD", "DEL", "DETAILS", "DFN", "DIV", "DL", "DT", "EM",
    "EMBED", "FIELDSET", "FIGCAPTION", "FIGURE", "FOOTER", "FORM", "FRAME",
    "FRAMESET", "H1", "H2", "H3", "H4", "H5", "H6", "HEAD", "HEADER",
    "HGROUP", "HR", "HTML", "I", "IFRAME", "IMG", "INPUT", "INS", "KBD",
    "KEYGEN", "LABEL", "LEGEND", "LI", "LINK", "MAP", "MARK", "META",
    "METER", "NAV", "NOSCRIPT", "OBJECT", "OL", "OPTGROUP", "OPTION",
    "OUTPUT", "P", "PARAM", "PRE", "PROGRESS", "Q", "RP", "RT", "RUBY",
    "SAMP", "SCRIPT", "SECTION", "SELECT", "SMALL", "SOURCE", "SPAN",
    "SPLIT", "STRONG", "STYLE", "SUB", "SUMMARY", "SUP", "TABLE", "TBODY",
    "TD", "TEXTAREA", "TFOOT", "TH", "THEAD", "TIME", "TITLE", "TR",
    "TRACK", "TT", "UL", "VAR", "VIDEO", "WBR"
  ]

  // Turn a camelCase string into a hyphenated one.
  // Used for CSS property names and DOM element attributes.
  function hyphenify(text) {
    return text.replace(/[A-Z]/g, "-$&").toLowerCase()
  }

  // Cache select Array/Object methods
  var shift = Array.prototype.shift
  var unshift = Array.prototype.unshift
  var concat = Array.prototype.concat
  var has = Object.prototype.hasOwnProperty

  // Export the Domo constructor for a CommonJS environment,
  // or create a new Domo namespace otherwise.
  typeof module == "object"
    ? module.exports = Domo
    : new Domo(global.document).global(true)

  // Create a new domo namespace, scoped to the given document.
  function Domo(document) {
    if (!document) throw new Error("No document provided.")

    this.domo = this

    // Create a DOM comment
    this.COMMENT = function(nodeValue) {
      return document.createComment(nodeValue)
    }

    // Create a DOM text node
    this.TEXT = function(nodeValue) {
      return document.createTextNode(nodeValue)
    }

    // Create a DOM fragment
    this.FRAGMENT = function() {
      var fragment = document.createDocumentFragment()
      var childNodes = concat.apply([], arguments)
      var length = childNodes.length
      var i = 0
      var child

      while (i < length) {
        child = childNodes[i++]

        while (typeof child == "function") child = child()

        if (child == null) child = this.COMMENT(child)

        else if (!child.nodeType) child = this.TEXT(child)

        fragment.appendChild(child)
      }

      return fragment
    }

    // Create a DOM element
    this.ELEMENT = function() {
      var childNodes = concat.apply([], arguments)
      var nodeName = childNodes.shift()
      var element = document.createElement(nodeName)
      var attributes = childNodes[0]

      if (attributes) {
        if (typeof attributes == "object" && !attributes.nodeType) {
          for (var name in attributes) if (has.call(attributes, name)) {
            element.setAttribute(hyphenify(name), attributes[name])
          }

          childNodes.shift()
        }
      }

      if (childNodes.length) {
        element.appendChild(
          this.FRAGMENT.apply(this, childNodes)
        )        
      }

      switch (nodeName) {
        case "HTML":
        case "HEAD":
        case "BODY":
          var replaced = document.getElementsByTagName(nodeName)[0]

          if (replaced) replaced.parentNode.replaceChild(element, replaced)
      }

      return element
    }

    // Convenience functions to create each HTML5 element
    var i = tags.length
    while (i--) !function(domo, nodeName) {
      domo[nodeName] =
      domo[nodeName.toLowerCase()] =

      function() {
        unshift.call(arguments, nodeName)
        return domo.ELEMENT.apply(domo, arguments)
      }
    }(this, tags[i])

    // Create a CSS style rule
    this.STYLE.on = function() {
      var selector = String(shift.call(arguments))
      var rules = concat.apply([], arguments)
      var css = selector + "{"
      var i = 0
      var l = rules.length
      var key
      var block

      while (i < l) {
        block = rules[i++]

        switch (typeof block) {
          case "object":
            for (key in block) {
              css += hyphenify(key) + ":" + block[key] + ";"
            }
            break

          case "string":
            css = selector + " " + block + css
            break
        }
      }

      css += "}\n"

      return css
    }

    // Pollute the global scope for convenience.
    this.global = function(on) {
      var values = this.global.values
      var key
      var code

      if (on !== false) {
        global.domo = this

        for (key in this) {
          code = key.charCodeAt(0)

          if (code < 65 || code > 90) continue

          if (this[key] == global[key]) continue

          if (key in global) values[key] = global[key]

          global[key] = this[key]
        }
      }

      else {
        try {
          delete global.domo
        } catch (e) {
          global.domo = undefined
        }

        for (key in this) {
          if (key in values) {
            if (global[key] == this[key]) global[key] = values[key]
          }

          else delete global[key]
        }
      }

      return this
    }

    // A place to store previous global properties
    this.global.values = {}
  }
}()
;

/**
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/sign
 */
Math.sign = Math.sign || function(x) {
  x = +x; // convert to a number
  if (x === 0 || isNaN(x)) {
    return x;
  }
  return x > 0 ? 1 : -1;
};

domo.global(true);

var symbol = unsafeWindow.SNB.cubeInfo.symbol;

function myround(x) {
  return Math.sign(x) * Math.round(Math.abs(x));
}

function renderActions(actions, budget) {
  var trs = actions.map(function(a) {
    var utime = new Date(a.updated_at);
    function pad(x) { return x > 10 ? x : "0" + x; }
    return [TR(TD({colspan:4}, utime.getFullYear() + "-" + (utime.getMonth()+1) + "-" + utime.getDate() + " " + utime.getHours() + ":" + pad(utime.getMinutes()) + ":" + pad(utime.getSeconds())))].concat(a.rebalancing_histories.map(function(r) {
      var prev_weight = r.prev_weight_adjusted || 0;
      return TR(TD(A({target:"_blank",href:"/S/" + r.stock_symbol}, r.stock_name), "(" + r.stock_symbol.replace(/^SH|^SZ/, "$&.") + ")"), TD(prev_weight + "% → " + r.target_weight + "%"), TD(r.price), TD(myround(budget * (r.target_weight - prev_weight) / 100 / r.price)));
    }));
  }).reduce(function(a, b) { return a.concat(b); }, []);

  var input = INPUT({value:budget});
  var saveBut = INPUT({type:"button",value:"保存"});
  saveBut.addEventListener("click", function() {
    GM_setValue("budget." + symbol, input.value);
    alert("保存成功，请刷新页面");
  });
  var settings = DIV({"class":"budget-setting"}, "预算 ", input, " 元 ", saveBut);

  return DIV({"class":"follow-details"},
    TABLE.apply(null, [TR(TH("名称"), TH("百分比"), TH("参考成交价"), TH("买卖股数"))].concat(trs)),
    settings
  );
}

GM_xmlhttpRequest({
  method: "GET",
  url: "http://xueqiu.com/cubes/rebalancing/history.json?cube_symbol=" + symbol + "&count=20&page=1",
  onload: function(resp) {
    var histories = JSON.parse(resp.responseText);
    var now = new Date(histories.list[0].updated_at);
    var lastday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    var actions = histories.list.filter(function(o) { return o.status == "success" && o.updated_at > lastday; });
    var weightCircle = document.getElementById("weight-circle");
    weightCircle.parentNode.insertBefore(renderActions(actions, parseInt(GM_getValue("budget." + symbol, 10000), 10)), weightCircle);
  }
});

GM_addStyle(
".follow-details table { width: 100%; margin: 10px auto; }" +
".follow-details th { font-weight: bold; }" +
".follow-details th, .follow-details td { border: 1px solid black; padding: 0.5em; }" +
".follow-details .budget-setting { margin: 10px 0 20px 0; }"
);
