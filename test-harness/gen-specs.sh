#!/bin/bash

cd $(dirname $0)
rm -rf specs
mkdir specs
for i in $(echo {a..z}) ; do
  echo "require('../runner').runner('$i[a-m]');" > ./specs/${i}1.spec.js
  echo "require('../runner').runner('$i[n-z]');" > ./specs/${i}2.spec.js
done
