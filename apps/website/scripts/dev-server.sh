#!/usr/bin/env bash
# Starts or stops a website dev server in the background:
# `apps/website/scripts/dev-server.sh start|stop [port]`, on port 3000 by
# default. `start` waits until the server answers. Its pid and log live in
# `apps/website/.dev-server/`, so `stop` kills that server only, and
# `<port>.log` holds its output, request errors included.
set -u
cd "$(dirname "$0")/.." || exit 2
action=${1:-}
port=${2:-3000}
pid_file=.dev-server/$port.pid
log=.dev-server/$port.log
wait_seconds=60

case $action in
  start)
    if [ -f "$pid_file" ] && kill -0 "$(cat "$pid_file")" 2>/dev/null; then
      echo "already running: http://localhost:$port (log: apps/website/$log)"
      exit 0
    fi
    # Another server's answer would pass for this one's.
    if curl -s -o /dev/null "http://localhost:$port/"; then
      echo "port $port is taken by another server" >&2
      exit 1
    fi
    mkdir -p .dev-server
    # The shim execs node, so the pid is the server's own.
    nohup node_modules/.bin/vite dev --port "$port" --strictPort >"$log" 2>&1 &
    pid=$!
    echo $pid >"$pid_file"
    for _ in $(seq 1 $wait_seconds); do
      if ! kill -0 $pid 2>/dev/null; then
        rm "$pid_file"
        echo "the dev server exited: see apps/website/$log" >&2
        exit 1
      fi
      if curl -s -o /dev/null "http://localhost:$port/"; then
        echo "http://localhost:$port (log: apps/website/$log)"
        exit 0
      fi
      sleep 1
    done
    echo "no answer on port $port after ${wait_seconds}s: see apps/website/$log" >&2
    exit 1
    ;;
  stop)
    if [ -f "$pid_file" ]; then
      kill "$(cat "$pid_file")" 2>/dev/null
      rm "$pid_file"
    fi
    ;;
  *)
    echo "usage: dev-server.sh start|stop [port]" >&2
    exit 2
    ;;
esac
