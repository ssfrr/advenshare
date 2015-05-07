#!/bin/bash

gunicorn -k flask_sockets.worker --reload advenshare:app
