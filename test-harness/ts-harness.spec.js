const { readFileSync } = require('fs');
const { sync: globbySync } = require('globby');
const { join } = require('path');

const { fromPath, toSource } = require('..');

const paths = globbySync(join(__dirname, `typescript/src/harness/**/*.ts`));
paths.forEach(path => {
  test(path, () => {
    const source = readFileSync(path).toString('utf8');
    expect(toSource(fromPath(path))).toBe(source);
  });
});
