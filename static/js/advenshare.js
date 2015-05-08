function randomstring(len){
    var s = '';
    var randomchar = function() {
        var n = Math.floor(Math.random() * 62);
        if(n < 10) {
            return n; //1-10
        }
        if(n < 36) {
            return String.fromCharCode(n + 55); // A-Z
        }
        return String.fromCharCode(n + 61); // a-z
    }
    while(s.length < len) {
        s += randomchar();
    }
    return s;
}

function WSConn() {
    var self = this;
    self.verbose = false;
    self.sessionID = "";
    self.id = randomstring(5);
    self.ws = new WebSocket("wss://" + location.host + "/ws/user");
    self.ws.onopen = function(event) {
        console.log("Websocket Opened");
    };

    self.ws.onmessage = function(msg) {
        if(self.verbose) {
            console.log("Received WS Msg: " + msg.data);
        }
        var msgData = JSON.parse(msg.data);
        if(msgData['type'] == 'joinSessionResponse' && self.onJoinSessionResponse) {
            self.onJoinSessionResponse(
                    msgData['status'],
                    msgData['id'],
                    msgData['name'],
                    msgData['host'],
                    msgData['guests']);
        }
        else if(msgData['type'] == 'hello' && self.onHello) {
            self.onHello(msgData['srcID'], msgData['userName']);
        }
        else if(msgData['type'] == 'userLeftSession' && self.onUserLeftSession) {
            self.onUserLeftSession(msgData['id']);
        }
        else if(msgData['type'] == 'offer' && self.onOffer) {
            self.onOffer(msgData['srcID'], msgData['signal']);
        }
        else if(msgData['type'] == 'answer' && self.onAnswer) {
            self.onAnswer(msgData['srcID'], msgData['signal']);
        }
        else if(msgData['type'] == 'candidate' && self.onCandidate) {
            self.onCandidate(msgData['srcID'], msgData['signal']);
        }
        else if(msgData['type'] == 'mouseMove' && self.onMouseMove) {
            self.onMouseMove(msgData['srcID'],
                    msgData['x'],
                    msgData['y']);
        }
        else if(msgData['type'] == 'mouseDown' && self.onMouseDown) {
            self.onMouseDown(msgData['srcID'],
                    msgData['x'],
                    msgData['y'],
                    msgData['button']);
        }
        else if(msgData['type'] == 'mouseUp' && self.onMouseUp) {
            self.onMouseUp(msgData['srcID'],
                    msgData['x'],
                    msgData['y'],
                    msgData['button']);
        }
        else if(msgData['type'] == 'mouseOut' && self.onMouseOut) {
            self.onMouseOut(msgData['srcID']);
        }
        else if(msgData['type'] == 'error' && self.onError) {
            self.onError(msgData['message']);
        }
        else {
            console.log("Unrecognized WS Message: " + msg.data);
        }
    };

    self.sendMsg = function(msg) {
        msg_str = JSON.stringify(msg);
        if(self.verbose) {
            console.log("Sending WS Msg: " + msg_str);
        }
        self.ws.send(msg_str);
    };

    self.sendAnnounce = function(name) {
        self.name = name;
        self.sendMsg({
            type: 'announce',
            srcID: self.id,
            userName: name,
            activeMouseOnly: false
        });
    };

    self.sendCreateSession = function(sessionName, sessionID) {
        self.sessionID = sessionID;
        self.sendMsg({
            type: 'createSession',
            sessionName: sessionName,
            sessionID: sessionID,
            srcID: self.id,
        });
    };

    self.sendJoinSession = function(sessionID) {
        self.sessionID = sessionID;
        self.sendMsg({
            type: 'joinSession',
            sessionID: sessionID,
            srcID: self.id,
        });
    };

    self.sendOffer = function(destID, offer) {
        self.sendMsg({
            type: 'offer',
            signal: offer,
            sessionID: self.sessionID,
            srcID: self.id,
            destID: destID
        });
    };

    self.sendAnswer = function(destID, answer) {
        self.sendMsg({
            type: 'answer',
            signal: answer,
            sessionID: self.sessionID,
            srcID: self.id,
            destID: destID
        });
    };

    self.sendCandidate = function(destID, candidate) {
        self.sendMsg({
            type: 'candidate',
            signal: candidate,
            sessionID: self.sessionID,
            srcID: self.id,
            destID: destID
        });
    };

    self.sendMouseMove = function(x, y) {
        self.sendMsg({
            type: 'mouseMove',
            sessionID: self.sessionID,
            srcID: self.id,
            destID: '*',
            x: x,
            y: y
        });
    };

    self.sendMouseDown = function(x, y, button) {
        self.sendMsg({
            type: 'mouseDown',
            sessionID: self.sessionID,
            srcID: self.id,
            destID: '*',
            x: x,
            y: y,
            button: button
        });
    };

    self.sendMouseUp = function(x, y, button) {
        self.sendMsg({
            type: 'mouseUp',
            sessionID: self.sessionID,
            srcID: self.id,
            destID: '*',
            x: x,
            y: y,
            button: button
        });
    };

    self.sendMouseOut = function() {
        self.sendMsg({
            type: 'mouseOut',
            sessionID: self.sessionID,
            srcID: self.id,
            destID: '*'
        });
    };

    self.sendHello = function() {
        if(!self.name) {
            console.log("Tried to send Hello before the initial announcement");
            return;
        }
        self.sendMsg({
            type: 'hello',
            sessionID: self.sessionID,
            srcID: self.id,
            userName: self.name,
            destID: '*'
        });
    }


    self.onJoinSessionResponse = function(status, sessionID, sessionName, host, guests) {};
    self.onHello = function(userID, userName) {};
    self.onUserLeftSession = function(userID) {};
    self.onOffer = function(userID, offer) {};
    self.onCandidate = function(userID, candidate) {};
    self.onAnswer = function(userID, answer) {};
    self.onMouseMove = function(userID, x, y) {};
    self.onMouseDown = function(userID, x, y, button) {};
    self.onMouseUp = function(userID, x, y, button) {};
    self.onMouseOut = function(userID) {};
    self.onError = function(message) {console.log("WS Error: " + message);};
}

