# ts-emitter

[![GitHub license][license-image]][license-link]
[![npm][npm-image]][npm-link]
[![Travis][ci-image]][ci-link]
[![codecov](https://codecov.io/gh/KnisterPeter/ts-emitter/branch/master/graph/badge.svg)](https://codecov.io/gh/KnisterPeter/ts-emitter)
[![Commitizen friendly][commitizen-image]][commitizen-link]
[![Standard Version][standard-version-image]][standard-version-link]
[![renovate badge](https://img.shields.io/badge/renovate-enabled-brightgreen.svg)](https://renovateapp.com/)

Emitting typescript as back to typescript.

# DEPRECATED

ts-emitter is currently not maintained and should be seen as deprecated

## Features

* Keep original source as much as possible and only update whats changed.

## Usage

### Installation

Install as npm package:

```sh
$ npm install ts-emitter
```

### Tests

The typescript compiler test suite is used to test the code generator.
To create and run the test harness execute

```sh
$ npm run update-harness[coverage-image]: https://coveralls.io/repos/github/KnisterPeter/ts-emitter/badge.svg?branch=master
55
[coverage-link]: https://coveralls.io/github/KnisterPeter/ts-emitter?branch=master
56
​
57
​
58
​
59

$ npm run harness
```

### API

```typescript
  import { fromPath, toSource } from 'ts-emitter';

  const ast = fromPath('path/to/source-file.ts'));
  // Do something with the AST
  const source = toSource(ast);
```


[license-image]: https://img.shields.io/github/license/KnisterPeter/ts-emitter.svg
[license-link]: https://github.com/KnisterPeter/ts-emitter
[npm-image]: https://img.shields.io/npm/v/ts-emitter.svg
[npm-link]: https://www.npmjs.com/package/ts-emitter
[ci-image]: https://img.shields.io/travis/KnisterPeter/ts-emitter.svg
[ci-link]: https://travis-ci.org/KnisterPeter/ts-emitter
[commitizen-image]: https://img.shields.io/badge/commitizen-friendly-brightgreen.svg
[commitizen-link]: http://commitizen.github.io/cz-cli/
[standard-version-image]: https://img.shields.io/badge/release-standard%20version-brightgreen.svg
[standard-version-link]: https://github.com/conventional-changelog/standard-version
