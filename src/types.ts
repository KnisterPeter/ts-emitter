import * as ts from 'typescript';
import { EmitterContext } from './emitter';
import {
  addWhitespace,
  emitStatic,
  addSemicolon,
  endNode
} from './utils';

export function emitType(this: any, node: ts.TypeNode, context: EmitterContext): string {
  const typeEmitterName = `emitType${ts.SyntaxKind[node.kind]}`;
  if (this[typeEmitterName] !== undefined) {
    return this[typeEmitterName](node, context);
  }
  throw new Error(`Unknown type node kind ${ts.SyntaxKind[node.kind]}`);
}

export function emitTypeStringKeyword(this: any, node: ts.KeywordTypeNode, context: EmitterContext): string {
  return _emitTypeKeyword('string', node, context);
}

export function emitTypeNumberKeyword(this: any, node: ts.KeywordTypeNode, context: EmitterContext): string {
  return _emitTypeKeyword('number', node, context);
}

export function emitTypeBooleanKeyword(this: any, node: ts.KeywordTypeNode, context: EmitterContext): string {
  return _emitTypeKeyword('boolean', node, context);
}

export function emitTypeObjectKeyword(this: any, node: ts.KeywordTypeNode, context: EmitterContext): string {
  return _emitTypeKeyword('object', node, context);
}

export function emitTypeVoidKeyword(this: any, node: ts.KeywordTypeNode, context: EmitterContext): string {
  return _emitTypeKeyword('void', node, context);
}

export function emitTypeNeverKeyword(this: any, node: ts.KeywordTypeNode, context: EmitterContext): string {
  return _emitTypeKeyword('never', node, context);
}

export function emitTypeAnyKeyword(this: any, node: ts.KeywordTypeNode, context: EmitterContext): string {
  return _emitTypeKeyword('any', node, context);
}

export function emitTypeNullKeyword(this: any, node: ts.KeywordTypeNode, context: EmitterContext): string {
  return _emitTypeKeyword('null', node, context);
}

export function emitTypeSymbolKeyword(this: any, node: ts.KeywordTypeNode, context: EmitterContext): string {
  return _emitTypeKeyword('symbol', node, context);
}

export function _emitTypeKeyword(this: any, keyword: string, node: ts.KeywordTypeNode,
  context: EmitterContext): string {
  const source: string[] = [];
  addWhitespace(source, node, context);
  source.push(keyword);
  endNode(node, context);
  return source.join('');
}

export function emitTypeTypeReference(this: any, node: ts.TypeReferenceNode, context: EmitterContext): string {
  const source: string[] = [];
  addWhitespace(source, node, context);
  source.push(emitType.call(this, node.typeName, context));
  if (node.typeArguments) {
    emitStatic(source, '<', node, context);
    for (let i = 0, n = node.typeArguments.length; i < n; i++) {
      addWhitespace(source, node, context);
      source.push(emitType.call(this, node.typeArguments[i], context));
      if ((i < n - 1) || node.typeArguments.hasTrailingComma) {
        emitStatic(source, ',', node, context);
      }
    }
    emitStatic(source, '>', node, context);
  }
  endNode(node, context);
  return source.join('');
}

// tslint:disable-next-line cyclomatic-complexity
export function emitTypeFunctionType(this: any, node: ts.FunctionTypeNode, context: EmitterContext): string {
  const source: string[] = [];
  if (node.name !== undefined) {
    addWhitespace(source, node, context);
    source.push(emitType.call(this, node.name, context));
  }
  emitStatic(source, '(', node, context);
  if (node.parameters) {
    for (let i = 0, n = node.parameters.length; i < n; i++) {
      addWhitespace(source, node, context);
      source.push(emitType.call(this, node.parameters[i], context));
      if ((i < n - 1) || node.parameters.hasTrailingComma) {
        emitStatic(source, ',', node, context);
      }
    }
  }
  emitStatic(source, ')', node, context);
  if (node.type) {
    emitStatic(source, '=>', node, context);
    addWhitespace(source, node, context);
    source.push(emitType.call(this, node.type, context));
  }
  endNode(node, context);
  return source.join('');
}

