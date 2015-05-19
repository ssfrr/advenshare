default: static/js/advenshare.js

static/js/advenshare.js: jsx/advenshare.jsx
	jsx --extension jsx jsx/ static/js/

watch:
	jsx --extension jsx --watch jsx/ static/js/

serve_prod:
	gunicorn -k flask_sockets.worker --reload advenshare:app

serve_dev:
	gunicorn -k flask_sockets.worker --reload --certfile=self.crt --keyfile=self.key advenshare:app
