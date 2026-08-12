#!/usr/bin/env python3
"""Dev server for the Living Map: static, with Cache-Control: no-store.

Plain `python3 -m http.server` sends no cache headers, so Chrome's heuristic
disk cache can serve stale modules while you edit (found live 2026-08-11:
three separate stale layers cost an hour of debugging). no-store ends it.
Production (GitHub Pages + the service worker's cache:'reload' installs) is
unaffected by this file.

Usage: python3 scripts/dev-server.py [port] (default 4181; serves room-8d41f2/)
"""
import http.server, os, sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 4181
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "room-8d41f2")

class NoStoreHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

http.server.ThreadingHTTPServer(("", PORT), NoStoreHandler).serve_forever()
