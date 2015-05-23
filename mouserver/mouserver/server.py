import websocket
import json
import logging
import coloredlogs
import sys
import ssl
from getopt import gnu_getopt, GetoptError
from mouserver_ext import grab_window, Window
import random
import string
import time


class Mouserver:

    def __init__(self, ws_url, session, window):
        self.ws_url = ws_url
        self.session = session
        self.window = window
        self.log = logging.getLogger('mouserver')
        self.ws_log = logging.getLogger('websocket')
        self.uid = ''.join(random.choice(string.letters) for i in xrange(20))
        self.name = 'MouServer'

        self.log.info("Websocket URL: %s", self.ws_url)
        self.log.info("Session ID: %s", self.session)
        window_name = self.window.get_name()
        w, h = self.window.get_size()
        self.log.info("Window: %s (%dx%d)", window_name, w, h)

        self.method_table = {}
        self.register('mouseMove', self.mouse_move)
        self.register('mouseDown', self.mouse_down)
        self.register('mouseUp', self.mouse_up)

        self.wsapp = websocket.WebSocketApp(
            ws_url,
            on_message=self.on_message,
            on_error=self.on_error,
            on_close=self.on_close,
            on_open=self.on_open)

    def run_forever(self):
        self.wsapp.run_forever(sslopt={'cert_reqs': ssl.CERT_NONE})

    def on_message(self, ws, message):
        try:
            msg = json.loads(message)
        except ValueError:
            self.log.warning("Received non-JSON data")
            return
        if 'type' not in msg:
            self.log.warning("Received data with no command")
            return
        msg_type = msg['type']
        method = self.method_table.get(msg_type, None)
        if method is not None:
            method(msg)
        else:
            self.log.warning("Received unknown msg type: %s", msg_type)

    def on_error(self, ws, error):
        self.ws_log.error(error)

    def on_close(self, ws):
        self.ws_log.error("Connection closed, exiting")
        sys.exit(0)

    def on_open(self, ws):
        self.ws_log.info("Connection established")
        self.ws_log.info("Joining session: %s", self.session)
        ws.send(json.dumps({
            'type': 'announce',
            'srcID': self.uid,
            'userName': self.name,
            'activeMouseOnly': True
        }))
        ws.send(json.dumps({
            'type': 'joinSession',
            'srcID': self.uid,
            'sessionID': self.session
        }))

    def register(self, msg_type, method):
        self.method_table[msg_type] = method

    def mouse_move(self, msg):
        x = float(msg['x'])
        y = float(msg['y'])
        self.log.debug("mouse_move (%f, %f)", x, y)
        self.window.mouse_move_ratio(x, y)

    def mouse_down(self, msg):
        x = float(msg['x'])
        y = float(msg['y'])
        # javascript (and the websockets) use 0, 1, 2 for the mouse buttons,
        # but libxdo uses 1, 2, 3
        button = int(msg['button']) + 1
        self.log.debug("mouse_down (%f, %f, %d)", (x, y, button))
        self.window.mouse_move_ratio(x, y)
        self.window.mouse_down(button)

    def mouse_up(self, msg):
        x = float(msg['x'])
        y = float(msg['y'])
        # javascript (and the websockets) use 0, 1, 2 for the mouse buttons,
        # but libxdo uses 1, 2, 3
        button = int(msg['button']) + 1
        self.log.debug("mouse_up (%f, %f, %d)", (x, y, button))
        self.window.mouse_move_ratio(x, y)
        self.window.mouse_up(button)


def print_usage():
    print "usage: %s -u <websocket_url> -s <session_id> [-w <window_id>]" % sys.argv[0]
    print ""
    print "     --url, -u <websocket_url>"
    print "         specifies the websocket URL to which the program should"
    print "         connect to receive user interaction events (required)"
    print "     --session, -s <session_id>"
    print "         specifies the string that uniquely identifies this session"
    print "         (required)"
    print "     --window, -w <window_id>"
    print "         specifies the X11 window ID of the window with which to interact."
    print "         If this is not specified, you will be prompted to select a window"
    print "         by clicking on it at startup."
    print ""
    print "     --verbose, -v"
    print "         outputs lots of protocol information"
    print "     --help, -h"
    print "         displays this usage information."


def main():
    loglevel = logging.INFO
    url = None
    session = None
    window = None

    short_opts = "hvu:s:w:"
    long_opts = [
        'help',
        'verbose',
        'url=',
        'session=',
        'window=',
    ]
    try:
        opts, args = gnu_getopt(sys.argv[1:], short_opts, long_opts)
    except GetoptError as err:
        print str(err)
        print_usage()
        sys.exit(2)
    for o, a in opts:
        if o in ('-h', '--help'):
            print_usage()
            sys.exit(0)
        elif o in ('-v', '--verbose'):
            loglevel = logging.DEBUG
        elif o in ('-u', '--url'):
            url = a
        elif o in ('-s', '--session'):
            session = a
        elif o in ('-w', '--window'):
            window = long(a)
        else:
            print "Unknown option: %s" % o
            print_usage()
            sys.exit(2)

    if url is None:
        print "Must specify server URL (-u)"
        sys.exit(1)
    if session is None:
        print "Must specify session ID (-s)"
        sys.exit(1)
    if window is None:
        print "Please select a window by clicking on it."
        window = grab_window()
    else:
        window = Window(window)

    log = logging.getLogger("main")
    coloredlogs.install(level=loglevel)
    while True:
        server = Mouserver(url, session, window)
        server.run_forever()
        
        log.warning("Restarting after 5 seconds due to dropped connection")
        time.sleep(5.0)


if __name__ == '__main__':
    main()
