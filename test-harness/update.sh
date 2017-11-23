#!/bin/sh

SHA=2ff333c71c2fa880e92b15ab20b3c75e4f0a9cb7

cd $(dirname $0)
rm -rf typescript
#git clone --shallow-since=2017-07-01 -n https://github.com/Microsoft/TypeScript.git typescript
#git clone -n https://github.com/Microsoft/TypeScript.git typescript
#git checkout ${SHA}
curl -L --output repo.tar.gz https://github.com/Microsoft/TypeScript/archive/${SHA}.tar.gz
tar xzf repo.tar.gz
rm -f repo.tar.gz
mv TypeScript-${SHA} typescript
cd typescript
