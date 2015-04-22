// this is a super-simple ajax library from
// http://stackoverflow.com/questions/8567114/how-to-make-an-ajax-call-without-jquery
// thanks to Petah. I removed some of the IE support for simplicity
var ajax = {};

ajax.send = function(url, callback, method, data, async) {
    var x = new XMLHttpRequest();
    x.open(method, url, async);
    x.onreadystatechange = function() {
        if (x.readyState == XMLHttpRequest.DONE) {
            callback(x.responseText)
        }
    };
    if (method == 'POST') {
        x.setRequestHeader('Content-type', 'application/json');
    }
    x.send(data)
};

ajax.get = function(url, queryDict, callback) {
    var query = [];
    for (var key in queryDict) {
        query.push(encodeURIComponent(key) + '=' + encodeURIComponent(data[key]));
    }
    ajax.send(url + '?' + query.join('&'), callback, 'GET', null, true)
};

ajax.post = function(url, queryDict, data, callback) {
    var query = [];
    for (var key in queryDict) {
        query.push(encodeURIComponent(key) + '=' + encodeURIComponent(data[key]));
    }
    ajax.send(url + '?' + query.join('&'), callback, 'POST', JSON.stringify(data), true)
};
