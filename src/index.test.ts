import * as ts from 'typescript';

import { emit } from './index';

function getSourceFile(source: string, enableJsx = false): ts.SourceFile {
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

describe('emit', () => {
  it('should accept a typescript as and reprint it', () => {
    const source = `
      import 'reflect-metadata';
      import * as path from 'path';
      import { join, other as other2 } from 'path';
      import test from './module';
      import p = Alpha.x;
      import fs = require('./visibilityOfCrossModuleTypeUsage_fs');
      const a: string = 'string';
      export { a, b as c } from 'asdf';
      export default a;
      let b: number = 0;
      b+=1;
      var c: boolean = true;
      const d: string = "string";
      var e: boolean = false;
      export function f(g: object, h: () => {}): void {}
      const i = (a, b) => a + b;
      let j = function(): string | number {
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

        get foo() { return 0; }
        set v(value) {}
        method(p1: typeof k): never {
          throw new Error('never');
        }
      }
      export type N = L;
      type O<T> = {
        new(...args: any[]): T;
        method(p1: typeof k): never;
      };
      export interface P<S> extends U {
        (a: string): string; // comment
        new (a: string): string; // comment
        name?: string; // comment
        call(a, b): void; // comment
        call2: (...a) => void;
      }
      type Q<T> = {
        name?: (string);
      };
      let r = -1;
      const s = this.func();
      declare function t<T>(): A<T>;
      for (var u in v) {}
      for (const u of v) {}
      for (var i, n; i < n; i++) {}
      with (ooo) { // test
        bing = true;
      }
      var a = [undefined, "def"];
      while (true) {
        break;
      }
      do 
        let l4 = 0;
      while (true);
      if (a) b else c;
      switch (a) {
        case b:
          a = 1;
        default:
          b = 2;
      }
      function* foo() {
        yield
      }
      target1:
      var x = () => this["prop1"] ;
      var v2:K1.I3=v1;
      (()=>0);
      try {
        class Test1 {
          static "prop1" = 0;
        }
      } catch (e) {
      } finally {
      }
      !void 0 !== true
      function isElement(el: any): el is JSX.Element;
      class Class4<T> extends Class3<T> {}
      function sequence(...sequences:{():void;}[]) {}
      let a: (keyof T)[] = ["a", "b"];
      export interface I1 {register(inputClass: new(...params: any[]) => A);}
      namespace Element {}
      module Element {}
      let y = class {};
      let x = {
        [2]:1,
      }
      delete a; // error
      a ? b : c;
      var n = <number>(null);
      await Promise.resolve("The test is passed without an error.")
      const {a, a: y, a = 1} = test;
      const [a] = test;
      declare function pick<T, K extends keyof T>(obj: T, propNames: K[]): Pick<T, K>;
      continue;
      a ^= 1;
      let z = y.map(s => s.toLowerCase());
      let z = y.map(<string>(s) => s.toLowerCase());
      var lazyArray = new LazyArray<string>();
      new X<{ a: string }>();
      export class C {    // comment
      }
      module EndGate.Tweening {
      }
      var y1: { C: new() => ext.C; } = ext;
      new CBaseBase<Wrapper<T1>>(this);
      var r = < <T>(x: T) => T > ((x) => { return null; });
      function foo<T extends { a: string, b: string }>() {}
      var a2 = new Z[];
      interface I {
          x1(a: number, callback: (x: 'hi') => number);
      }
      function m2() { }; // ok since the module is not instantiated
      [...a];
      ({ ...o })
      typeof a
      class Comp<T, S> extends Component<S & T> {}
      function a<U extends number[]>(): void { }
      ({a})
      class ConnectionError /* extends Error */ {}
      @internal class C { }
      type Foo<T extends "true"> = string;
      function f20<A, B>(): [A, B];
      foo(x => new G<typeof x>(x))
      a >>>= 1;
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
        constructor();
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
        export function a(){  A.b();  } // A.b should be an unresolved symbol error
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
  it('should know about strict pragma', () => {
    const source = `
      // @skipDefaultLibCheck: false
      "use strict";
    `;
    const sourceFile = getSourceFile(source);
    expect(emit(sourceFile)).toBe(source);
  });
  it('should know about enum declarations', () => {
    const source = `
      enum Key1 { UP, DOWN, LEFT, RIGHT = 3 }
      const enum Key2 { UP, DOWN, LEFT, RIGHT = 3 }
      export enum Key3 { UP, DOWN, LEFT, RIGHT = 3 }
    `;
    const sourceFile = getSourceFile(source);
    expect(emit(sourceFile)).toBe(source);
  });
  it('should know about regular expressions', () => {
    const source = `
      var m = /q/;
      var n = /\d+/g;
      var o = /[3-5]+/i;
    `;
    const sourceFile = getSourceFile(source);
    expect(emit(sourceFile)).toBe(source);
  });
  it('should know about JSX', () => {
    const source = `
      var elemA = 42;
      var elemB = <b>{"test"}</b>;
      var elemC = <c>{42}</c>;
      var elemD = 42;
      var elemE = <e>{true}</e>;
      var elemF = <div>test</div>;
      var elemF = <div />;
      var elemG = <meta content="helloworld"></meta>,
      var elemH = <meta content={c.a!.b}></meta>
    `;
    const sourceFile = getSourceFile(source, true);
    expect(emit(sourceFile)).toBe(source);
  });
  it('should know about overloaded function signatures', () => {
    const source = `
      function foo(foo:string);
      function foo(foo?:string){ return '' };
      var x = foo('foo');
    `;
    const sourceFile = getSourceFile(source, true);
    expect(emit(sourceFile)).toBe(source);
  });
  it('should not drop trailing comments at end of file', () => {
    const source = `
      var x = foo('foo');
      // comment
    `;
    const sourceFile = getSourceFile(source, true);
    expect(emit(sourceFile)).toBe(source);
  });
  it('should not mess up trailing comments', () => {
    const source = `
      var fra3: (v:any)=>string = (function() { return function (v:string) {return v;}; })() // should work
    `;
    const sourceFile = getSourceFile(source, true);
    expect(emit(sourceFile)).toBe(source);
  });
  it('should accept trailing comments in object literals', () => {
    const source = `
      var result = {
        stat: 1, // _this needs to be emitted to the js file
        isNew: 2,
        foo: 3 // foo
      };
    `;
    const sourceFile = getSourceFile(source, true);
    expect(emit(sourceFile)).toBe(source);
  });
  it('should accept empty block like with comment', () => {
    const source = `
      interface MyDoc {
        // comment
      }
      function f1(): string {
          // comment
      }
      class C {
          public get m1() {
              // comment
          }
      }
      class C {
          // comment
      }
    `;
    const sourceFile = getSourceFile(source, true);
    expect(emit(sourceFile)).toBe(source);
  });
  it('should keep optional parameters in object properties', () => {
    const source = `
      var b = {
          x?: 1 // error
      }
    `;
    const sourceFile = getSourceFile(source, true);
    expect(emit(sourceFile)).toBe(source);
  });
});
