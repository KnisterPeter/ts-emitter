const { readFileSync } = require('fs');
const { sync: globbySync } = require('globby');
const { join } = require('path');

const { emit } = require('..');

const paths = globbySync(join(__dirname, `typescript/src/server/**/*.ts`));
paths.forEach(path => {
  test(path, () => {
    const source = readFileSync(path).toString('utf8');
    expect(emit(path)).toBe(source);
  });
});
