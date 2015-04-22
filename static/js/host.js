var start = document.getElementById("start_button");
var stop = document.getElementById("stop_button");
var message = document.getElementById("message");
var host_capture = document.getElementById("host_capture");
var video = document.createElement("video");
video.setAttribute("width", 1024);
video.setAttribute("height", 768);

var peerConnection = null;

var ws = new WebSocket("wss://localhost:8000/ws/host");

ws.onopen = function(event) {
    console.log("Websocket Opened");
}

ws.onmessage = function (evt) {
    if (!peerConnection) {
        console.log("Got a websocket message before we created a stream");
        return;
    }

    var signal = JSON.parse(evt.data);
    if(signal.sdp) {
        console.log("Setting Remote Description");
        peerConnection.setRemoteDescription(new mozRTCSessionDescription(signal));
    }
    else if(signal.candidate) {
        console.log("Adding ICE Candidate");
        peerConnection.addIceCandidate(new mozRTCIceCandidate(signal));
    }
    else {
        console.log("Unrecognized websocket message: " + evt.data);
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

function startSession() {
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
            // don't play the audio locally or we get feedback. The WebRTC
            // implementation seems to squash it pretty well though!
            peerConnection = new mozRTCPeerConnection();
            peerConnection.addStream(stream);
            // send any ice candidates to the other peer
            peerConnection.onicecandidate = function (evt) {
                ws.send(JSON.stringify(evt.candidate));
            };

            peerConnection.createOffer(function(offer) {
                peerConnection.setLocalDescription(offer, function() {
                    ws.send(JSON.stringify(offer));
                }, peerConnectionError);
            }, peerConnectionError);
        }, function (err) { getusermedia_error(err, constraints); });
    } catch(e) {
        getusermedia_error(e, constraints);
    }
}


function stopSession() {
    video.mozSrcObject.stop();
    video.mozSrcObject = null;
    host_capture.removeChild(video);

    stop.style.display = "none";
    start.style.display = "block";
}
