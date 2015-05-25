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
    self.verbose = true;
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
        else if(msgData['type'] == 'chat' && self.onChat) {
            self.onChat(msgData['srcID'], msgData['message']);
        }
        else if(msgData['type'] == 'chatStatus' && self.onChat) {
            self.onChat(msgData['message']);
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
    };

    self.sendChat = function(msg) {
        self.sendMsg({
            type: 'chat',
            sessionID: self.sessionID,
            srcID: self.id,
            destID: '*',
            message: msg
        });
    };


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
    self.onChat = function(userID, msg) {};
    self.onChatStatus = function(msg) {};
    self.onError = function(message) {console.log("WS Error: " + message);};
}

function RTCConn() {
    var self = this;
    self.pc = new RTCPeerConnection();

    self.close = function() {
        self.pc.close();
    }

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
function Peer(id, name, isHost) {
    var self = this;
    self.id = id;
    self.name = name;
    self.rtc = new RTCConn();
    self.cursorPos = null;
    self.isHost = isHost || false;

    self.close = function() {
        self.rtc.close();
    };

    self.mouseMove = function(x, y) {
        self.cursorPos = {x: x, y: y};
    };

    self.mouseOut = function() {
        self.cursorPos = null;
    }
}

function AdvenShareApp() {
    var self = this;
    // peers is a dict of Peer objects, keyed on the peer ID
    self.peers = {};
    self.chatEntries = [];
    self.ws = new WSConn();
    self.videoStream = null;
    self.startForm = document.getElementById("start-form");
    self.stopForm = document.getElementById("stop-form");
    self.message = document.getElementById("message");
    self.videoWrapperDiv = document.getElementById("video-wrapper");
    self.cursorParentDiv = document.getElementById("cursor-parent");
    self.playerListDiv = document.getElementById("player-list");
    self.chatDiv = document.getElementById("chat");
    self.chatHistoryDiv = document.getElementById("chat-history");
    self.video = document.getElementById("screen-video");
    // form elements
    self.nameField = document.getElementById("name-field");
    self.sessionNameField = document.getElementById("session-name-field");
    self.sessionIDField = document.getElementById("session-id-field");
    self.chatField = document.getElementById("chat-field");
    self.lastMouseMove = 0;
    self.isHosting = false;
    self.mediaConstraints = null;

    // called from the button click
    self.createSession = function() {
        if(self.sessionNameField.value == '') {
            alert("Please enter a Session Name");
            return;
        }
        self.isHosting = true;
        if(webrtcDetectedBrowser == 'firefox') {
            self.videoConstraints = {
                video: {
                    mozMediaSource: "window",
                    mediaSource: "window",
                },
                audio: false
            };
            self.audioConstraints = {
                video: false,
                audio: {
                    echoCancellation: false
                }
            };
            self.openLocalStreams(self.videoConstraints, self.audioConstraints,
                    self.localStreamsOpened, self.errHandler);
        }
        else if(webrtcDetectedBrowser == 'chrome') {
            getScreenId(function(err, sourceId, constraints) {
                self.videoConstraints = {
                    video: {
                        mandatory: {
                            chromeMediaSource: "desktop",
                            chromeMediaSourceId: sourceId
                        }
                    },
                    audio: false
                };
                self.audioConstraints = {
                    video: false,
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
                };
                self.openLocalStreams(self.videoConstraints, self.audioConstraints,
                        self.localStreamsOpened, self.errHandler);
            });
        }
    }

    self.localStreamsOpened = function(videoStream, audioStream) {
        var userName = self.nameField.value;
        var sessionName = self.sessionNameField.value;
        var sessionID = randomstring(5);
        self.setVideoStream(videoStream, true);
        // only play the audio if we're not hosting, in case the host is using
        // the audio output as the stream, which would cause feedback
        self.setAudioStream(audioStream, !self.isHosting);
        self.message.innerHTML = "<p>Session Started. ID: " + sessionID + "</p>";
        self.ws.sendAnnounce(userName);
        self.ws.sendCreateSession(sessionName, sessionID);
    }

    // called from the button click
    self.joinSession = function() {
        var userName = self.nameField.value;
        var sessionID = self.sessionIDField.value;

        if(userName == '') {
            alert("Please enter your name");
            return;
        }
        if(sessionID == '') {
            alert("Please enter a session ID");
            return;
        }
        self.ws.sendAnnounce(userName);
        self.ws.sendJoinSession(sessionID);

        self.ws.onJoinSessionResponse = function(status, sessionID, sessionName, host, guests) {
            if(status == "success") {
                // introduce ourself to the others in the session. It's polite.
                // (and required)
                self.ws.sendHello();
                var peer = new Peer(host.id, host.name, true);
                self.peers[host.id] = peer;
                peer.rtc.onAddStream = function(stream) {
                    var kind = stream.getTracks()[0].kind;
                    if(kind == 'video') {
                        self.setVideoStream(stream, true);
                    }
                    else if(kind == 'audio') {
                        self.setAudioStream(stream, true);
                    }
                };
                peer.rtc.onICECandidate = function(candidate) {
                    self.ws.sendCandidate(host.id, candidate);
                };
                // TODO: this is where we open the audio connections to all the
                // current guests
                for(var i = 0; i < guests.length; i++) {
                    var guest = guests[i];
                    var peer = new Peer(guest.id, guest.name);
                    self.peers[guest.id] = peer;
                }
                self.renderPlayerList();
            }
            else {
                self.setMessage("Join Failed: " + status);
            }
            self.ws.onJoinSessionResponse = null;
        };
    };

    self.setVideoStream = function(stream, localDisplay) {
        if(self.videoStream) {
            self.errHandler("Tried to call self.setVideoStream with active stream!");
            return;
        }
        self.videoStream = stream;
        if(localDisplay) {
            self.monitorVideoStream(stream);
        }
    };

    self.setAudioStream = function(stream, localDisplay) {
        if(self.audioStream) {
            self.errHandler("Tried to call self.setAudioStream with active stream!");
            return;
        }
        self.audioStream = stream;
        if(localDisplay) {
            self.monitorAudioStream(stream);
        }
    };

    self.ws.onOffer = function(userID, offer) {
        var peer = self.peers[userID];
        if(!peer) {
            self.errHandler("Received offer from unknown peer. They should say hello");
            return;
        }
        peer.rtc.createAnswer(offer, function(answer) {
            self.ws.sendAnswer(userID, answer);
        }, self.errHandler);
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
        self.renderCursors();
    };

    self.ws.onMouseOut = function(userID) {
        self.peers[userID].mouseOut();
        self.renderCursors();
    };

    self.ws.onHello = function(userID, userName) {
        console.log("User " + userName + "(id " + userID + ") said hello");
        var peer = new Peer(userID, userName);
        peer.rtc.onICECandidate = function(candidate) {
            self.ws.sendCandidate(userID, candidate);
        };
        self.peers[userID] = peer;
        if(self.isHosting) {
            peer.rtc.addStream(self.videoStream);
            peer.rtc.addStream(self.audioStream);
            peer.rtc.createOffer(self.mediaConstraints, function(offer) {
                self.ws.sendOffer(userID, offer);
            }, self.errHandler);
        }
        self.renderPlayerList();
        self.addChatStatus(peer.name + " joined the session.");
    };

    self.ws.onUserLeftSession = function(userID) {
        var peer = self.peers[userID];
        console.log("User " + peer.name + "(id " + peer.id + ") left session");
        if(userID in self.peers) {
            var peer = self.peers[userID];
            self.addChatStatus(peer.name + " left the session.");
            peer.close();
            delete self.peers[userID];
            self.renderCursors();
            self.renderPlayerList();
        }
    }

    self.ws.onChat = function(userID, msg) {
        var name = userID;
        if(userID in self.peers) {
            name = self.peers[userID].name;
        }
        self.addChat(name, msg);
    }

    self.ws.onChatStatus = function(msg) {
        self.addChatStatus(msg);
    }

    self.setMessage = function(msg) {
        self.message.innerHTML = "<p>" + msg + "</p>";
    };

    self.addChat = function(name, msg) {
        self.chatEntries.push(
            <ChatEntry name={name} message={msg} key={randomstring(32)} />
        );
        self.renderChat();
    }
    
    self.addChatStatus = function(msg) {
        self.chatEntries.push(
            <ChatStatusEntry message={msg} key={randomstring(32)} />
        );
        self.renderChat();
    }

    // called from the button click
    self.stopSession = function() {
        //self.videoStream.stop();
        attachMediaStream(self.video, null);
        //self.videoWrapperDiv.removeChild(self.video);

        self.stopForm.classList.add('hidden');
        self.startForm.classList.remove('hidden');
        self.videoWrapperDiv.classList.add('hidden');
        self.chatDiv.classList.add('hidden');
        self.cursorParentDiv.onmousemove = null;
        self.cursorParentDiv.onmouseout = null;
    };

    self.monitorVideoStream = function(stream) {
        self.stopForm.classList.remove('hidden');
        self.startForm.classList.add('hidden');
        self.videoWrapperDiv.classList.remove('hidden');
        self.chatDiv.classList.remove('hidden');
        self.cursorParentDiv.onmousemove = self.videoMouseMoveHandler;
        self.cursorParentDiv.onmouseout = self.videoMouseOutHandler;
        attachMediaStream(self.video, stream);
        self.video.play();
    };

    // TODO: keep some reference to this audio tag so we can clean up.
    self.monitorAudioStream = function(stream) {
        var audio = new Audio();
        attachMediaStream(audio, stream);
        audio.play();
    };

    self.errHandler = function(err) {
        console.log("App Error: " + err);
        if(err == "PERMISSION_DENIED") {
            alert("Permission Denied:\nMake sure to enable " +
                    "`media.getusermedia.screensharing.enabled` " +
                    "in `about:config`, and add this domain to " +
                    "media.getusermedia.screensharing.allowed_domains");
        }
        else if(err.name == "InvalidStateError") {
            alert('Error opening media:\n ' +
                    'Make sure you have the proper chrome extension installed:\n' +
                    'https://chrome.google.com/webstore/detail/screen-capturing/ajhifddimkapgcifgcodmmfdlknahffk');
        }
    };

    self.openLocalStreams = function(videoConstraints, audioConstraints, success, failure) {
        // success is called with video and audio streams as arguments
        // failure is called with a single error argument. Not sure what type.
        try {
            getUserMedia(videoConstraints, function(videoStream) {
                getUserMedia(audioConstraints, function(audioStream) {
                    success(videoStream, audioStream);
                }, failure);
            }, failure);
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

    // don't assign this directly to the video, we'll do that when it's enabled
    self.videoMouseOutHandler = function(ev) {
        self.ws.sendMouseOut();
    };

    self.cursorParentDiv.onmousedown = function(ev) {
        var ratios = self.getMouseRatios(ev, this);
        self.ws.sendMouseDown(ratios.x, ratios.y, ev.button);
    };
    self.cursorParentDiv.onmouseup = function(ev) {
        var ratios = self.getMouseRatios(ev, this);
        self.ws.sendMouseUp(ratios.x, ratios.y, ev.button);
    };
    self.cursorParentDiv.onkeydown = function(ev) {};
    self.cursorParentDiv.onkeyup = function(ev) {};

    self.chatField.onkeypress = function(ev) {
        var event = ev || window.event;
        var key = event.which || event.keyCode;
        if(key == '13') {
            msg = self.chatField.value;
            self.chatField.value = '';
            self.ws.sendChat(msg);
            self.addChat("Me", msg);
        }
    }

    // this should be called whenver the cursors change, to re-render them
    self.renderCursors = function() {
        var peerList = [];
        for(k in self.peers) {
            peerList.push(self.peers[k]);
        }
        React.render(<CursorViewer peers={peerList} parent={self.cursorParentDiv} />,
                     self.cursorParentDiv);
    };

    // should be called when peer list changes
    self.renderPlayerList = function() {
        var peerList = [];
        for(k in self.peers) {
            // Don't include ourselves in the list
            // Also, we don't include the host, as it's currently not really 
            // practical for the host to be a participant.
            if(k != self.ws.id && !self.peers[k].isHost) {
                peerList.push(self.peers[k]);
            }
        }
        React.render(<PlayerList peers={peerList} />,
                     self.playerListDiv);
    };

    self.renderChat = function() {
        var autoscroll = (self.chatHistoryDiv.scrollTop >= 
            (self.chatHistoryDiv.scrollHeight - self.chatHistoryDiv.clientHeight));

        console.log(self.chatHistoryDiv.scrollTop + " " + 
            (self.chatHistoryDiv.scrollHeight - self.chatHistoryDiv.clientHeight));
        React.render(<ChatHistory entries={self.chatEntries} />,
            self.chatHistoryDiv);

        if(autoscroll) {
            self.chatHistoryDiv.scrollTop = self.chatHistoryDiv.scrollHeight;
        }
    };
}

var CursorViewer = React.createClass({
    render: function() {
        var self = this;
        var compList =  self.props.peers.filter(function(peer) {
            return peer.cursorPos !== null;
        }).map(function(peer) {
            return <PlayerCursor
                key={peer.id}
                name={peer.name}
                x={peer.cursorPos.x}
                y={peer.cursorPos.y}
                parent={self.props.parent} />
        });
        return <div>{compList}</div>;
    }
});

var PlayerCursor = React.createClass({
    render: function() {
        var cursorStyle = {
            left: this.props.x * this.props.parent.clientWidth,
            top: this.props.y * this.props.parent.clientHeight
        };
        return (
            <div style={cursorStyle} className="cursor">
                <img src="/static/img/crosshair.cur" />
                <span><p>{this.props.name}</p></span>
            </div>
        );
    }
});

var PlayerList = React.createClass({
    render: function() {
        var players = this.props.peers.map(function(peer) {
            return <PlayerListEntry name={peer.name} key={peer.id} />;
        });
        if(players.length < 1) {
            return <span>Playing by yourself.</span>;
        } else if(players.length == 1)  {
            return <span>Playing with {players[0]}.</span> ;
        } else {
            pl = [];
            for(var i=0; i<players.length-1; i++) {
                pl.push(players[i]);
                if(i < players.length-2 || players.length > 2) {
                    pl.push(', ');
                } else {
                    pl.push(' ');
                }
            }
            pl.push("and ");
            pl.push(players[players.length-1]);
            return <span>Playing with {pl}.</span>;
        }
    }
});

var PlayerListEntry = React.createClass({
    render: function() {
        return <a className="player">{this.props.name}</a>;
    }
});

var ChatHistory = React.createClass({
    render: function() {
        return (
            <div>{this.props.entries}</div>
        );
    }
});

var ChatEntry = React.createClass({
    render: function() {
        var rawMarkup = marked(this.props.message, {sanitize: true});
        return (
            <div className="twelve columns chat-entry">
                <span className="chat-name">{this.props.name}: </span>
                <span dangerouslySetInnerHTML={{__html: rawMarkup}} />
            </div>
        );
    }
});

var ChatStatusEntry = React.createClass({
    render: function() {
        var rawMarkup = marked(this.props.message, {sanitize: true});
        return (
            <div className="twelve columns chat-status-entry">
                <span dangerouslySetInnerHTML={{__html: rawMarkup}} />
            </div>
        );
    }
});

/* Markdown rendering options for chat */
var inlineMarkdownRenderer = new marked.Renderer();
inlineMarkdownRenderer.paragraph = function(text) { return text; };
inlineMarkdownRenderer.link = function(href, title, text) {
    if (this.options.sanitize) {
        try {
            var prot = decodeURIComponent(unescape(href))
                .replace(/[^\w:]/g, '')
                .toLowerCase();
        } catch (e) {
            return '';
        }
        if (prot.indexOf('javascript:') === 0 || prot.indexOf('vbscript:') === 0) {
            return '';
        }
    }
    var out = '<a href="' + href + '"';
    if (title) {
        out += ' title="' + title + '"';
    }
    out += ' target="_blank">' + text + '</a>';
    return out;
};
marked.setOptions({
    renderer: inlineMarkdownRenderer,
});

var app = new AdvenShareApp();
