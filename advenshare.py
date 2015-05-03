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

# list of hosts is keyed on their IDs
hosts = {}


class Host(object):
    def __init__(self, id, name, session_name, ws):
        self.id = id
        self.name = name
        self.session_name = session_name
        self.ws = ws
        self.guests = {}

    def add_guest(self, guest):
        self.guests[guest.id] = guest

    def remove_guest(self, guest):
        del self.guests[guest.id]

    def send(self, msg):
        self.ws.send(msg)

    def handle_msg(self, msg):
        msg = json.loads(msg)
        self.guests[msg['guestID']].send(msg)

    @classmethod
    def from_json(cls, msg, ws):
        msg = json.loads(msg)
        if all_present(msg, ['hostID', 'name', 'sessionName']):
            return cls(msg['hostID'], msg['name'], msg['sessionName'], ws)
        else:
            logger.warn('tried to construct Host from invalid json: %s' % msg)
            return None


class Guest(object):
    def __init__(self, id, name, host, ws):
        self.id = id
        self.name = name
        self.host = host
        self.ws = ws

    def send(self, msg):
        self.ws.send(msg)

    @classmethod
    def from_json(cls, msg, ws):
        msg = json.loads(msg)
        if all_present(msg, ['guestID', 'hostID', 'name']):
            try:
                host = hosts[msg['hostID']]
            except KeyError:
                logger.warn('Guest tried to connect to unknown host ID: %s' %
                            msg['hostID'])
                return None
            return(cls(msg['guestID'], msg['name'], host, ws))
        else:
            logger.warn('tried to construct Guest from invalid json: %s' % msg)
            return None


@app.route('/')
@app.route('/guest')
def guest_view():
    return send_from_directory(HTML_DIR, 'guest.html')


@app.route('/host')
def host_view():
    return send_from_directory(HTML_DIR, 'host.html')


def all_present(obj, attrs):
    '''Tests to make sure all the listed attributes are present in the given
    object'''
    for attr in attrs:
        if attr not in obj:
            return False

    return True


# TODO: currently doesn't handle the case where the host disconnects while the
# guest is still connected
@sockets.route('/ws/guest')
def guest_ws_view(ws):
    guest = None

    logger.info("guest connected")
    # wait for the session offer
    while(True):
        try:
            msg = ws.receive()
        except:
            logger.info("guest disconnected")
            return
        if msg is None:
            logger.info("Got None from guest, disconnected")
            return
        guest = Guest.from_json(msg, ws)
        if guest is None:
            continue
        logger.info('%s joined session "%s"' % (guest.name,
                                                guest.host.session_name))
        guest.host.send(msg)
        guest.host.add_guest(guest)
        # success, so break out of this loop
        break

    while(True):
        try:
            msg = ws.receive()
        except:
            guest.host.remove_guest(guest)
            logger.info("guest disconnected")
            return
        if msg is None:
            logger.info("Got None from guest, disconnected")
            return
        logger.info("guest msg from %s: %s" % (guest.name, msg))
        guest.host.send(msg)


@sockets.route('/ws/host')
def host_ws_view(ws):
    logger.info("Host connected")
    host = None
    while(True):
        # wait for the host to identify itself
        try:
            msg = ws.receive()
        except:
            logger.info("Host disconnected")
            return
        if msg is None:
            logger.info("Got None from host, disconnected")
            return

        host = Host.from_json(msg, ws)
        if host is not None:
            hosts[host.id] = host
            logger.info('Session %s created by %s (id %s)' %
                        (host.session_name, host.name, host.id))
            break

    while(True):
        try:
            msg = ws.receive()
        except:
            logger.info("Host disconnected")
            del hosts[host.id]
            return
        if msg is None:
            logger.info("Got None from host, disconnected")
            return
        host.handle_msg(msg)
        logger.info("host msg from %s: %s" % (host.name, msg))
