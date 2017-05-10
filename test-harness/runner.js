const { readFileSync } = require('fs');
const { sync: globbySync } = require('globby');
const { join } = require('path');
const ts = require('typescript');

const { emit } = require('..');

function getSourceFile(source) {
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
  const program = ts.createProgram(['source.tsx'], options, host);
  return program.getSourceFile('source.tsx');
}

module.exports = {
  runner: function(part) {
    const paths = globbySync([join(__dirname, `typescript/tests/cases/compiler/${part}*.ts`)]);
    if (paths.length > 0) {
      paths.forEach(path => {
        test(path, () => {
          const source = readFileSync(path).toString();
          expect(emit(getSourceFile(source))).toBe(source);
        });
      });
    } else {
      test.skip(`Runner for ${part} as zero tests`, () => {});
    }
  }
};
