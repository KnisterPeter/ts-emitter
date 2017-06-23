#!/bin/sh

cd $(dirname $0)
rm -rf typescript
#git clone --shallow-since=2017-05-31 -n https://github.com/Microsoft/TypeScript.git typescript
git clone --depth=5000 -n https://github.com/Microsoft/TypeScript.git typescript
cd typescript
git checkout 3eda9c627bfff7f6653ac3363c33a778862aa6d2

