import * as ts from 'typescript';

import { emit as internalEmit } from './emitter';

export function emit(node: ts.SourceFile): string {
  return internalEmit(node, {
    sourceFile: node,
    offset: 0
  });
}
