import { toSource } from './index';
import { getSourceFile } from './test-utils';

describe('emit', () => {
  it('should accept a typescript source as is and reprint it', () => {
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
          readonly realpath?: (path: string) => string;
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
      /* comment */ a /* comment */ ? /* comment */ b /* comment */ : /* comment */ c;
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
      var objc8: {
          t7: {
                  (n: number, s: string): number;    
                  //(s1: string, s2: string): number;
              };
      };
      var y /* comment */ = /* comment */ 20;
      <any>( /* Preserve */ j = f());
      var v: { bar(): void, baz }
      interface Foo { bar(): void, baz }
      const sourceFile = <SourceFile>new SourceFileConstructor(
        SyntaxKind.SourceFile, /*pos*/ 0, /* end */ sourceText.length);
    `;
    const sourceFile = getSourceFile(source);
    expect(toSource(sourceFile)).toBe(source);
  });
});
