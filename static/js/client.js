var message = document.getElementById("message");
var client_stream = document.getElementById("client_stream");
var video = document.createElement("video");
video.setAttribute("width", 1024);
video.setAttribute("height", 768);

var peerConnection = null;

var ws = new WebSocket("wss://localhost:8000/ws/client");

ws.onopen = function(event) {
    console.log("Websocket Opened");
}

ws.onmessage = function (evt) {
    if (!peerConnection)
        connectToSession();

    var signal = JSON.parse(evt.data);
    if(signal.sdp) {
        console.log("Setting remote description");
//        peerConnection.setRemoteDescription(new mozRTCSessionDescription(signal), function() {
//            peerConnection.createAnswer(peerConnection.remoteDescription, function(desc) {
//                peerConnection.setLocalDescription(desc);
//                signalingChannel.send(JSON.stringify({ "sdp": desc }));
//            });
//        }, function() {
//            console.log("error on setRemoteDescription");
//        });
        peerConnection.setRemoteDescription( new mozRTCSessionDescription( signal ), function() {
            peerConnection.createAnswer( function( answer ) {
                peerConnection.setLocalDescription( answer, function() {
                    // send the answer to the remote connection
                    ws.send(JSON.stringify(answer));
                }, function() {
                })
            }, function() {
            })
        }, function() {
        });
    }
    else if(signal.candidate) {
        console.log("Adding ICE Candidate");
        peerConnection.addIceCandidate(new mozRTCIceCandidate(signal));
    }
    else {
        console.log("Unrecognized websocket message: " + evt.data);
    }
};

function peerConnectionError(err) {
    console.log("Got error: " + err);
}

function connectToSession() {
    peerConnection = new mozRTCPeerConnection();

    // send any ice candidates to the other peer
    peerConnection.onicecandidate = function (evt) {
        ws.send(JSON.stringify(evt.candidate));
    };

    // once remote stream arrives, show it in the remote video element
    peerConnection.onaddstream = function(obj) {
        console.log("New Peer Stream");
        client_video.appendChild(video);
        video.mozSrcObject = obj.stream;
        video.play();
    };

}

function disconnectFromSession() {
    video.mozSrcObject.stop();
    video.mozSrcObject = null;
    client_video.removeChild(video);

    disconnect.style.display = "none";
    connect.style.display = "block";
}
