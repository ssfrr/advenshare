HTML_DIR = ''
from flask import Flask, send_from_directory, request, jsonify
from flask_sockets import Sockets

app = Flask(__name__)
sockets = Sockets(app)


@app.route('/')
@app.route('/client')
def client_view():
    return send_from_directory(HTML_DIR, 'client.html')


@app.route('/host')
def host_view():
    return send_from_directory(HTML_DIR, 'host.html')


@app.route('/offers',  methods=['GET', 'POST'])
def offers_view():
    '''This view is to create a session. POSTing will create a new AdvenShare
    session, and a GET request will return a list of active sessions'''
    if request.method == 'POST':
        offers.append(request.json)
        return "Created", 201
    elif request.method == 'GET':
        return jsonify({"offers": offers})


@app.route('/answers',  methods=['GET', 'POST'])
def answers_view():
    '''This view is to respond to a session. POSTing will create a new
    AdvenShare session, and a GET request will return a list of active
    sessions'''
    if request.method == 'POST':
        answers.append(request.json)
        return "Created", 201
    elif request.method == 'GET':
        return jsonify({"answers": answers})


if __name__ == '__main__':
    app.run(debug=True, ssl_context='adhoc')
