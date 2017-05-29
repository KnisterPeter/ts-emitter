import { stripIndent } from 'common-tags';
import { join } from 'path';

import { fromPath, toSource } from './index';

test('fromPath should return a parsed AST', () => {
  const ast = fromPath(join(__dirname, '__fixtures__', 'path.ts'));
  expect(ast).toBeDefined();
});

test('toSource should return a string', () => {
  const ast = fromPath(join(__dirname, '__fixtures__', 'path.ts'));
  const source = toSource(ast);
  expect(source.trim()).toBe(stripIndent`
    export function echo(input: string): string {
      return input;
    }
  `);
});
