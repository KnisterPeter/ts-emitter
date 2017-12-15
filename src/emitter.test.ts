import { toSource } from './index';
import { getSourceFile } from './test-utils';

describe('emit', () => {
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
    expect(toSource(sourceFile)).toBe(source);
  });
  it('should know about IndexSignature', () => {
    const source = `
      interface Test {
        [key: string]: any;
      }
    `;
    const sourceFile = getSourceFile(source);
    expect(toSource(sourceFile)).toBe(source);
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
    expect(toSource(sourceFile)).toBe(source);
  });
  it('should keep trivia', () => {
    const source = `
      // leading
      let r; // trailing
      // Can be an expression
      new String;
    `;
    const sourceFile = getSourceFile(source);
    expect(toSource(sourceFile)).toBe(source);
  });
  it('should know about PropertyDeclaration', () => {
    const source = `
      class Foo {
        private Bar: number;
      }
    `;
    const sourceFile = getSourceFile(source);
    expect(toSource(sourceFile)).toBe(source);
  });
  it('should know about strict pragma', () => {
    const source = `
      // @skipDefaultLibCheck: false
      "use strict";
    `;
    const sourceFile = getSourceFile(source);
    expect(toSource(sourceFile)).toBe(source);
  });
  it('should know about enum declarations', () => {
    const source = `
      enum Key1 { UP, DOWN, LEFT, RIGHT = 3 }
      const enum Key2 { UP, DOWN, LEFT, RIGHT = 3 }
      export enum Key3 { UP, DOWN, LEFT, RIGHT = 3 }
    `;
    const sourceFile = getSourceFile(source);
    expect(toSource(sourceFile)).toBe(source);
  });
  it('should know about regular expressions', () => {
    const source = `
      var m = /q/;
      var n = /\d+/g;
      var o = /[3-5]+/i;
    `;
    const sourceFile = getSourceFile(source);
    expect(toSource(sourceFile)).toBe(source);
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
    expect(toSource(sourceFile)).toBe(source);
  });
  it('should know about overloaded function signatures', () => {
    const source = `
      function foo(foo:string);
      function foo(foo?:string){ return '' };
      var x = foo('foo');
    `;
    const sourceFile = getSourceFile(source, true);
    expect(toSource(sourceFile)).toBe(source);
  });
  it('should not drop trailing comments at end of file', () => {
    const source = `
      var x = foo('foo');
      // comment
    `;
    const sourceFile = getSourceFile(source, true);
    expect(toSource(sourceFile)).toBe(source);
  });
  it('should not mess up trailing comments', () => {
    const source = `
      var fra3: (v:any)=>string = (function() { return function (v:string) {return v;}; })() // should work
    `;
    const sourceFile = getSourceFile(source, true);
    expect(toSource(sourceFile)).toBe(source);
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
    expect(toSource(sourceFile)).toBe(source);
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
    expect(toSource(sourceFile)).toBe(source);
  });
  it('should keep optional parameters in object properties', () => {
    const source = `
      var b = {
          x?: 1 // error
      }
    `;
    const sourceFile = getSourceFile(source, true);
    expect(toSource(sourceFile)).toBe(source);
  });
  it('should keep shebang', () => {
    const source = `#!/usr/bin/env gjs
      class Doo {}
    `;
    const sourceFile = getSourceFile(source, true);
    expect(toSource(sourceFile)).toBe(source);
  });
  it('should reprint namespaces', () => {
    const source = `
      export namespace A.B.C {
          export function foo() {}
      }
    `;
    const sourceFile = getSourceFile(source, true);
    expect(toSource(sourceFile)).toBe(source);
  });
  it('should accept tagged template strings', () => {
    const source = 'f`abcdef${ 1234 }${ 5678 }ghijkl`';
    const sourceFile = getSourceFile(source, true);
    expect(toSource(sourceFile)).toBe(source);
  });
  it('should emit async arrow functions', () => {
    const source = `
      (async () => {
        await 10
        throw new Error();
      })();
    `;
    const sourceFile = getSourceFile(source, true);
    expect(toSource(sourceFile)).toBe(source);
  });
  it('should emit OmittedExpression in array destructuring', () => {
    const source = `
      let [, nameA] = robotA
    `;
    const sourceFile = getSourceFile(source, true);
    expect(toSource(sourceFile)).toBe(source);
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
    expect(toSource(sourceFile)).toBe(source);
  });
  it('should know about different re-exports', () => {
    const source = `
      export * from "./b";
      export { x as y } from "./c";
    `;
    const sourceFile = getSourceFile(source, true);
    expect(toSource(sourceFile)).toBe(source);
  });
  it('should handle special characters in literals', () => {
    const source = `
      var k = 'q\\tq';
    `;
    const sourceFile = getSourceFile(source, true);
    expect(toSource(sourceFile)).toBe(source);
  });
  it('should handle special characters in literals', () => {
    const source = `
      var x = {
          \\u0061: \"ss\" // Duplicate
      };
    `;
    const sourceFile = getSourceFile(source, true);
    expect(toSource(sourceFile)).toBe(source);
  });
  it('should handle trailing comments in enums', () => {
    const source = `
      export enum Utensils { // Shouldn't error
      	Spork = 3
      }
    `;
    const sourceFile = getSourceFile(source, true);
    expect(toSource(sourceFile)).toBe(source);
  });
  it('should accept modifier in IndexSignature', () => {
    const source = `
      interface I {
        public [a: string]: number;
      }
    `;
    const sourceFile = getSourceFile(source, true);
    expect(toSource(sourceFile)).toBe(source);
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
    expect(toSource(sourceFile)).toBe(source);
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
    expect(toSource(sourceFile)).toBe(source);
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
    expect(toSource(sourceFile)).toBe(source);
  });
  it('should accept trailing comments in Parameter', () => {
    const source = `
      class c2 {
        set p3(/** this is value*/value: number) {
        }
      }
    `;
    const sourceFile = getSourceFile(source, true);
    expect(toSource(sourceFile)).toBe(source);
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
    expect(toSource(sourceFile)).toBe(source);
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
    expect(toSource(sourceFile)).toBe(source);
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
    expect(toSource(sourceFile)).toBe(source);
  });
  it('should accept leading comments in switch cases', () => {
    const source = `
      // comment
      switch (a) {
        // comment
        case 0: // comment
          break;
          // comment
        default:
          // comment
      }
    `;
    const sourceFile = getSourceFile(source, true);
    expect(toSource(sourceFile)).toBe(source);
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
    expect(toSource(sourceFile)).toBe(source);
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
    expect(toSource(sourceFile)).toBe(source);
  });
  it('should optional allow comma separated type literal members', () => {
    const source = `  
      let yy: { readonly [x: number]: string, [x: string]: string };
    `;
    const sourceFile = getSourceFile(source, true);
    expect(toSource(sourceFile)).toBe(source);
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
    expect(toSource(sourceFile)).toBe(source);
  });
  it('should handle mapped types', () => {
    const source = `
      function f<S extends { [K in keyof S]: string }>(): string {}
    `;
    const sourceFile = getSourceFile(source, true);
    expect(toSource(sourceFile)).toBe(source);
  });
  it('should accept leading comment on empty statements', () => {
    const source = `
      // @target: ES3
      // @sourcemap: true
      ;
    `;
    const sourceFile = getSourceFile(source, true);
    expect(toSource(sourceFile)).toBe(source);
  });
  it('should comments in property assignments', () => {
    const source = `
      var resolve = {
          id: /*! @ngInject */ (details: any) => details.id,
          id1: /* c1 */ "hello",
          id2:
              /*! @ngInject */ (details: any) => details.id,
          id3:
          /*! @ngInject */
          (details: any) => details.id,
          id4:
          /*! @ngInject */
          /* C2 */
          (details: any) => details.id,
      };
    `;
    const sourceFile = getSourceFile(source, true);
    expect(toSource(sourceFile)).toBe(source);
  });
  it('should accept white space', () => {
    const source = `
      module TypeScript2 {
        export enum PullSymbolVisibility {}
      　
        export class PullSymbol {}
      }
    `;
    const sourceFile = getSourceFile(source, true);
    expect(toSource(sourceFile)).toBe(source);
  });
  it('should accept comments in UnionTypes and TypeReference', () => {
    const source = `
      export type ArrayBindingOrAssignmentPattern
          = ArrayBindingPattern
          | ArrayLiteralExpression1 // comment
          | ArrayLiteralExpression2 // comment
          ;
    `;
    const sourceFile = getSourceFile(source, true);
    expect(toSource(sourceFile)).toBe(source);
  });
  it('should accept comments in if-else statements', () => {
    const source = `
      /* comment */
      if (/* comment */ test /* comment */) /* comment */ {
        /* comment */
      }
      /* comment */
      else
      /* comment */
      {
        /* comment */
      }
      /* comment */
    `;
    const sourceFile = getSourceFile(source, true);
    expect(toSource(sourceFile)).toBe(source);
  });
  it('should accept comments in conditional statements', () => {
    const source = `
      const descriptor = test
          ? test
              // comment
              ? a

              // comment
              : b
          : undefined;
    `;
    const sourceFile = getSourceFile(source, true);
    expect(toSource(sourceFile)).toBe(source);
  });
  it('should accept comments in binay expressions', () => {
    const source = `
      const a =
        // comment
        b
        // comment
        &&
        // comment
        c
        // comment
        ||
        // comment
        d;
    `;
    const sourceFile = getSourceFile(source, true);
    expect(toSource(sourceFile)).toBe(source);
  });
  it('should accept comments in for statements', () => {
    const source = `
      for (/* comment */ let /* comment */ a = 0 /* comment */ ; /* comment */ a < b /* comment */ ;
          /* comment */ ++c /* comment */) {
        // comment
      }
    `;
    const sourceFile = getSourceFile(source, true);
    expect(toSource(sourceFile)).toBe(source);
  });
  it('should accept comments in TypeAliasDeclaration', () => {
    const source = `
      export type ModuleReference =
        /** <reference path> or <reference types> */
        | { kind: "reference", referencingFile: SourceFile, ref: FileReference };
    `;
    const sourceFile = getSourceFile(source, true);
    expect(toSource(sourceFile)).toBe(source);
  });
  it('should accept comments in UnionTypes', () => {
    const source = `
      export type ModuleReference =
        /** "import" also includes require() calls. */
        | { kind: "import", literal: StringLiteral }
        /** <reference path> or <reference types> */
        | { kind: "reference", referencingFile: SourceFile, ref: FileReference };
  `;
    const sourceFile = getSourceFile(source, true);
    expect(toSource(sourceFile)).toBe(source);
  });
  it('should accept string with newlines in expressions', () => {
    const source = `
      const b = ("hello\\n" + "world");
    `;
    const sourceFile = getSourceFile(source);
    expect(toSource(sourceFile)).toBe(source);
  });
});
