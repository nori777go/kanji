import json,os,pathlib,subprocess,time,urllib.request,urllib.parse,urllib.error,sys
from check import check

cfg=json.loads(pathlib.Path('ci/deploy.json').read_text())
assert os.environ.get('GITHUB_REF')=='refs/heads/production', 'production branch required'
assert os.environ.get('GITHUB_REPOSITORY') in ['nori777go/sumi-homepage','nori777go/kanji','nori777go/scicareer']
token=subprocess.run(['gcloud','auth','print-access-token'],capture_output=True,text=True,check=True).stdout.strip()
def api(url,body=None,method=None):
    data=body if isinstance(body,bytes) else None if body is None else json.dumps(body).encode()
    req=urllib.request.Request(url,data=data,method=method or ('GET' if body is None else 'PATCH'),headers={'Authorization':'Bearer '+token,'Content-Type':'application/octet-stream' if isinstance(body,bytes) else 'application/json'})
    try:
        with urllib.request.urlopen(req,timeout=90) as r:return json.load(r)
    except urllib.error.HTTPError as e:
        raise RuntimeError(f'Google API error {e.code}: '+e.read().decode()[:1000]) from None
name=f"projects/{cfg['project']}/locations/{cfg['region']}/services/{cfg['service']}"
base='https://run.googleapis.com/v2/'+name
fields='name,etag,latestReadyRevision,traffic,trafficStatuses,terminalCondition,template(serviceAccount,containers(name))'
def state():return api(base+'?fields='+urllib.parse.quote(fields))
old=state()
assert old['template']['serviceAccount']==cfg['runtime'], 'Unexpected runtime identity; refusing release'
revision=cfg['service']+'-ci-'+os.environ['GITHUB_RUN_ID'][-7:]+'-'+os.environ.get('GITHUB_RUN_ATTEMPT','1')
assert len(revision)<=63
obj=f"releases/{cfg['service']}/{os.environ['GITHUB_SHA']}/{os.environ['GITHUB_RUN_ID']}-{os.environ.get('GITHUB_RUN_ATTEMPT','1')}.tar.gz"
upload='https://storage.googleapis.com/upload/storage/v1/b/'+cfg['bucket']+'/o?uploadType=media&ifGenerationMatch=0&name='+urllib.parse.quote(obj,safe='')
result=api(upload,pathlib.Path('release.tar.gz').read_bytes(),'POST')
source={'cloudStorageSource':{'bucket':cfg['bucket'],'object':obj,'generation':result['generation']}}
traffic=[]
for t in old.get('trafficStatuses',[]):
    if t.get('tag') == 'ci0' or t.get('tag','').startswith('ci-'):continue
    traffic.append({k:v for k,v in t.items() if k in ['type','revision','percent','tag']})
assert sum(int(t.get('percent',0)) for t in traffic)==100, 'Cannot preserve existing traffic'
body={'name':name,'etag':old['etag'],'template':{'revision':revision,'serviceAccount':cfg['runtime'],'containers':[{'name':old['template']['containers'][0]['name'],'sourceCode':source,'command':['npm'],'args':['start']}]},'traffic':traffic+[{'type':'TRAFFIC_TARGET_ALLOCATION_TYPE_REVISION','revision':revision,'percent':0,'tag':'ci0'}]}
mask='template.revision,template.serviceAccount,template.containers.sourceCode,template.containers.command,template.containers.args,traffic'
dry='--deploy' not in sys.argv
api(base+'?updateMask='+mask+('&validateOnly=true' if dry else ''),body)
if dry:
    print('Cloud Run accepted validate-only release. Production traffic unchanged.')
    sys.exit(0)
def wait_ready():
    for _ in range(120):
        s=state()
        for t in s.get('trafficStatuses',[]):
            if t.get('tag')=='ci0' and t.get('revision','').split('/')[-1]==revision and t.get('uri'):
                if s.get('latestReadyRevision','').split('/')[-1]==revision:return t['uri']
        if s.get('terminalCondition',{}).get('state')=='CONDITION_FAILED':
            raise RuntimeError('Cloud Run revision failed; old revision is still serving')
        time.sleep(5)
    raise RuntimeError('Timed out waiting for staged revision')
try:
    check(wait_ready())
    # Keep pre-existing security/rollback tags, pin production to the verified revision.
    promoted=[dict(t,percent=0) for t in traffic if t.get('tag')]
    promoted.append({'type':'TRAFFIC_TARGET_ALLOCATION_TYPE_REVISION','revision':revision,'percent':100})
    current=state()
    api(base+'?updateMask=traffic',{'name':name,'etag':current['etag'],'traffic':promoted})
    for _ in range(60):
        s=state()
        if any(t.get('revision','').split('/')[-1]==revision and t.get('percent')==100 for t in s.get('trafficStatuses',[])):break
        time.sleep(3)
    else:raise RuntimeError('Traffic promotion did not complete')
    check(cfg['domain'])
    print('Released verified revision:',revision)
except Exception:
    current=state()
    api(base+'?updateMask=traffic',{'name':name,'etag':current['etag'],'traffic':traffic})
    print('Restored previous production traffic')
    raise
