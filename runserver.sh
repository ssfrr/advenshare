#!/bin/bash

gunicorn -k flask_sockets.worker --reload --certfile=self.crt --keyfile=self.key advenshare:app
