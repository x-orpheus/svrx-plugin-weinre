;modjewel.define("weinre/target/NetworkRequest", function(require, exports, module) { // Generated by CoffeeScript 1.8.0
var Ex, HookLib, HookSites, IDGenerator, Loader, NetworkRequest, StackTrace, Weinre, getFormData, getHeaders, getRequest, getResponse, getXhrEventHandler, splitContentType, trim;

StackTrace = require('../common/StackTrace');

IDGenerator = require('../common/IDGenerator');

HookLib = require('../common/HookLib');

Weinre = require('../common/Weinre');

Ex = require('../common/Ex');

HookSites = require('./HookSites');

Loader = {
  url: window.location.href,
  frameId: 0,
  loaderId: 0
};

module.exports = NetworkRequest = (function() {
  function NetworkRequest(xhr, id, method, url, stackTrace) {
    this.xhr = xhr;
    this.id = id;
    this.method = method;
    this.url = url;
    this.stackTrace = stackTrace;
  }

  NetworkRequest.prototype.handleSend = function(data) {
    var redirectResponse, request, time;
    Weinre.wi.NetworkNotify.identifierForInitialRequest(this.id, this.url, Loader, this.stackTrace);
    time = Date.now() / 1000.0;
    request = getRequest(this.url, this.method, this.xhr, data);
    redirectResponse = {
      isNull: true
    };
    return Weinre.wi.NetworkNotify.willSendRequest(this.id, time, request, redirectResponse);
  };

  NetworkRequest.prototype.handleHeadersReceived = function() {
    var response, time;
    time = Date.now() / 1000.0;
    response = getResponse(this.xhr);
    return Weinre.wi.NetworkNotify.didReceiveResponse(this.id, time, "XHR", response);
  };

  NetworkRequest.prototype.handleLoading = function() {};

  NetworkRequest.prototype.handleDone = function() {
    var description, e, sourceString, status, statusText, success, time;
    sourceString = "";
    try {
      sourceString = this.xhr.responseText;
    } catch (_error) {
      e = _error;
    }
    Weinre.wi.NetworkNotify.setInitialContent(this.id, sourceString, "XHR");
    time = Date.now() / 1000.0;
    status = this.xhr.status;
    if (status === 0) {
      status = 200;
    }
    statusText = this.xhr.statusText;
    success = status >= 200 && status < 300;
    if (success) {
      return Weinre.wi.NetworkNotify.didFinishLoading(this.id, time);
    } else {
      description = "" + status + " - " + statusText;
      return Weinre.wi.NetworkNotify.didFailLoading(this.id, time, description);
    }
  };

  NetworkRequest.installNativeHooks = function() {
    HookSites.XMLHttpRequest_open.addHooks({
      before: function(receiver, args) {
        var frame, id, method, rawStackTrace, stackTrace, url, xhr, _i, _len;
        xhr = receiver;
        method = args[0];
        url = args[1];
        id = IDGenerator.next();
        rawStackTrace = new StackTrace(args).trace.slice(1);
        stackTrace = [];
        for (_i = 0, _len = rawStackTrace.length; _i < _len; _i++) {
          frame = rawStackTrace[_i];
          stackTrace.push({
            functionName: frame
          });
        }
        xhr.__weinreNetworkRequest__ = new NetworkRequest(xhr, id, method, url, stackTrace);
        return HookLib.ignoreHooks(function() {
          return xhr.addEventListener("readystatechange", getXhrEventHandler(xhr), false);
        });
      }
    });
    return HookSites.XMLHttpRequest_send.addHooks({
      before: function(receiver, args) {
        var data, nr, xhr;
        xhr = receiver;
        data = args[0];
        nr = xhr.__weinreNetworkRequest__;
        if (!nr) {
          return;
        }
        return nr.handleSend(data);
      }
    });
  };

  return NetworkRequest;

})();

getRequest = function(url, method, xhr, data) {
  return {
    url: url,
    httpMethod: method,
    httpHeaderFields: {},
    requestFormData: getFormData(url, data)
  };
};

getResponse = function(xhr) {
  var contentLength, contentType, encoding, headers, result, _ref;
  contentType = xhr.getResponseHeader("Content-Type");
  contentType || (contentType = 'application/octet-stream');
  _ref = splitContentType(contentType), contentType = _ref[0], encoding = _ref[1];
  headers = getHeaders(xhr);
  result = {
    mimeType: contentType,
    textEncodingName: encoding,
    httpStatusCode: xhr.status,
    httpStatusText: xhr.statusText,
    httpHeaderFields: headers,
    connectionReused: false,
    connectionID: 0,
    wasCached: false
  };
  try {
    contentLength = xhr.getResponseHeader("Content-Length");
    contentLength = parseInt(contentLength);
  } catch (_error) {
    contentLength = 0;
  }
  if (!isNaN(contentLength)) {
    result.expectedContentLength = contentLength;
  }
  return result;
};

getHeaders = function(xhr) {
  var key, line, lines, result, string, val, _i, _len, _ref;
  string = xhr.getAllResponseHeaders();
  lines = string.split('\r\n');
  result = {};
  for (_i = 0, _len = lines.length; _i < _len; _i++) {
    line = lines[_i];
    line = trim(line);
    if (line === "") {
      break;
    }
    _ref = line.split(':', 2), key = _ref[0], val = _ref[1];
    result[trim(key)] = trim(val);
  }
  return result;
};

trim = function(string) {
  return string.replace(/^\s+|\s+$/g, '');
};

getFormData = function(url, data) {
  var match, pattern;
  if (data) {
    return data;
  }
  pattern = /.*?\?(.*?)(#.*)?$/;
  match = url.match(pattern);
  if (match) {
    return match[1];
  }
  return "";
};

splitContentType = function(contentType) {
  var match, pattern;
  pattern = /\s*(.*?)\s*(;\s*(.*))?\s*$/;
  match = contentType.match(pattern);
  if (!match) {
    return [contentType, ""];
  }
  return [match[1], match[3]];
};

getXhrEventHandler = function(xhr) {
  return function() {
    var e, nr;
    nr = xhr.__weinreNetworkRequest__;
    if (!nr) {
      return;
    }
    try {
      switch (xhr.readyState) {
        case 2:
          return nr.handleHeadersReceived();
        case 3:
          return nr.handleLoading();
        case 4:
          return nr.handleDone();
      }
    } catch (_error) {
      e = _error;
    }
  };
};

});
