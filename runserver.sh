#!/bin/bash

gunicorn -k flask_sockets.worker --certfile=self.crt --keyfile=self.key advenshare:app
