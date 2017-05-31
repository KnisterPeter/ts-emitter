import * as ts from 'typescript';
import { EmitterContext } from './emitter';

export function getSourceFile(node: ts.Node): ts.SourceFile {
  let sourceFile = node.getSourceFile();
  if (!sourceFile) {
    if ((node as any).original) {
      sourceFile = getSourceFile((node as any).original as ts.Node);
    }
  }
  // if (!sourceFile) {
  //   console.log(`Failed to get sourceFile for node:`, node);
  // }
  return sourceFile;
}

export function emitStatic(source: string[], text: string, node: ts.Node, context: EmitterContext): void {
  addWhitespace(source, node, context);
  source.push(text);
  context.offset += text.length;
}

const whitespaces = /^([ \f\n\r\t\v\u0085\u00A0\u2028\u2029\u3000]+)/;
export function addWhitespace(source: string[], node: ts.Node, context: EmitterContext): void {
  if (context.offset > node.getEnd()) {
    return;
  }
  if (context.offset <= node.getFullStart()) {
    const text = getSourceFile(node).getFullText().substring(node.getFullStart(), node.end);
    const leadingWhitespace = text.match(whitespaces);
    if (leadingWhitespace) {
      context.offset = node.getFullStart() + leadingWhitespace[1].length;
      source.push(leadingWhitespace[1]);
    }
  } else {
    const text = getSourceFile(node).getFullText().substring(context.offset, node.end);
    const trailingWhitespace = text.match(whitespaces);
    if (trailingWhitespace) {
      context.offset = context.offset + trailingWhitespace[1].length;
      source.push(trailingWhitespace[1]);
    }
  }
}

export function addLeadingComment(source: string[], node: ts.Node, context: EmitterContext): void;
export function addLeadingComment(source: string[], pos: number, node: ts.Node, context: EmitterContext): void;
export function addLeadingComment(source: string[], posOrNode: number|ts.Node, nodeOrContext: ts.Node|EmitterContext,
    optionalContext?: EmitterContext): void {
  const context = optionalContext || (nodeOrContext as EmitterContext);
  const node = optionalContext ? nodeOrContext as ts.Node : posOrNode as ts.Node;
  const pos = optionalContext ? posOrNode as number : node.getFullStart();

  if (!getSourceFile(node)) {
    return;
  }
  const text = getSourceFile(node).getFullText();
  const ranges = ts.getLeadingCommentRanges(text, pos);
  if (ranges) {
    source.push(ranges
      .map(range => {
        if (context.offset <= range.pos) {
          const prefix = text.substring(context.offset, range.pos);
          const comment = prefix + text.substring(range.pos, range.end);
          context.offset += comment.length;
          return comment;
        }
        return '';
      })
      .join(''));
  }
}

export function addTrailingComment(source: string[], node: ts.Node, context: EmitterContext): void;
export function addTrailingComment(source: string[], pos: number, node: ts.Node, context: EmitterContext): void;
export function addTrailingComment(source: string[], posOrNode: number|ts.Node, nodeOrContext: ts.Node|EmitterContext,
    optionalContext?: EmitterContext): void {
  const context = optionalContext || (nodeOrContext as EmitterContext);
  const node = optionalContext ? nodeOrContext as ts.Node : posOrNode as ts.Node;
  const pos = optionalContext ? posOrNode as number : node.getEnd();

  if (!getSourceFile(node)) {
    return;
  }
  const text = getSourceFile(node).getFullText();
  const ranges = ts.getTrailingCommentRanges(text, pos);
  if (ranges) {
    source.push(ranges
      .map(range => {
        if (context.offset <= range.pos) {
          const prefix = text.substring(context.offset, range.pos);
          const comment = prefix + text.substring(range.pos, range.end);
          context.offset += comment.length;
          return comment;
        }
        return '';
      })
      .join(''));
  }
}

export function addSemicolon(source: string[], node: ts.Node, context: EmitterContext): void {
  if (getSourceFile(node).getFullText().substring(context.offset).trim().startsWith(';')) {
    emitStatic(source, ';', node, context);
  }
}

export function addComma(source: string[], node: ts.Node, context: EmitterContext): void {
  if (getSourceFile(node).getFullText().substring(context.offset).trim().startsWith(',')) {
    emitStatic(source, ',', node, context);
  }
}

export function endNode(node: ts.Node, context: EmitterContext): void {
  const end = node.getEnd();
  if (context.offset < end) {
    context.offset = end;
  }
}

export function addLeadingAmpersand(source: string[], node: ts.Node, context: EmitterContext): void {
  // note: special case here. The '&' is not added with emitStatic since in this case the
  // context.offset is still before the node.fullStart
  const text = getSourceFile(node).getFullText().substring(context.offset, node.end).trim();
  const hasLeadingAmpersand = text.startsWith('&');
  if (hasLeadingAmpersand) {
    source.push('&');
    context.offset += 1;
  }
}

export function addLeadingBar(source: string[], node: ts.Node, context: EmitterContext): void {
  // note: special case here. The '|' is not added with emitStatic since in this case the
  // context.offset is still before the node.fullStart
  const text = getSourceFile(node).getFullText().substring(context.offset, node.end).trim();
  const hasLeadingBar = text.startsWith('|');
  if (hasLeadingBar) {
    source.push('|');
    context.offset += 1;
  }
}
