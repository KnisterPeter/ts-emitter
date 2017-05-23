import * as fs from 'fs';
import * as ts from 'typescript';

import { emit as internalEmit } from './emitter';

export function emit(path: string, encoding: string): string;
export function emit(node: ts.SourceFile): string;
export function emit(pathOrNode: string|ts.SourceFile, encoding?: string): string {
  const sourceFile = typeof pathOrNode === 'string'
    ? readFile(pathOrNode, encoding || 'utf8')
    : pathOrNode;
  return internalEmit(sourceFile, {
    sourceFile,
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