function RTCConn() {
    var self = this;
    self.pc = new RTCPeerConnection();
    self.createOffer = function(constraints, success, failure) {
        self.pc.createOffer(function(offer) {
            offer.sdp = self.processSDP(offer.sdp);
            self.pc.setLocalDescription(offer, function() {
                console.log("Created WebRTC Offer");
                success(offer);
            }, failure);
        }, failure, constraints);
    };

    self.createAnswer = function(offer, success, failure) {
        self.pc.setRemoteDescription(new RTCSessionDescription(offer), function() {
            self.pc.createAnswer(function(answer) {
                answer.sdp = self.processSDP(answer.sdp);
                self.pc.setLocalDescription(answer, function() {
                    console.log("Created WebRTC Answer");
                    success(answer);
                }, failure)
            }, failure)
        }, failure);
    };

    self.handleAnswer = function(answer) {
        console.log("Handling Remote WebRTC Answer");
        self.pc.setRemoteDescription(new RTCSessionDescription(answer));
    };

    self.addStream = function(stream) {
        self.pc.addStream(stream);
    };

    self.addICECandidate = function(candidate) {
        console.log("Adding Remote ICE Candidate");
        self.pc.addIceCandidate(new RTCIceCandidate(candidate));
    };

    self.processSDP = function(sdp) {
        var settings =
            "maxaveragebitrate=200000;" +
            "stereo=1;" +
            "sprop-stereo=1;" +
            "maxplaybackrate=48000;" +
            "sprop-maxcapturerate=48000";
        var opusRegex = /^a=rtpmap:([0-9]+) opus\/48000\/2$/;
        var lines = sdp.split('\r\n');
        var processed = [];

        var findFmtp = function(lines, starting, id) {
            // looks for an a=fmtp line that matches the given format ID
            for(var i = starting; i < lines.length && lines[i][0] != 'm'; i++) {
                prefix = "a=fmtp:" + id;
                if(lines[i].slice(0, prefix.length) == prefix) {
                    return i;
                }
            }

            return -1;
        }

        for(var i = 0; i < lines.length; i++) {
            var line = lines[i];
            processed.push(line);
            var res = opusRegex.exec(line);
            if(res) {
                var rtpID = res[1];
                var fmtpLine = findFmtp(lines, i, rtpID);
                if(fmtpLine >= 0) {
                    // there's already a fmtp line, so we'll add our settings.
                    // We don't need to push it to the processed array because
                    // we'll get there in the loop anyways.
                    lines[fmtpLine] = lines[fmtpLine] + "; " + settings;
                }
                else {
                    // we don't already have a fmtp line, so we push one to the
                    // processed lines
                    processed.push("a=fmtp:" + rtpID + " " + settings);
                }
            }
        }

        return processed.join('\r\n');
    }

    // the onICECandidate callback should send the given candidate to the peer
    // on the other side of the connection. On the far side the code should
    // call the `addICECandidate` method with the given candidate
    self.onICECandidate = null;
    self.pc.onicecandidate = function(evt) {
        console.log("New Local ICE Candidate");
        if(self.onICECandidate) {
            self.onICECandidate(evt.candidate);
        }
    };

    self.pc.onaddstream = function(obj) {
        console.log("RTC Stream Added");
        if(self.onAddStream) {
            self.onAddStream(obj.stream);
        }
    }

    self.onAddStream = function(stream) {};
}

