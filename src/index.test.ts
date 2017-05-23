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
  const diagnostics = program.getSyntacticDiagnostics();
  if (diagnostics.length > 0) {
    diagnostics.forEach(diagnostic => {
      console.warn(getDiagnosticMessage(diagnostic));
    });
  }
  return program.getSourceFile(fileName);
}

function getDiagnosticMessage(diagnostic: ts.Diagnostic): string {
  const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
  if (diagnostic.file) {
    const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
    return `${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`;
  }
  return message;
}

describe('emit', () => {
  it('should accept a typescript as and reprint it', () => {
    const source = `
      import 'reflect-metadata'; // comment
      import * as path from 'path';
      import { join, other as other2 } from 'path';
      import a, { b } from 'path';
      import test from './module';
      import p = Alpha.x;
      import fs = require('./visibilityOfCrossModuleTypeUsage_fs');
      const a: string = 'string';
      export { a, b as c } from 'asdf'; // comment
      export default a;
      export as namespace Alpha;
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
        @test
        method(@test p1: typeof k): never {
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
        a: 1;
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
        // comment
        break;
      }
      do 
        let l4 = 0;
      while (true);
      if (a) b else c;
      switch (a) {
        case b:
          a = 1;
        case Foo: break;    // Error
        default: // comment
          b = 2;
      }
      function* foo() {
        yield
        yield*
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
      @internal class C {
        @decorator prop: string;
      }
      type Foo<T extends "true"> = string;
      function f20<A, B>(): [A, B];
      foo(x => new G<typeof x>(x))
      a >>>= 1;
      () =>
        // do something
        127
      function foo(a = \`\`) { }
      const a: { new(a: any, b: any): T; }
      declare class C1<T = number> {}
      var b4: Book & Cover
      class Test {
        method(this: this, ...args: string[]) {};
      }
      "string" as number;
      ({a = 5})
      class Test {
        constructor(
          public a: string // comment
        ) {
        }
      }
      module C { // Two visibility errors (one for the clodule symbol, and one for the merged container symbol)
          var t;
      }
      function foo(){new.target}
      debugger;
      a != b
      a & b
      enumType ^ numberType
      a ** b
      f \`123qdawdrqw${ 1 }\`;
      class A {
          readonly kind = "A"; // (property) A.kind: "A"
      }
      a = ~1
      a >> b
      a >>> b
      declare function f<T extends [(x: number) => number]>(a: T): void;
      function bar<T extends A | B>(x: T);
      var expected = [0xEF];
      func() // Correctly returns an I1<string>
        .func();    // should error
      // ternary with leading comment
      true ? false : true;

      var x = / [a - z /]$ /i;
      var x1 = /[a-z/]$/i;
      var x2 = /[a-z/]$ /i;

      //@filename: v1/index.d.ts
      export as namespace Alpha;
      function foo10<T extends (1)> (test: T) { }
      function foo13<T extends void>(test: T) { }
      var x: { readonly a: E; readonly b: E; readonly [x: number]: string; };
      const a = async function() {}
      var a = (num) => num % 2 == 0
      var x: (...y: string[]) => void = function (.../*3*/y) { };
      interface IPromise<T> {
          then<U>(success?: (value: T) => U, error?: (error: any) => U,
            progress?: (progress: any) => void): IPromise<U>;
          done? <U>(success?: (value: T) => any, error?: (error: any) => any, progress?: (progress: any) => void): void;
      }
      var a = Promise.resolve<Obj["stringProp"]>(obj.stringProp);
      function foo(/** nothing */) {}
      interface I1 {
        const: new (options?, element?) => any;
      }
      namespace hello.hi.world {
        function foo() {}      
        // TODO, blah
      }
      export default function () {
        return "test";
      }
      export default class {
        method() { }
      }
      var array = [
        /* element 1*/
        1
        /* end of element 1 */,
        2
        /* end of element 2 */
      ];
      var C = class extends A {     // comment
      };
      (...x: string[]) =>
            /// <summary>Test summary</summary>
            /// <param name="message" type="String" />
            /// <returns type="Function" />

            message + this.name;
      function /*1*/makePoint(x: number) {}
      foo./* */x = 1;
      foo/* */.x = 1;
      var z2: /** type comment*/ (x: number) => string;
      function f</**type*/T>(a: T, b: T) {}
      var z = /** lambda comment */ (x: number, y: number) => x + y;
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
        public constructor();
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
      declare global {
      }
    `;
    const sourceFile = getSourceFile(source);
    expect(emit(sourceFile)).toBe(source);
  });
  it('should keep trivia', () => {
    const source = `
      // leading
      let r; // trailing
      // Can be an expression
      new String;
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
          @PropertyDecorator1
          @PropertyDecorator2(80)
          get greetings() {
              return this.greeting;
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
  it('should keep shebang', () => {
    const source = `#!/usr/bin/env gjs
      class Doo {}
    `;
    const sourceFile = getSourceFile(source, true);
    expect(emit(sourceFile)).toBe(source);
  });
  it('should reprint namespaces', () => {
    const source = `
      export namespace A.B.C {
          export function foo() {}
      }
    `;
    const sourceFile = getSourceFile(source, true);
    expect(emit(sourceFile)).toBe(source);
  });
  it('should accept tagged template strings', () => {
    const source = 'f`abcdef${ 1234 }${ 5678 }ghijkl`';
    const sourceFile = getSourceFile(source, true);
    expect(emit(sourceFile)).toBe(source);
  });
  it('should emit async arrow functions', () => {
    const source = `
      (async () => {
        await 10
        throw new Error();
      })();
    `;
    const sourceFile = getSourceFile(source, true);
    expect(emit(sourceFile)).toBe(source);
  });
  it('should emit OmittedExpression in array destructuring', () => {
    const source = `
      let [, nameA] = robotA
    `;
    const sourceFile = getSourceFile(source, true);
    expect(emit(sourceFile)).toBe(source);
  });
  it('should know about MappedType', () => {
    const source = `
      type Meta<T, A> = {
        readonly[P in keyof T]: {
          value: T[P];
          also: A;
          readonly children: Meta<T[P], A>;
        };
      }
    `;
    const sourceFile = getSourceFile(source, true);
    expect(emit(sourceFile)).toBe(source);
  });
  it('should know about different re-exports', () => {
    const source = `
      export * from "./b";
      export { x as y } from "./c";
    `;
    const sourceFile = getSourceFile(source, true);
    expect(emit(sourceFile)).toBe(source);
  });
  it('should handle special characters in literals', () => {
    const source = `
      var k = 'q\\tq';
    `;
    const sourceFile = getSourceFile(source, true);
    expect(emit(sourceFile)).toBe(source);
  });
  it('should handle special characters in literals', () => {
    const source = `
      var x = {
          \\u0061: \"ss\" // Duplicate
      };
    `;
    const sourceFile = getSourceFile(source, true);
    expect(emit(sourceFile)).toBe(source);
  });
  it('should handle trailing comments in enums', () => {
    const source = `
      export enum Utensils { // Shouldn't error
      	Spork = 3
      }
    `;
    const sourceFile = getSourceFile(source, true);
    expect(emit(sourceFile)).toBe(source);
  });
  it('should accept modifier in IndexSignature', () => {
    const source = `
      interface I {
        public [a: string]: number;
      }
    `;
    const sourceFile = getSourceFile(source, true);
    expect(emit(sourceFile)).toBe(source);
  });
  it('should accept generators', () => {
    const source = `
      class C {
        *[Symbol.iterator]() {
          let a = yield 1;
        }
      }
      let f = function*() {}
    `;
    const sourceFile = getSourceFile(source, true);
    expect(emit(sourceFile)).toBe(source);
  });
  it('should accept lead comments in PropertyAssignment', () => {
    const source = `
      var o = {
          // in a property initalizer
          p: defered(() => {
              prop1;
          })
      };
    `;
    const sourceFile = getSourceFile(source, true);
    expect(emit(sourceFile)).toBe(source);
  });
  it('should accept lead comments in PropertyAssignment', () => {
    const source = `
      const {
          children, // here!
          active: _a, // here!
        ...rest,
      } = props;
    `;
    const sourceFile = getSourceFile(source, true);
    expect(emit(sourceFile)).toBe(source);
  });
  it('should accept trailing comments in Parameter', () => {
    const source = `
      class c2 {
        set p3(/** this is value*/value: number) {
        }
      }
    `;
    const sourceFile = getSourceFile(source, true);
    expect(emit(sourceFile)).toBe(source);
  });
  it('should accept trailing comments in EnumDeclaration', () => {
    const source = `
      const enum NaNOrInfinity {
        A = 9007199254740992,
        B = A * A,
        C = B * B,
        D = C * C,
        E = D * D,
        F = E * E, // overflow
        G = 1 / 0, // overflow
        H = 0 / 0  // NaN
      }
    `;
    const sourceFile = getSourceFile(source, true);
    expect(emit(sourceFile)).toBe(source);
  });
  it('should accept leading and trailing comments in parameters', () => {
    const source = `
      declare module _ {
          export function each<T>(
              //list: List<T>,
              //iterator: ListIterator<T, void>,
              context?: any): void;
              //foo: List<T>,

          interface ListIterator<T, TResult> {
              (value: T, index: number, list: T[]): TResult;
          }
      }
    `;
    const sourceFile = getSourceFile(source, true);
    expect(emit(sourceFile)).toBe(source);
  });
  it('should accept trailing comments in type literals', () => {
    const source = `
      var v21: {
        (i: number, ...arguments); // comment
        new (i: number, ...arguments); // comment
        foo(i: number, ...arguments); // comment
        prop: (i: number, ...arguments) => void; // comment
      }
    `;
    const sourceFile = getSourceFile(source, true);
    expect(emit(sourceFile)).toBe(source);
  });
  it('should accept leading comments in switch cases', () => {
    const source = `
      // comment
      switch (a) {
        // comment
        case 0: // comment
          break;
      }
    `;
    const sourceFile = getSourceFile(source, true);
    expect(emit(sourceFile)).toBe(source);
  });
  it('should accept comments in call expression arguments', () => {
    const source = `
      foo(/*c2*/ 1, /*d2*/ 1 + 2, /*e1*/ a + b);
      foo(/*c3*/ function () { }, /*d2*/() => { }, /*e2*/ a + /*e3*/ b);
      foo(/*c3*/ function () { }, /*d3*/() => { }, /*e3*/(a + b));
      foo(
          /*c4*/ function () { },
          /*d4*/() => { },
          /*e4*/
          /*e5*/ "hello");
    `;
    const sourceFile = getSourceFile(source, true);
    expect(emit(sourceFile)).toBe(source);
  });
  it('should accept arrow cases', () => {
    const source = `
      // multi line with a comment 3
      f(  // comment 1
          // comment 2
          () =>
          // comment 3
          {
              // comment 4
          }
          // comment 5
      ); 
    `;
    const sourceFile = getSourceFile(source, true);
    expect(emit(sourceFile)).toBe(source);
  });
  it('should optional allow comma separated type literal members', () => {
    const source = `  
      let yy: { readonly [x: number]: string, [x: string]: string };
    `;
    const sourceFile = getSourceFile(source, true);
    expect(emit(sourceFile)).toBe(source);
  });
  it('should handle leading characters in union/intersection types', () => {
    const source = `
      type A =   |   string | number;
      type B = [   |   string | number, | A | B];
      type C = & A & B;
      type A =
        | { type: 'foo', payload: 'bar' }
        | { type: 'bar', payload: 'foo' };
    `;
    const sourceFile = getSourceFile(source, true);
    expect(emit(sourceFile)).toBe(source);
  });
  it('should handle mapped types', () => {
    const source = `
      function f<S extends { [K in keyof S]: string }>(): string {}
    `;
    const sourceFile = getSourceFile(source, true);
    expect(emit(sourceFile)).toBe(source);
  });
  it('should accept leading comment on empty statements', () => {
    const source = `
      // @target: ES3
      // @sourcemap: true
      ;
    `;
    const sourceFile = getSourceFile(source, true);
    expect(emit(sourceFile)).toBe(source);
  });
});
