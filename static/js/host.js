function randomstring(L){
    var s= '';
    var randomchar=function(){
        var n= Math.floor(Math.random()*62);
        if(n<10) return n; //1-10
        if(n<36) return String.fromCharCode(n+55); //A-Z
        return String.fromCharCode(n+61); //a-z
    }
    while(s.length< L) s+= randomchar();
    return s;
}

var sharedStream = null;
var start = document.getElementById("start_button");
var stop = document.getElementById("stop_button");
var message = document.getElementById("message");
var host_capture = document.getElementById("host_capture");
var video = document.createElement("video");
//var myID = randomstring(20);
// for now just use a fixed ID so we're easy to connect to
var myID = "abcd";
video.setAttribute("width", 1024);
video.setAttribute("height", 768);

var guests = {};

// TODO: figure out how not to hard-code the hostname but use wss
var ws = new WebSocket("wss://localhost:8000/ws/host");

ws.onopen = function(event) {
    console.log("Websocket Opened");
}

ws.onmessage = function (evt) {
    var msg = JSON.parse(evt.data);
    if(msg.type == "offer") {
        pc = new mozRTCPeerConnection();
        pc.setRemoteDescription(new mozRTCSessionDescription(msg.signal), function() {
            pc.createAnswer(function(answer) {
                pc.setLocalDescription(answer, function() {
                    // send the answer to the remote connection
                    ws.send(JSON.stringify({
                        'type': 'answer',
                        'signal': answer,
                        'guestID': msg.guestID,
                        'hostID': myID}));
                }, function() {
                    console.log("setLocalDescription Failed");
                })
            }, function() {
                console.log("createAnswer Failed");
            })
        }, function() {
            console.log("setRemoteDescription Failed");
        });
        pc.addStream(sharedStream);
        pc.onicecandidate = function (evt) {
            ws.send(JSON.stringify({
                'type': 'candidate',
                'signal': evt.candidate,
                'guestID': msg.guestID,
                'hostID': myID}));
        };
        // store the new peerConnection in our list of guests
        guests[msg.guestID] = {'id': msg.guestID, 'pc': pc};
    }
    else if(msg.type == "candidate") {
        guest = guests[msg.guestID];
        console.log("Adding ICE Candidate");
        guest.pc.addIceCandidate(new mozRTCIceCandidate(msg.signal));
    }
    else {
        console.log("Unrecognized websocket message: " + msg);
    }
};


function getusermedia_error(err, params) {
    if (params.video.mediaSource) {
        if (location.protocol != "https:") {
            message.innerHTML = "<p class='error'>" + err + "</p>" +
                "<p>Screen/window sharing now requires the site be loaded from an https: URL</p>" +
                "<p>Reloading on https: in 3 seconds</p>";
            setTimeout(function() {
                window.location.href = "https:" + window.location.href.substring(window.location.protocol.length);
            }, 3000);
        } else {
            message.innerHTML = "<p class='error'>" + err + "</p>" +
                "<p>In <a href=\"about:config\">about:config</a>, please enable" +
                " media.getusermedia.screensharing.enabled<br> and add this" +
                " site's domain name to media.getusermedia.screensharing.allowed_domains in about:config</p>";
        }
    } else {
        message.innerHTML = "<p class='error'>" + err + "</p>";
    }
    // stopMedia();
}

function peerConnectionError(err) {
    console.log("Got error: " + err);
}


// takes a callback that's called with the stream
function openSharedStream(cb) {
    constraints = {
        video: {
            mozMediaSource: "window",
            mediaSource: "window",
        },
        audio: true
    };
    try {
        window.navigator.mozGetUserMedia(constraints, function(stream) {
            stop.style.display = "block";
            start.style.display = "none";
            message.innerHTML = "<p>Success!</p>";
            host_capture.appendChild(video);
            video.mozSrcObject = stream;
            video.play();
            cb(stream);
        }, function (err) { getusermedia_error(err, constraints); });
    } catch(e) {
        getusermedia_error(e, constraints);
    }
}

function startSession() {
    var name = document.getElementById("name-field").value;
    var sessionName = document.getElementById("game-name-field").value;

    openSharedStream(function(stream) {
        sharedStream = stream;
        ws.send(JSON.stringify({
            "type": "announce",
            "hostID": myID,
            "name": name,
            "sessionName": sessionName
        }))
    });
}


function stopSession() {
    sharedStream.stop();
    video.mozSrcObject = null;
    host_capture.removeChild(video);

    stop.style.display = "none";
    start.style.display = "block";
}
