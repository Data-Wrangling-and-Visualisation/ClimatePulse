#!/bin/sh
python server.py &
python backend/app.py & 
python -m http.server 8000 --directory ./frontend --bind 0.0.0.0 &

tail -f /dev/null