// TODO: probably should wrap some of the RTC interactions instead of users
// just reaching inside to the internal rtc object.
function Peer(id, name, cursorParent) {
    var self = this;
    self.id = id;
    self.name = name;
    self.rtc = new RTCConn();
    var cursor = document.createElement("img");
    cursor.setAttribute('src', '/static/img/crosshair.cur');
    cursor.classList.add("cursor");
    cursor.classList.add("hidden");
    cursorParent.appendChild(cursor);

    var cursorLabel = document.createElement("span");
    cursorLabel.innerHTML = "<p>" + name + "</p>";
    cursorLabel.classList.add("cursor-label");
    cursorLabel.classList.add("hidden");
    cursorParent.appendChild(cursorLabel);

    self.mouseMove = function(x, y) {
        cursor.style.left = (x * cursorParent.clientWidth - cursor.width / 2) + 'px';
        cursor.style.top = (y * cursorParent.clientHeight - cursor.height / 2) + 'px';
        cursor.classList.remove("hidden");
        cursorLabel.style.left = (x * cursorParent.clientWidth) + 'px';
        cursorLabel.style.top = (y * cursorParent.clientHeight) + 'px';
        cursorLabel.classList.remove("hidden");
    };

    self.mouseOut = function() {
        cursor.classList.add("hidden");
        cursorLabel.classList.add("hidden");
    }
}

