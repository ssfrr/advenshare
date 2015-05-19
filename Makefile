default: static/js/advenshare.js

static/js/advenshare.js: jsx/advenshare.jsx
	jsx --extension jsx jsx/ static/js/

watch:
	jsx --extension jsx --watch jsx/ static/js/