export function emitTypeTypeLiteral(this: any, node: ts.TypeLiteralNode, context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '{', node, context);
  if (node.members !== undefined) {
    for (let i = 0, n = node.members.length; i < n; i++) {
      addWhitespace(source, node, context);
      source.push(emitType.call(this, node.members[i], context));
    }
  }
  emitStatic(source, '}', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitTypeConstructSignature(this: any, node: ts.ConstructSignatureDeclaration,
    context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, 'new', node, context);
  emitStatic(source, '(', node, context);
  for (let i = 0, n = node.parameters.length; i < n; i++) {
    addWhitespace(source, node, context);
    source.push(emitType.call(this, node.parameters[i], context));
    if ((i < n - 1) || node.parameters.hasTrailingComma) {
      emitStatic(source, '|', node.parameters[i], context);
    }
  }
  emitStatic(source, ')', node, context);
  if (node.type) {
    emitStatic(source, ':', node, context);
    addWhitespace(source, node, context);
    source.push(emitType.call(this, node.type, context));
  }
  addSemicolon(source, node, context);
  endNode(node, context);
  return source.join('');
}

// tslint:disable-next-line cyclomatic-complexity
export function emitTypeMethodSignature(this: any, node: ts.MethodSignature, context: EmitterContext): string {
  const source: string[] = [];
  addWhitespace(source, node, context);
  source.push(emitType.call(this, node.name, context));
  if (node.questionToken) {
    emitStatic(source, '?', node, context);
  }
  emitStatic(source, '(', node, context);
  for (let i = 0, n = node.parameters.length; i < n; i++) {
    addWhitespace(source, node, context);
    source.push(emitType.call(this, node.parameters[i], context));
    if ((i < n - 1) || node.parameters.hasTrailingComma) {
      emitStatic(source, ',', node, context);
    }
  }
  emitStatic(source, ')', node, context);
  if (node.type) {
    emitStatic(source, ':', node, context);
    addWhitespace(source, node, context);
    source.push(emitType.call(this, node.type, context));
  }
  addSemicolon(source, node, context);
  endNode(node, context);
  return source.join('');
}

export function emitTypeArrayType(this: any, node: ts.ArrayTypeNode,
    context: EmitterContext): string {
  const source: string[] = [];
  addWhitespace(source, node, context);
  source.push(emitType.call(this, node.elementType, context));
  emitStatic(source, '[]', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitTypeIndexSignature(this: any, node: ts.IndexSignatureDeclaration, context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '[', node, context);
  node.parameters.forEach(paramter => {
    addWhitespace(source, node, context);
    source.push(emitType.call(this, paramter, context));
  });
  emitStatic(source, ']', node, context);
  if (node.type) {
    emitStatic(source, ':', node, context);
    addWhitespace(source, node, context);
    source.push(emitType.call(this, node.type, context));
  }
  addSemicolon(source, node, context);
  endNode(node, context);
  return source.join('');
}

export function emitTypeParameter(this: any, node: ts.ParameterDeclaration, context: EmitterContext): string {
  const source: string[] = [];
  if (node.dotDotDotToken) {
    emitStatic(source, '...', node, context);
  }
  addWhitespace(source, node, context);
  source.push(emitType.call(this, node.name, context));
  if (node.questionToken) {
    emitStatic(source, '?', node, context);
  }
  if (node.type) {
    emitStatic(source, ':', node, context);
    addWhitespace(source, node, context);
    source.push(emitType.call(this, node.type, context));
  }
  endNode(node, context);
  return source.join('');
}

export function emitTypeIdentifier(this: any, node: ts.Identifier, context: EmitterContext): string {
  const source: string[] = [];
  addWhitespace(source, node, context);
  source.push(node.text);
  endNode(node, context);
  return source.join('');
}

export function emitTypeUnionType(this: any, node: ts.UnionTypeNode, context: EmitterContext): string {
  const source: string[] = [];
  for (let i = 0, n = node.types.length; i < n; i++) {
    const type = node.types[i];
    addWhitespace(source, node, context);
    source.push(emitType.call(this, type, context));
    if ((i < n - 1) || node.types.hasTrailingComma) {
      emitStatic(source, '|', node, context);
    }
  }
  return source.join('');
}

export function emitTypeTypeQuery(this: any, node: ts.TypeQueryNode, context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, 'typeof', node, context);
  addWhitespace(source, node, context);
  source.push(emitType.call(this, node.exprName, context));
  return source.join('');
}

