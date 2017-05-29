const { readFileSync } = require('fs');
const { sync: globbySync } = require('globby');
const { join } = require('path');
const ts = require('typescript');
const blacklisted = require('./blacklisted-tests.json');
const iconv = require('iconv-lite');

const { toSource } = require('..');

function getBOM(input) {
  const _0 = input[0];
  const _1 = input[1];
  const _2 = input[2];
  return _0 === 0xFE && _1 === 0xFF ? 'utf16be'
    : _0 === 0xFF && _1 === 0xFE ? 'utf16le'
    : _0 === 239 && _1 === 187 && _2 === 191 ? 'utf8'
    : 'utf8';
}

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
  const name = source.toString().match(/@jsx/) ? 'source.tsx' : 'source.ts';
  const program = ts.createProgram([name], options, host);
  return program.getSourceFile(name);
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
          const buffer = readFileSync(path);
          const encoding = getBOM(buffer);
          const source = iconv.decode(buffer, encoding);
          expect(toSource(getSourceFile(path, source))).toBe(source);
        });
      });
    } else {
      test.skip(`Runner for ${part} as zero tests`, () => { });
    }
  }
};
