const { readFileSync } = require('fs');
const { sync: globbySync } = require('globby');
const { join } = require('path');
const ts = require('typescript');
const blacklisted = require('./blacklisted-tests.json');

const { emit } = require('..');

function getSourceFile(path, source) {
  const options = Object.assign(
    {},
    ts.getDefaultCompilerOptions(),
    {
      experimentalDecorators: true,
      jsx: ts.JsxEmit.Preserve,
      noEmit: true,
      noResolve: true,
      preserveConstEnums: true,
      removeComments: false,
      target: ts.ScriptTarget.Latest
    }
  );
  const host = Object.assign(
    {},
    ts.createCompilerHost(options, true),
    {
      getSourceFile(fileName, languageVersion) {
        return ts.createSourceFile(fileName, source, languageVersion, true);
      }
    }
  );
  const program = ts.createProgram([path], options, host);
  return program.getSourceFile(path);
}

module.exports = {
  runner: function (part) {
    const paths = globbySync([
      join(__dirname, `typescript/tests/cases/compiler/${part}*.ts`),
      ...blacklisted.map(entry => `!${join(__dirname, entry)}`)
    ]);
    if (paths.length > 0) {
      paths.forEach(path => {
        test(path, () => {
          const source = readFileSync(path).toString();
          expect(emit(getSourceFile(path, source))).toBe(source);
        });
      });
    } else {
      test.skip(`Runner for ${part} as zero tests`, () => { });
    }
  }
};
