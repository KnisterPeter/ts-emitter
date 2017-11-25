import * as ts from 'typescript';

export function getSourceFile(source: string, enableJsx = false): ts.SourceFile {
  const options = {
    ...ts.getDefaultCompilerOptions(),
    experimentalDecorators: true,
    jsx: ts.JsxEmit.Preserve,
    noEmit: true,
    noResolve: true,
    preserveConstEnums: true,
    removeComments: false,
    target: ts.ScriptTarget.Latest
  };
  const host = {
    ...ts.createCompilerHost(options, true),
    getSourceFile(fileName: string, languageVersion: ts.ScriptTarget): ts.SourceFile {
      return ts.createSourceFile(fileName, source, languageVersion, true);
    }
  };
  const fileName = enableJsx ? 'source.tsx' : 'source.ts';
  const program = ts.createProgram([fileName], options, host);
  return program.getSourceFile(fileName);
}
