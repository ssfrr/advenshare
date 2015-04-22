#!/usr/bin/env python

HTML_DIR = ''
from flask import Flask, send_from_directory

app = Flask(__name__)


@app.route('/')
@app.route('/client')
def client_view():
    return send_from_directory(HTML_DIR, 'client.html')


@app.route('/host')
def host_view():
    return send_from_directory(HTML_DIR, 'host.html')

if __name__ == '__main__':
    app.run(debug=True)
