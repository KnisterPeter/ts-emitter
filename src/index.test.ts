import * as ts from 'typescript';

import { emit } from './index';

describe('emit', () => {
  it('should accept a typescript as and reprint it', () => {
    const source = `
      const a: string = 'string';
      let b: number = 0;
      var c: boolean = true;
      const d: string = "string";
      var e: boolean = false;
      function f(g: object, h: () => {}): void {}
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
      class L extends M {
        constructor(a) {
          super(a);
        }
      }
    `;
    const sourceFile = ts.createSourceFile('source', source, ts.ScriptTarget.ES2015);
    expect(emit(sourceFile)).toBe(source);
  });
});
