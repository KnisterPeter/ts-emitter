import * as ts from 'typescript';

import { emit } from './index';

describe('emit', () => {
  it('should accept a typescript as and reprint it', () => {
    const source = `
      import 'reflect-metadata';
      import * as path from 'path';
      import { join, other as other2 } from 'path';
      import test from './module';
      const a: string = 'string';
      export default a;
      let b: number = 0;
      var c: boolean = true;
      const d: string = "string";
      var e: boolean = false;
      export function f(g: object, h: () => {}): void {};
      const i = (a, b) => a + b;
      let j = function(): string|number {
        console.log('some' + 'text');
      }j
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
      }
      type Q<T> = {
        name?: string;
      };
      let r = -1;
      const s = this.func();
      declare function t(): boolean;
    `;
    const sourceFile = ts.createSourceFile('source', source, ts.ScriptTarget.ES2015);
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
    const sourceFile = ts.createSourceFile('source', source, ts.ScriptTarget.ES2015);
    expect(emit(sourceFile)).toBe(source);
  });
  it('should know about IndexSignature', () => {
    const source = `
      interface Test {
        [key: string]: any;
      }
    `;
    const sourceFile = ts.createSourceFile('source', source, ts.ScriptTarget.ES2015);
    expect(emit(sourceFile)).toBe(source);
  });
});
