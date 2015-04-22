var start = document.getElementById("start_button");
var stop = document.getElementById("stop_button");
var message = document.getElementById("message");
var host_capture = document.getElementById("host_capture");
var video = document.createElement("video");
video.setAttribute("width", 640);
video.setAttribute("height", 480);

var audio = document.createElement("audio");
audio.setAttribute("controls", true);

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
            //stopbuttons.appendChild(snapshot);
            host_capture.appendChild(audio);
            audio.mozSrcObject = stream;
            audio.play();
        }, function (err) { getusermedia_error(err, constraints); });
    } catch(e) {
        getusermedia_error(e, constraints);
    }
}

function stopSession() {
    video.mozSrcObject.stop();
    video.mozSrcObject = null;
    host_capture.removeChild(video);
    audio.mozSrcObject.stop();
    audio.mozSrcObject = null;
    host_capture.removeChild(audio);

    stop.style.display = "none";
    start.style.display = "block";
}
