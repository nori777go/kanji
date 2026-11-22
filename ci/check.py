import sys, urllib.request, urllib.error

def check(base):
    def get(path):
        try:
            return urllib.request.urlopen(base.rstrip('/')+path, timeout=30)
        except urllib.error.HTTPError as e:
            return e
    with get('/') as r:
        assert r.status == 200, ('root', r.status)
        assert r.headers.get('X-Content-Type-Options') == 'nosniff'
        assert r.headers.get('Content-Security-Policy'), 'CSP missing'
        assert 'text/html' in r.headers.get('Content-Type','')
    for p in ['/server.cjs','/server.js','/server.ts','/build/server.cjs','/package.json','/.env','/.git/config','/dist.zip','/vite.config.ts','/assets/test.js.map']:
        with get(p) as r:
            assert r.status in (400,403,404), (p,r.status)
    print('HTTP security checks passed')

if __name__ == '__main__': check(sys.argv[1])
