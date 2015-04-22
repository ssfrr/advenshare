HTML_DIR = ''
from flask import Flask, send_from_directory # , request, jsonify
from flask_sockets import Sockets

app = Flask(__name__)
sockets = Sockets(app)

host = None
clients = []


@app.route('/')
@app.route('/client')
def client_view():
    return send_from_directory(HTML_DIR, 'client.html')


@app.route('/host')
def host_view():
    return send_from_directory(HTML_DIR, 'host.html')


# TODO: not sure whether the pub-sub approach here will work during WebRTC
# Connection negociation

@sockets.route('/ws/client')
def client_ws_view(ws):
    print("Client connected")
    clients.append(ws)
    try:
        while(True):
            msg = ws.receive()
            print("client: %s" % msg)
            if host is not None and msg is not None:
                host.send(msg)
    except:
        clients.remove(ws)
        print("Client disconnected")


@sockets.route('/ws/host')
def host_ws_view(ws):
    print("Host connected")
    global host
    if host is not None:
        return "Error: Only one host at a time"
    host = ws
    try:
        while(True):
            msg = ws.receive()
            print("host: %s" % msg)
            if msg is not None:
                for client in clients:
                    client.send(msg)
    except:
        host = None
        print("Host disconnected")
