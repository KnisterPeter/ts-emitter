import * as ts from 'typescript';
import { EmitterContext } from './emitter';

export function emitStatic(source: string[], text: string, node: ts.Node,
  context: EmitterContext): void {
  addWhitespace(source, node, context);
  source.push(text);
  context.offset += text.length;
}

export function addWhitespace(source: string[], node: ts.Node, context: EmitterContext): void {
  if (context.offset <= node.getFullStart()) {
    const text = context.sourceFile.text.substring(node.getFullStart(), node.end);
    const leadingWhitespace = text.match(/^(\s+)/);
    if (leadingWhitespace) {
      context.offset = node.getFullStart() + leadingWhitespace[1].length;
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

export function addLeadingComment(source: string[], node: ts.Node, context: EmitterContext): void {
  const text = node.getSourceFile().getFullText();
  const ranges = ts.getLeadingCommentRanges(text, node.getFullStart());
  if (ranges) {
    source.push(ranges
      .map(range => {
        const prefix = text.substring(context.offset, range.pos);
        const comment = prefix + text.substring(range.pos, range.end);
        context.offset += comment.length;
        return comment;
      })
      .join(''));
  }
}

export function addTrailingComment(source: string[], node: ts.Node, context: EmitterContext): void {
  const text = node.getSourceFile().getFullText();
  const ranges = ts.getTrailingCommentRanges(text, node.getEnd());
  if (ranges) {
    source.push(ranges
      .map(range => {
        const prefix = text.substring(context.offset, range.pos);
        const comment = prefix + text.substring(range.pos, range.end);
        context.offset += comment.length;
        return comment;
      })
      .join(''));
  }
}
