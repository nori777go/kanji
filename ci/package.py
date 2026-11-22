import json, pathlib, tarfile, sys

cfg=json.loads(pathlib.Path('ci/deploy.json').read_text())
root=pathlib.Path('dist' if cfg['kind']=='static' else '.')
entries=['public','server.js','package.json'] if cfg['kind']=='static' else ['dist','build','node_modules','package.json']
with tarfile.open('release.tar.gz','w:gz') as archive:
    for name in entries:
        p=root/name
        assert p.exists(), f'Missing release file: {p}'
        archive.add(p,arcname=name)
print('Created release archive from explicit build outputs')
