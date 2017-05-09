#!/bin/sh

cd $(dirname $0)
rm -rf typescript
git clone --depth 1 https://github.com/Microsoft/TypeScript.git typescript
