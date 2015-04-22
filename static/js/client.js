var connect = document.getElementById("connect_button");
var disconnect = document.getElementById("disconnect_button");
var message = document.getElementById("message");
var client_stream = document.getElementById("client_stream");
var video = document.createElement("video");
video.setAttribute("width", 1024);
video.setAttribute("height", 768);

function peerConnectionError(err) {
    console.log("Got error: " + err);
}

function connectToSession() {
    ajax.get('/sessions', null, function(resp) {
        var resp = JSON.parse(resp)
        if(length(resp.sessions) == 0) {
            message.innerHTML = "<p>No active sessions</p>";
            return;
        }
        var session = sessions[0];
        peerConnection = new mozRTCPeerConnection();
        peerConnection.onaddstream = function(obj) {
            video.mozSrcObject = obj.stream;
            video.play();
        };
        peerConnection.setRemoteDescription(session, function() {
            log("setRemoteDescription, creating answer");
            peerConnection.createAnswer(function(answer) {
                peerConnection.setLocalDescription(answer, function() {
                    // Send answer to remote end.
                    console.log("created Answer and setLocalDescription " + JSON.stringify(answer));
                    ajax.post('/answers', null, answer,
                        function() { console.log("Answer sent!"); });
                    disconnect.style.display = "block";
                    connect.style.display = "none";
                }, peerConnectionError);
            }, peerConnectionError);
        }, peerConnectionError);
    });
}

function disconnectFromSession() {
    video.mozSrcObject.stop();
    video.mozSrcObject = null;
    client_video.removeChild(video);

    disconnect.style.display = "none";
    connect.style.display = "block";
}
