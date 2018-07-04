// tslint:disable-next-line:no-implicit-dependencies
import { stripIndent } from 'common-tags';
import { join } from 'path';
import * as ts from 'typescript';

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
      return 'hello, '  + input;
    }
  `);
});

test('updating the AST should respect formatting', () => {
  const rename = <T extends ts.Node>(context: ts.TransformationContext) =>
        (rootNode: T) => {
    function visit(node: ts.Node): ts.Node {
        const visitedNode = ts.visitEachChild(node, visit, context);
        switch (visitedNode.kind) {
          case ts.SyntaxKind.FunctionDeclaration:
            const fd = visitedNode as ts.FunctionDeclaration;
            const name = ts.createIdentifier('renamed');
            (name as any).newText = 'renamed';
            (name as any).original = fd.name;
            return ts.updateFunctionDeclaration(
              fd,
              fd.decorators,
              fd.modifiers,
              fd.asteriskToken,
              name,
              fd.typeParameters,
              fd.parameters,
              fd.type,
              fd.body
            );
        }
        return visitedNode;
    }
    return ts.visitNode(rootNode, visit);
  };

  const ast = fromPath(join(__dirname, '__fixtures__', 'path.ts'));
  const newAst = ts.transform<ts.SourceFile>(ast, [rename]).transformed[0];
  const source = toSource(newAst);

  expect(source.trim()).toBe(stripIndent`
    export function renamed(input: string): string {
      return 'hello, '  + input;
    }
  `);
});
