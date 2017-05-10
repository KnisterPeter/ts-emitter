import * as ts from 'typescript';

import { emit } from './index';

function getSourceFile(source: string): ts.SourceFile {
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
  const program = ts.createProgram(['source.tsx'], options, host);
  return program.getSourceFile('source.tsx');
}

describe('emit', () => {
  it('should accept a typescript as and reprint it', () => {
    const source = `
      import 'reflect-metadata';
      import * as path from 'path';
      import { join, other as other2 } from 'path';
      import test from './module';
      const a: string = 'string';
      export { a, b as c } from 'asdf';
      export default a;
      let b: number = 0;
      var c: boolean = true;
      const d: string = "string";
      var e: boolean = false;
      export function f(g: object, h: () => {}): void {};
      const i = (a, b) => a + b;
      let j = function(): string|number {
        console.log('some' + 'text');
      }
      let k = function k(): {[key: string]: boolean} {
        return {
          'key0': true,
          'key1': false
        };
      }
      export class L extends M {
        constructor(a) {
          super(a);
        }

        method(p1: typeof k): never {
          throw new Error('never');
        }
      }
      export type N = L;
      type O<T> = { new(...args: any[]): T; };
      export interface P {
        name?: string;
        call(a, b): void;
      }
      type Q<T> = {
        name?: string;
      };
      let r = -1;
      const s = this.func();
      declare function t(): boolean;
      for (var u in v) {}
      for (var u of v) {}
      for (var i, n; i < n; i++) {}
      with (ooo) {
        bing = true;
      }
      var a = [undefined, "def"];
      while (true) {
        break;
      }
      if (a) b else c;
      switch (a) {
        case b:
          a = 1;
        default:
          b = 2;
      }
    `;
    const sourceFile = getSourceFile(source);
    expect(emit(sourceFile)).toBe(source);
  });
  it('should know about ThisExpression', () => {
    const source = `
      class Test {
        constructor() {
          this.abc = 'abc';
        }
      }
    `;
    const sourceFile = getSourceFile(source);
    expect(emit(sourceFile)).toBe(source);
  });
  it('should know about IndexSignature', () => {
    const source = `
      interface Test {
        [key: string]: any;
      }
    `;
    const sourceFile = getSourceFile(source);
    expect(emit(sourceFile)).toBe(source);
  });
  it('should know about ModuleDeclaration', () => {
    const source = `
      module 'test' {
      }
    `;
    const sourceFile = getSourceFile(source);
    expect(emit(sourceFile)).toBe(source);
  });
  it('should keep trivia', () => {
    const source = `
      // leading
      let r; // trailing
    `;
    const sourceFile = getSourceFile(source);
    expect(emit(sourceFile)).toBe(source);
  });
  it('should know about PropertyDeclaration', () => {
    const source = `
      class Foo {
        private Bar: number;
      }
    `;
    const sourceFile = getSourceFile(source);
    expect(emit(sourceFile)).toBe(source);
  });
});
