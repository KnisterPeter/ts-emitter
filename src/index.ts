import * as fs from 'fs';
import * as ts from 'typescript';

import { emitSourceFile } from './emitter';

export function fromPath(path: string, encoding = 'utf8'): ts.SourceFile {
  return readFile(path, encoding);
}

export function fromSource(source: string, path = 'source.tsx'): ts.SourceFile {
  return parse(source, path);
}

export function toSource(ast: ts.SourceFile): string {
  return emitSourceFile(ast, {
    offset: 0
  });
}

function readFile(filepath: string, encoding: string): ts.SourceFile {
  const source = fs.readFileSync(filepath).toString(encoding);
  return parse(source, filepath);
}

function parse(source: string, path: string): ts.SourceFile {
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
  const program = ts.createProgram([path], options, host);
  return program.getSourceFile(path);
}
