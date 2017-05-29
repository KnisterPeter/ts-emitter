import * as fs from 'fs';
import * as ts from 'typescript';

import { emit as internalEmit } from './emitter';

export function fromPath(path: string, encoding = 'utf8'): ts.SourceFile {
  return readFile(path, encoding);
}

export function toSource(ast: ts.SourceFile): string {
  return internalEmit(ast, {
    offset: 0
  });
}

function readFile(filepath: string, encoding: string): ts.SourceFile {
  const source = fs.readFileSync(filepath).toString(encoding);
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
      getSourceFile(fileName: string, languageVersion: ts.ScriptTarget): ts.SourceFile {
        return ts.createSourceFile(fileName, source, languageVersion, true);
      }
    }
  );
  const program = ts.createProgram([filepath], options, host);
  return program.getSourceFile(filepath);
}
