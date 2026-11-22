import subprocess,os,time,json,pathlib,urllib.request
from check import check
cfg=json.loads(pathlib.Path('ci/deploy.json').read_text())
env=dict(os.environ,PORT='8080',NODE_ENV='production',GEMINI_API_KEY='test-not-a-real-api-key')
with open('runtime-check.log','w') as log:
    proc=subprocess.Popen(['npm','start'],cwd='dist' if cfg['kind']=='static' else '.',env=env,stdout=log,stderr=log)
    try:
        for _ in range(40):
            if proc.poll() is not None:raise RuntimeError('Runtime exited before health check')
            try:
                urllib.request.urlopen('http://127.0.0.1:8080/',timeout=1).close();break
            except Exception:time.sleep(.5)
        check('http://127.0.0.1:8080')
    finally:
        proc.terminate();proc.wait(timeout=10)