function AdvenShareApp() {
    var self = this;
    // peers is a dict of Peer objects, keyed on the peer ID
    self.peers = {};
    self.ws = new WSConn();
    self.videoStream = null;
    self.startForm = document.getElementById("start-form");
    self.stopForm = document.getElementById("stop-form");
    self.message = document.getElementById("message");
    self.videoWrapperDiv = document.getElementById("video-wrapper");
    self.video = document.getElementById("screen-video");
    // form elements
    self.nameField = document.getElementById("name-field");
    self.sessionNameField = document.getElementById("session-name-field");
    self.sessionIDField = document.getElementById("session-id-field");
    self.lastMouseMove = 0;

    // called from the button click
    self.createSession = function() {
        if(webrtcDetectedBrowser == 'firefox') {
            constraints = {
                video: {
                    mozMediaSource: "window",
                    mediaSource: "window",
                },
                audio: {
                    echoCancellation: false
                }
            };
        }
        else if(webrtcDetectedBrowser == 'chrome') {
            constraints = {
                video: {
                    googMediaSource: "window",
                    mozMediaSource: "window",
                    mediaSource: "window",
                },
                audio: {
                    mandatory: {
                        echoCancellation: false,
                        googAutoGainControl: false,
                        googAutoGainControl2: false,
                        googEchoCancellation: false,
                        googEchoCancellation2: false,
                        googNoiseSuppression: false,
                        googNoiseSuppression2: false,
                        googHighpassFilter: false,
                        googTypingNoiseDetection: false
                    }
                }
            }
        }
        self.openLocalStream(constraints, function(stream) {
            var userName = self.nameField.value;
            var sessionName = self.sessionNameField.value;
            var sessionID = randomstring(5);
            self.setVideoStream(stream);
            self.message.innerHTML = "<p>Session Started. ID: " + sessionID + "</p>";
            self.ws.sendAnnounce(userName);
            self.ws.sendCreateSession(sessionName, sessionID);
        }, self.errHandler);
    }

    // called from the button click
    self.joinSession = function() {
        var userName = self.nameField.value;
        var sessionID = self.sessionIDField.value;
        self.ws.sendAnnounce(userName);
        self.ws.sendJoinSession(sessionID);

        self.ws.onJoinSessionResponse = function(status, sessionID, sessionName, host, guests) {
            if(status == "success") {
                // introduce ourself to the others in the session. It's polite.
                // (and required)
                self.ws.sendHello();
                var constraints = {
                    offerToReceiveAudio: true,
                    offerToReceiveVideo: true
                };
                var peer = new Peer(host.id, host.name, self.videoWrapperDiv);
                self.peers[host.id] = peer;
                peer.rtc.onAddStream = self.setVideoStream;
                peer.rtc.onICECandidate = function(candidate) {
                    self.ws.sendCandidate(host.id, candidate);
                };
                peer.rtc.createOffer(constraints, function(offer) {
                    self.ws.sendOffer(host.id, offer);
                }, self.errHandler);
                // TODO: this is where we open the audio connections to all the
                // current guests
                for(var i = 0; i < guests.length; i++) {
                    var guest = guests[i];
                    var peer = new Peer(guest.id, guest.name, self.videoWrapperDiv);
                    self.peers[guest.id] = peer;
                }
            }
            else {
                self.setMessage("Join Failed: " + status);
            }
            self.ws.onJoinSessionResponse = null;
        };
    };

    self.setVideoStream = function(stream) {
        if(self.videoStream) {
            self.errHandler("Tried to call self.setVideoStream with active stream!");
            return;
        }
        self.videoStream = stream;
        self.enableStreamView(stream);
    };

    self.ws.onOffer = function(userID, offer) {
        var peer = self.peers[userID];
        if(!peer) {
            self.errHandler("Received offer from unknown peer. They should say hello");
            return;
        }
        peer.rtc.addStream(self.videoStream);
        peer.rtc.createAnswer(offer, function(answer) {
            self.ws.sendAnswer(userID, answer);
        }, self.errHandler);
        peer.rtc.onICECandidate = function(candidate) {
            self.ws.sendCandidate(userID, candidate);
        };
    };

    self.ws.onAnswer = function(userID, answer) {
        self.peers[userID].rtc.handleAnswer(answer);
    };

    self.ws.onCandidate = function(userID, candidate) {
        if(candidate) {
            // seems that a null candidate is generated at the end
            self.peers[userID].rtc.addICECandidate(candidate);
        }
        else {
            console.log("Received null ICE candidate");
        }
    };

    self.ws.onMouseMove = function(userID, x, y) {
        self.peers[userID].mouseMove(x, y);
    };

    self.ws.onMouseOut = function(userID) {
        self.peers[userID].mouseOut();
    };

    self.ws.onHello = function(userID, userName) {
        console.log("User " + userName + "(id " + userID + ") said hello");
        var peer = new Peer(userID, userName, self.videoWrapperDiv);
        self.peers[userID] = peer;
    };

    self.ws.onUserLeftSession = function(userID) {
        var peer = self.peers[userID];
        console.log("User " + peer.name + "(id " + peer.id + ") left session");
        delete self.peers[userID];
    }

    self.setMessage = function(msg) {
        self.message.innerHTML = "<p>" + msg + "</p>";
    };

    // called from the button click
    self.stopSession = function() {
        //self.videoStream.stop();
        attachMediaStream(self.video, null);
        //self.videoWrapperDiv.removeChild(self.video);

        self.stopForm.classList.remove('hidden');
        self.startForm.classList.add('hidden');
        self.videoWrapperDiv.classList.add('hidden');
        self.video.onmousemove = null;
        self.video.onmouseout = null;
    };

    self.enableStreamView = function(stream) {
        self.stopForm.classList.add('hidden');
        self.startForm.classList.remove('hidden');
        self.videoWrapperDiv.classList.remove('hidden');
        self.video.onmousemove = self.videoMouseMoveHandler;
        self.video.onmouseout = self.videoMouseOutHandler;
        //self.videoWrapperDiv.appendChild(self.video);
        attachMediaStream(self.video, stream);
        self.video.play();
    };

    self.errHandler = function(err) {
        console.log("App Error: " + err);
        if(err == "PERMISSION_DENIED") {
            alert("Permission Denied:\nMake sure to enable " +
                    "`media.getusermedia.screensharing.enabled` " +
                    "in `about:config`, and add this domain to " +
                    "media.getusermedia.screensharing.allowed_domains");
        }
    };

    self.openLocalStream = function(constraints, success, failure) {
        // success is called with the stream as it's only argument
        // failure is called with a single error argument. Not sure what type.
        try {
            getUserMedia(constraints, success, failure);
        } catch(e) {
            failure(e);
        }
    };

    // don't assing this directly to the video, we'll do that when it's enabled
    self.videoMouseMoveHandler = function(ev) {
        var now = Date.now();
        // only send mouse moves every 20ms
        if(now - self.lastMouseMove > 20) {
            var ratios = self.getMouseRatios(ev, this);
            var x = ratios.x;
            var y = ratios.y;
            // Seems that if the curser moves too fast sometimes we get mouse moves
            // outside the div
            if(x < 0 || x > 1 || y < 0 || y > 1) {
                return;
            }
            self.lastMouseMove = now;
            self.ws.sendMouseMove(x, y);
        }
    };

    self.getMouseRatios = function(ev, parentDiv) {
        return {
            x: (ev.layerX - parentDiv.offsetLeft) / parentDiv.clientWidth,
            y: (ev.layerY - parentDiv.offsetTop) / parentDiv.clientHeight
        };
    }

    // don't assing this directly to the video, we'll do that when it's enabled
    self.videoMouseOutHandler = function(ev) {
        self.ws.sendMouseOut();
    }

    self.video.onmousedown = function(ev) {
        var ratios = self.getMouseRatios(ev, this);
        self.ws.sendMouseDown(ratios.x, ratios.y, ev.button);
    }
    self.video.onmouseup = function(ev) {
        var ratios = self.getMouseRatios(ev, this);
        self.ws.sendMouseUp(ratios.x, ratios.y, ev.button);
    }
    self.video.onkeydown = function(ev) {};
    self.video.onkeyup = function(ev) {};
}

var app = new AdvenShareApp();
