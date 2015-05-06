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
    self.sessionID = "";
    self.id = randomstring(20);
    self.ws = new WebSocket("wss://" + location.host + "/ws/user");
    self.ws.onopen = function(event) {
        console.log("Websocket Opened");
    };

    self.ws.onmessage = function(msg) {
        console.log("Received WS Msg: " + msg.data);
        msgData = JSON.parse(msg.data);
        if(msgData['type'] == 'joinSessionResponse' && self.onJoinSessionResponse) {
            self.onJoinSessionResponse(
                    msgData['status'],
                    msgData['id'],
                    msgData['name'],
                    msgData['host'],
                    msgData['guests']);
        }
        else if(msgData['type'] == 'userJoinedSession' && self.onUserJoinedSession) {
            self.onUserJoinedSession(msgData['id'], msgData['name']);
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
        console.log("Sending WS Msg: " + msg_str);
        self.ws.send(msg_str);
    };

    self.sendAnnounce = function(name) {
        self.sendMsg({
            type: 'announce',
            srcID: self.id,
            userName: name
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


    self.onJoinSessionResponse = function(status, sessionID, sessionName, host, guests) {};
    self.onUserJoinedSession = function(userID, userName) {};
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
    self.pc = new mozRTCPeerConnection();
    self.createOffer = function(constraints, success, failure) {
        self.pc.createOffer(function(offer) {
            self.pc.setLocalDescription(offer, function() {
                console.log("Created WebRTC Offer");
                success(offer);
            }, failure);
        }, failure, constraints);
    };

    self.createAnswer = function(offer, success, failure) {
        self.pc.setRemoteDescription(new mozRTCSessionDescription(offer), function() {
            self.pc.createAnswer(function(answer) {
                self.pc.setLocalDescription(answer, function() {
                    console.log("Created WebRTC Answer");
                    success(answer);
                }, failure)
            }, failure)
        }, failure);
    };

    self.handleAnswer = function(answer) {
        console.log("Handling Remote WebRTC Answer");
        self.pc.setRemoteDescription(new mozRTCSessionDescription(answer));
    };

    self.addStream = function(stream) {
        self.pc.addStream(stream);
    };

    self.addICECandidate = function(candidate) {
        console.log("Adding Remote ICE Candidate");
        self.pc.addIceCandidate(new mozRTCIceCandidate(candidate));
    };

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

function AdvenShareApp() {
    var self = this;
    // rtc is a dict of RTCConn objects, keyed on the peer ID
    self.rtc = {};
    self.ws = new WSConn();
    self.videoStream = null;
    self.startForm = document.getElementById("start-form");
    self.stopForm = document.getElementById("stop-form");
    self.message = document.getElementById("message");
    self.screenMonitor = document.getElementById("screen-monitor");
    self.video = document.createElement("video");
    // form elements
    self.nameField = document.getElementById("name-field");
    self.sessionNameField = document.getElementById("session-name-field");
    self.sessionIDField = document.getElementById("session-id-field");
    self.lastMouseMove = 0;

    // called from the button click
    self.createSession = function() {
        constraints = {
            video: {
                mozMediaSource: "window",
                mediaSource: "window",
            },
            audio: true
        };
        self.openLocalStream(constraints, function(stream) {
            var userName = self.nameField.value;
            var sessionName = self.sessionNameField.value;
            var sessionID = randomstring(20);
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
                var constraints = {
                    offerToReceiveAudio: true,
                    offerToReceiveVideo: true
                };
                var rtc = new RTCConn();
                self.rtc[host.id] = rtc;
                rtc.onAddStream = self.setVideoStream;
                rtc.onICECandidate = function(candidate) {
                    self.ws.sendCandidate(host.id, candidate);
                };
                rtc.createOffer(constraints, function(offer) {
                    self.ws.sendOffer(host.id, offer);
                }, self.errHandler);
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
        var rtc = new RTCConn();
        self.rtc[userID] = rtc;
        rtc.addStream(self.videoStream);
        rtc.createAnswer(offer, function(answer) {
            self.ws.sendAnswer(userID, answer);
        }, self.errHandler);
        rtc.onICECandidate = function(candidate) {
            self.ws.sendCandidate(userID, candidate);
        };
    };

    self.ws.onAnswer = function(userID, answer) {
        self.rtc[userID].handleAnswer(answer);
    };

    self.ws.onCandidate = function(userID, candidate) {
        if(candidate) {
            // seems that a null candidate is generated at the end
            self.rtc[userID].addICECandidate(candidate);
        }
        else {
            console.log("Received null ICE candidate");
        }
    };

    self.setMessage = function(msg) {
        self.message.innerHTML = "<p>" + msg + "</p>";
    };

    // called from the button click
    self.stopSession = function() {
        //self.videoStream.stop();
        self.video.mozSrcObject = null;
        self.screenMonitor.removeChild(self.video);

        self.stopForm.style.display = "none";
        self.startForm.style.display = "block";
    };

    self.enableStreamView = function(stream) {
        self.stopForm.style.display = "block";
        self.startForm.style.display = "none";
        self.screenMonitor.appendChild(self.video);
        self.video.mozSrcObject = stream;
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
            window.navigator.mozGetUserMedia(constraints, success, failure);
        } catch(e) {
            failure(e);
        }
    };

    self.video.onmousemove = function(ev) {
        now = Date.now();
        // only send mouse moves every 20ms
        if(now - self.lastMouseMove > 20) {
            self.lastMouseMove = now;
            self.ws.sendMouseMove(
                    (ev.pageX - this.offsetLeft) / this.clientWidth,
                    (ev.pageY - this.offsetTop) / this.clientHeight);
        }
    };
    self.video.onmousedown = function(ev) {
        self.ws.sendMouseDown(
                (ev.pageX - this.offsetLeft) / this.clientWidth,
                (ev.pageY - this.offsetTop) / this.clientHeight,
                ev.button);
    }
    self.video.onmouseup = function(ev) {
        self.ws.sendMouseUp(
                (ev.pageX - this.offsetLeft) / this.clientWidth,
                (ev.pageY - this.offsetTop) / this.clientHeight,
                ev.button);
    }
    self.video.onmouseout = function(ev) {
        self.ws.sendMouseOut();
    }
    self.video.onkeydown = function(ev) {};
    self.video.onkeyup = function(ev) {};
}

var app = new AdvenShareApp();
