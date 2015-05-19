AdvenShare
==========

AdvenShare is a collaborative platform for playing point-and-click adventure
games.

Development Setup
-----------------

### Prerequisites

* npm (node package manager)
* pip (python package manager)
* GNU make
* react-tools (install with npm)
* node (install `nodejs` and `nodejs-legacy` packages with apt)
* various python dependencies (install with `pip install -r requirements.txt`)

### Make Targets

* `default` - generates javascript files from JSX
* `watch` - runs the jsx compiler in --watch mode so it auto-builds when you change a JSX file
* `serve_dev` - starts a development server you can connect to at localhost:8000
* `serve_prod` - starts the production server intended to sit behind a webserver


Various FAQs and Gotchas
========================

* You must connect to the server with SSL to host a game, or the browser won't
  let you screen-share
