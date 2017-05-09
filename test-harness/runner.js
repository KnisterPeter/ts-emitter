const { readFileSync } = require('fs');
const { sync: globbySync } = require('globby');
const { join } = require('path');
const ts = require('typescript');

const { emit } = require('..');

module.exports = {
  runner: function(part) {
    const paths = globbySync([join(__dirname, `typescript/tests/cases/compiler/${part}*.ts`)]);
    if (paths.length > 0) {
      paths.forEach(path => {
        test(path, () => {
          const source = readFileSync(path).toString();
          expect(emit(ts.createSourceFile(path, source, ts.ScriptTarget.ES2016))).toBe(source);
        });
      });
    } else {
      test.skip(`Runner for ${part} as zero tests`, () => {});
    }
  }
};
