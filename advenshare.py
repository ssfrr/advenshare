HTML_DIR = ''
from flask import Flask, send_from_directory # , jsonify, request
from flask_sockets import Sockets
import json
import logging
from coloredlogs import ColoredStreamHandler

app = Flask(__name__)
sockets = Sockets(app)
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
logger.addHandler(ColoredStreamHandler())

# list of sessions is keyed on their IDs
sessions = {}

# define message type strings
ANNOUNCE = 'announce'
JOIN_SESSION = 'joinSession'
CREATE_SESSION = 'createSession'
GET_SESSION_INFO = 'getSessionInfo'


class Session(object):
    def __init__(self, id, name, host):
        self.id = id
        self.name = name
        self.host = host
        self.guests = {}

    def add_guest(self, user):
        self.guests[user.id] = user
        user.session = self

    def remove_guest(self, user):
        del self.guests[user.id]
        user.session = None

    def handle_msg(self, msg, src_user):
        destID = msg['destID']
        if destID == '*':
            host.send(msg)
            for guest in self.guests.itervalues():
                guest.send(msg)
        elif destID == host.id:
            host.send(msg)
        else:
            try:
                self.guests[destID].send(msg)
            except KeyError:
                user_error(src_user.ws, "Unknown Destination: %s" % msg)

    def close(self):
        # it's important here that values() makes a copy because we're about to
        # start mutating the guests dict
        self.host.session = None
        for guest in self.guests.values():
            self.remove_guest(guest)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'host': self.host.to_dict(),
            'guests': [guest.to_dict() for guest in self.guests]
        }

    def to_json(self):
        return json.dumps(self.to_dict())


class User(object):
    def __init__(self, ws, id, name):
        self.id = id
        self.ws = ws
        self.name = name
        self.session = None

    def send(self, msg):
        self.ws.send(msg)

    def is_host(self):
        if self.session is None:
            return False
        if self.session.host is None:
            return False
        if self.session.host == self:
            return True

    def disconnect(self):
        if self.is_host():
            self.session.close()
        else:
            self.session.remove_guest(self)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
        }

    def to_json(self):
        return json.dumps(self.to_dict())


@app.route('/')
@app.route('/guest')
def guest_view():
    return send_from_directory(HTML_DIR, 'guest.html')


@app.route('/host')
def host_view():
    return send_from_directory(HTML_DIR, 'host.html')


@sockets.route('/ws/user')
def user_ws_view(ws):
    user = None

    logger.info("User Connected")
    # wait for the session offer
    while(True):
        try:
            msg = ws.receive()
        except:
            logger.info("Guest Disconnected")
            if user is not None:
                user.disconnect()
            return
        if msg is None:
            logger.info("Got None from Guest, Disconnected")
            if user is not None:
                user.disconnect()
            return
        try:
            msg = json.loads(msg)
        except:
            user_error(ws, 'Invalid JSON: "%s"' % msg)
            continue
        logging.info('Received Guest Msg: %s' % msg)

        validate_msg(ws, msg)
        if user is None
            if mag['type'] == ANNOUNCE:
                user = User(ws, msg['srcID'], msg['userName'])
            else:
                user_error(ws, 'First message must be of type "%s"' % ANNOUNCE)
            continue
        elif msg['srcID'] != user.id:
            user_error(
                ws, "Can't change User ID within the same connection")
            continue
        handle_user_msg(msg, user)


def all_present(dic, attrs):
    '''Tests to make sure all the listed attributes are present in the given
    dictionary'''
    for attr in attrs:
        if attr not in dic:
            return False
    return True


def handle_user_msg(msg, user):
    if msg['type'] == CREATE_SESSION:
        session = Session(msg['sessionID'], msg['sessionName'], user)
        sessions[session.id] = session
        logger.info('Session "%s" created by %s. ID: %s' % (
            session.name, session.host.name, session.id)
        return

    # all other messages get dispatched to their session
    try:
        sessions[msg['sessionID']].handle_msg(msg, user)
    except KeyError:
        user_error(user.ws, "Invalid sessionID: %s" % msg['sessionID'])


def user_error(ws, msg):
    logger.warn(msg)
    err = json.dumps({
        'type': 'error',
        'message': msg
    })
    ws.send(err)


common_required_msg_fields = ['type', 'srcID']
required_msg_fields = {
    ANNOUNCE: ['userName'],
    JOIN_SESSION: ['sessionID'],
    CREATE_SESSION: ['sessionName', 'sessionID']
}


def validate_msg(ws, msg):
    if 'type' not in msg:
        user_error(ws, 'No "type" field in msg: "%s"' % msg)
        return
    extra_fields = required_msg_fields.get(msg['type'], [])
    fields = common_required_msg_fields + extra_fields
    for field in fields:
        if field not in msg:
            user_error(ws, 'No "%s" field in msg: "%s"' % (field, msg))
