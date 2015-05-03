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

var message = document.getElementById("message");
var guest_stream = document.getElementById("guest_stream");
var video = document.createElement("video");
var myID = randomstring(20);
video.setAttribute("width", 1024);
video.setAttribute("height", 768);

var peerConnection = null;

// TODO: figure out how not to hard-code the hostname but use wss
var ws = new WebSocket("wss://localhost:8000/ws/guest");

ws.onopen = function(event) {
    console.log("Websocket Opened");
}

ws.onmessage = function (evt) {
    try {
        var msg = JSON.parse(evt.data);
    } catch(e) {
        console.log(evt.data);
        console.log(e);
    }
    if(msg.type == "answer") {
        peerConnection.setRemoteDescription(new mozRTCSessionDescription(msg.signal));
    }
    else if(msg.type == "candidate") {
        console.log("Adding ICE Candidate");
        peerConnection.addIceCandidate(new mozRTCIceCandidate(msg.signal));
    }
    else {
        console.log("Unrecognized websocket message: " + msg);
    }
};

function peerConnectionError(err) {
    console.log("Got error: " + err);
}

function connectToSession() {
    peerConnection = new mozRTCPeerConnection();
    var el = document.getElementById("session-select");
    //var sessionID = el.options[el.selectedIndex].value;
    // TODO: get session ID from form
    var sessionID = "abcd"
    var name = document.getElementById("name-field").value;

    // send any ice candidates to the other peer
    peerConnection.onicecandidate = function(evt) {
        // seems that it sends a candidate of null when it's done, so we either
        // need to catch it here or in the receiver
        if(evt.candidate) {
            ws.send(JSON.stringify({
                    type: 'candidate',
                    signal: evt.candidate,
                    guestID: myID,
                    hostID: sessionID}));
        }
    };

    // once remote stream arrives, show it in the remote video element
    peerConnection.onaddstream = function(obj) {
        console.log("New Peer Stream");
        guest_video.appendChild(video);
        video.mozSrcObject = obj.stream;
        video.play();
    };

    var constraints = {
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
    };
    peerConnection.createOffer(function(offer) {
        peerConnection.setLocalDescription(offer, function() {
            ws.send(JSON.stringify({
                        type: 'offer',
                        signal: offer,
                        name: name,
                        guestID: myID,
                        hostID: sessionID}));
        }, peerConnectionError);
    }, peerConnectionError, constraints);
}

function disconnectFromSession() {
    video.mozSrcObject.stop();
    video.mozSrcObject = null;
    guest_video.removeChild(video);

    disconnect.style.display = "none";
    connect.style.display = "block";
}

function mouseMove(ev) {
    console.log("Mouse at " + ev.clientX + ", " + ev.clientY);
}
