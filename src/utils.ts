import * as ts from 'typescript';
import { EmitterContext } from './emitter';

export function emitStatic(source: string[], text: string, node: ts.Node,
  context: EmitterContext): void {
  addWhitespace(source, node, context);
  source.push(text);
  context.offset += text.length;
}

export function addWhitespace(source: string[], node: ts.Node, context: EmitterContext): void {
  if (context.offset <= node.pos) {
    const text = context.sourceFile.text.substring(node.pos, node.end);
    const leadingWhitespace = text.match(/^(\s+)/);
    if (leadingWhitespace) {
      context.offset = node.pos + leadingWhitespace[1].length;
      source.push(leadingWhitespace[1]);
    }
  } else {
    const text = context.sourceFile.text.substring(context.offset, node.end);
    const trailingWhitespace = text.match(/^(\s+)/);
    if (trailingWhitespace) {
      context.offset = context.offset + trailingWhitespace[1].length;
      source.push(trailingWhitespace[1]);
    }
  }
}