export function emitTypePropertySignature(this: any, node: ts.PropertySignature, context: EmitterContext): string {
  const source: string[] = [];
  addWhitespace(source, node, context);
  source.push(emitType.call(this, node.name, context));
  if (node.questionToken) {
    emitStatic(source, '?', node, context);
  }
  if (node.type) {
    emitStatic(source, ':', node, context);
    addWhitespace(source, node, context);
    source.push(emitType.call(this, node.type, context));
  }
  addSemicolon(source, node, context);
  endNode(node, context);
  return source.join('');
}

export function emitTypeFirstNode(this: any, node: ts.QualifiedName, context: EmitterContext): string {
  const source: string[] = [];
  addWhitespace(source, node, context);
  source.push(emitType.call(this, node.left, context));
  emitStatic(source, '.', node, context);
  addWhitespace(source, node, context);
  source.push(emitType.call(this, node.right, context));
  endNode(node, context);
  return source.join('');
}

export function emitTypeParenthesizedType(this: any, node: ts.ParenthesizedTypeNode, context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '(', node, context);
  addWhitespace(source, node, context);
  source.push(emitType.call(this, node.type, context));
  emitStatic(source, ')', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitTypeFirstTypeNode(this: any, node: ts.TypePredicateNode, context: EmitterContext): string {
  const source: string[] = [];
  addWhitespace(source, node, context);
  source.push(emitType.call(this, node.parameterName, context));
  emitStatic(source, 'is', node, context);
  addWhitespace(source, node, context);
  source.push(emitType.call(this, node.type, context));
  endNode(node, context);
  return source.join('');
}

// tslint:disable-next-line cyclomatic-complexity
export function emitTypeCallSignature(this: any, node: ts.CallSignatureDeclaration, context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '(', node, context);
  if (node.parameters) {
    for (let i = 0, n = node.parameters.length; i < n; i++) {
      addWhitespace(source, node, context);
      source.push(emitType.call(this, node.parameters[i], context));
      if ((i < n - 1) || node.parameters.hasTrailingComma) {
        emitStatic(source, '|', node.parameters[i], context);
      }
    }
  }
  emitStatic(source, ')', node, context);
  if (node.type) {
    emitStatic(source, ':', node, context);
    addWhitespace(source, node, context);
    source.push(emitType.call(this, node.type, context));
  }
  addSemicolon(source, node, context);
  endNode(node, context);
  return source.join('');
}

export function emitTypeTypeOperator(this: any, node: ts.TypeOperatorNode, context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, 'keyof', node, context);
  addWhitespace(source, node, context);
  source.push(emitType.call(this, node.type, context));
  endNode(node, context);
  return source.join('');
}

export function emitTypeConstructorType(this: any, node: ts.ConstructorTypeNode, context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, 'new', node, context);
  emitStatic(source, '(', node, context);
  node.parameters.forEach(paramter => {
    addWhitespace(source, node, context);
    source.push(emitType.call(this, paramter, context));
  });
  emitStatic(source, ')', node, context);
  if (node.type) {
    emitStatic(source, '=>', node, context);
    addWhitespace(source, node, context);
    source.push(emitType.call(this, node.type, context));
  }
  addSemicolon(source, node, context);
  endNode(node, context);
  return source.join('');
}
