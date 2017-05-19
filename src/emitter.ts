import * as ts from 'typescript';

import { emitType } from './types';
import {
  addWhitespace,
  emitStatic,
  addLeadingComment,
  addTrailingComment,
  addSemicolon,
  endNode
} from './utils';

export interface EmitterContext {
  sourceFile: ts.SourceFile;
  offset: number;
}

interface StatementsNode extends ts.Node {
  statements?: ts.NodeArray<ts.Node>;
}

function emitStatements<T extends StatementsNode>(this: any,
    source: string[], node: T, context: EmitterContext): void {
  if (node.statements) {
    for (let i = 0, n = node.statements.length; i < n; i++) {
      const statement = node.statements[i];
      addWhitespace(source, statement, context);
      source.push(emit.call(this, statement, context));
    }
  }
}

interface ElementsNode extends ts.Node {
  elements?: ts.NodeArray<ts.Node>;
}

function emitElements<T extends ElementsNode>(this: any,
    source: string[], node: T, context: EmitterContext): void {
  addLeadingComment(source, context.offset, node, context);
  if (node.elements) {
    for (let i = 0, n = node.elements.length; i < n; i++) {
      addLeadingComment(source, context.offset, node, context);
      addTrailingComment(source, context.offset, node, context);
      const element = node.elements[i];
      addWhitespace(source, element, context);
      source.push(emit.call(this, element, context));
      addLeadingComment(source, context.offset, node, context);
      addTrailingComment(source, context.offset, node, context);
      if ((i < n - 1) || node.elements.hasTrailingComma) {
        emitStatic(source, ',', node, context);
        addTrailingComment(source, context.offset, node, context);
      }
    }
  }
  addTrailingComment(source, context.offset, node, context);
}

interface TypedNode extends ts.Node {
  typeParameters?: ts.NodeArray<ts.Node>;
}

function emitTypeParameters<T extends TypedNode>(this: any,
    source: string[], node: T, context: EmitterContext): void {
  if (node.typeParameters) {
    emitStatic(source, '<', node, context);
    for (let i = 0, n = node.typeParameters.length; i < n; i++) {
      addWhitespace(source, node, context);
      source.push(emit.call(this, node.typeParameters[i], context));
      if ((i < n - 1) || node.typeParameters.hasTrailingComma) {
        emitStatic(source, ',', node, context);
      }
    }
    emitStatic(source, '>', node, context);
  }
}

interface TypeArgumentedNode extends ts.Node {
  typeArguments?: ts.NodeArray<ts.Node>;
}

function emitTypeArguments<T extends TypeArgumentedNode>(this: any,
    source: string[], node: T, context: EmitterContext): void {
  if (node.typeArguments) {
    emitStatic(source, '<', node, context);
    for (let i = 0, n = node.typeArguments.length; i < n; i++) {
      addWhitespace(source, node, context);
      source.push(emit.call(this, node.typeArguments[i], context));
      if ((i < n - 1) || node.typeArguments.hasTrailingComma) {
        emitStatic(source, ',', node, context);
      }
    }
    emitStatic(source, '>', node, context);
  }
}

interface NodeWithParameters extends ts.Node {
  parameters?: ts.NodeArray<ts.Node>;
}

function emitParameters<T extends NodeWithParameters>(this: any,
    source: string[], node: T, context: EmitterContext): void {
  addLeadingComment(source, context.offset, node, context);
  if (node.parameters) {
    for (let i = 0, n = node.parameters.length; i < n; i++) {
      addTrailingComment(source, context.offset, node, context);
      addLeadingComment(source, context.offset, node, context);
      addWhitespace(source, node, context);
      source.push(emit.call(this, node.parameters[i], context));
      if ((i < n - 1) || node.parameters.hasTrailingComma) {
        emitStatic(source, ',', node, context);
      }
    }
  }
  addTrailingComment(source, context.offset, node, context);
}

interface NodeWithModifiers extends ts.Node {
  parameters?: ts.NodeArray<ts.Node>;
}

function emitModifiers<T extends NodeWithModifiers>(this: any,
    source: string[], node: T, context: EmitterContext): void {
  if (node.modifiers) {
    node.modifiers.forEach(modifier => {
      addWhitespace(source, node, context);
      source.push(emit.call(this, modifier, context));
    });
  }
}

export function emit(this: any, node: ts.Node, context: EmitterContext): string {
  const emitterFunction = `emit${ts.SyntaxKind[node.kind]}`;
  if (this[emitterFunction] !== undefined) {
    return this[emitterFunction](node, context);
  }
  throw new Error(`Unknown node kind ${ts.SyntaxKind[node.kind]}`);
}

function emitShebang(this: any, node: ts.SourceFile, context: EmitterContext): string {
  const source: string[] = [];
  const ranges = ts.getLeadingCommentRanges(node.getSourceFile().getFullText(), node.getFullStart());
  let pos = node.getStart();
  if (ranges) {
    pos = ranges[0].pos;
  }
  const filePrefix = node.getSourceFile().getFullText().substring(0, pos);
  source.push(filePrefix);
  context.offset += filePrefix.length;
  return source.join('');
}

export function emitSourceFile(this: any, node: ts.SourceFile, context: EmitterContext): string {
  const source: string[] = [];
  source.push(emitShebang(node, context));
  node.forEachChild(child => {
    addWhitespace(source, node, context);
    source.push(emit.call(this, child, context));
  });
  endNode(node, context);
  return source.join('');
}

export function emitEndOfFileToken(this: any, node: ts.EndOfFileToken, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  addWhitespace(source, node, context);
  endNode(node, context);
  return source.join('');
}

export function emitEnumDeclaration(this: any, node: ts.EnumDeclaration, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitModifiers.call(this, source, node, context);
  source.push(emitEnumKeyword(node, context));
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.name, context));
  emitStatic(source, '{', node, context);
  addTrailingComment(source, context.offset, node, context);
  if (node.members) {
    for (let i = 0, n = node.members.length; i < n; i++) {
      addWhitespace(source, node, context);
      source.push(emit.call(this, node.members[i], context));
      if ((i < n - 1) || node.members.hasTrailingComma) {
        emitStatic(source, ',', node, context);
        addTrailingComment(source, context.offset, node, context);
      }
    }
  }
  emitStatic(source, '}', node, context);
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitEnumMember(this: any, node: ts.EnumMember, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.name, context));
  if (node.initializer) {
    emitStatic(source, '=', node, context);
    addWhitespace(source, node, context);
    source.push(emit.call(this, node.initializer, context));
  }
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitModuleDeclaration(this: any, node: ts.ModuleDeclaration, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitModifiers.call(this, source, node, context);
  // tslint:disable no-bitwise
  if (node.flags & ts.NodeFlags.NestedNamespace) {
    emitStatic(source, '.', node, context);
  } else if (node.flags & ts.NodeFlags.Namespace) {
    emitStatic(source, 'namespace', node, context);
  } else if (node.flags & ts.NodeFlags.GlobalAugmentation) {
    // note: the static 'global' is emitted below as name property
    // emitStatic(source, 'global', node, context);
  } else {
    emitStatic(source, 'module', node, context);
  }
  // tslint:enable no-bitwise
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.name, context));
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.body, context));
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitModuleBlock(this: any, node: ts.ModuleBlock, context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '{', node, context);
  addTrailingComment(source, context.offset, node, context);
  emitStatements.call(this, source, node, context);
  addLeadingComment(source, context.offset, node, context);
  emitStatic(source, '}', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitImportEqualsDeclaration(this: any, node: ts.ImportEqualsDeclaration,
    context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitModifiers.call(this, source, node, context);
  emitStatic(source, 'import', node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.name, context));
  emitStatic(source, '=', node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.moduleReference, context));
  addSemicolon(source, node, context);
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitExternalModuleReference(this: any, node: ts.ExternalModuleReference,
    context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitStatic(source, 'require', node, context);
  emitStatic(source, '(', node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.expression, context));
  emitStatic(source, ')', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitFirstNode(this: any, node: ts.QualifiedName, context: EmitterContext): string {
  const source: string[] = [];
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.left, context));
  emitStatic(source, '.', node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.right, context));
  endNode(node, context);
  return source.join('');
}

export function emitImportDeclaration(this: any, node: ts.ImportDeclaration, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitStatic(source, 'import', node, context);
  if (node.importClause) {
    addWhitespace(source, node, context);
    source.push(emit.call(this, node.importClause, context));
    emitStatic(source, 'from', node, context);
  }
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.moduleSpecifier, context));
  addSemicolon(source, node, context);
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitImportClause(this: any, node: ts.ImportClause, context: EmitterContext): string {
  const source: string[] = [];
  if (node.name) {
    addWhitespace(source, node, context);
    source.push(emit.call(this, node.name, context));
    if (node.namedBindings) {
      emitStatic(source, ',', node, context);
    }
  }
  if (node.namedBindings) {
    addWhitespace(source, node, context);
    source.push(emit.call(this, node.namedBindings, context));
  }
  endNode(node, context);
  return source.join('');
}

export function emitNamespaceImport(this: any, node: ts.NamespaceImport, context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '* as ', node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.name, context));
  endNode(node, context);
  return source.join('');
}

export function emitNamedImports(this: any, node: ts.NamedImports, context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '{', node, context);
  emitElements.call(this, source, node, context);
  emitStatic(source, '}', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitImportSpecifier(this: any, node: ts.ImportSpecifier, context: EmitterContext): string {
  const source: string[] = [];
  if (node.propertyName) {
    addWhitespace(source, node, context);
    source.push(emit.call(this, node.propertyName, context));
    emitStatic(source, 'as', node, context);
  }
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.name, context));
  endNode(node, context);
  return source.join('');
}

export function emitNamespaceExportDeclaration(this: any, node: ts.NamespaceExportDeclaration,
    context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitStatic(source, 'export', node, context);
  emitStatic(source, 'as', node, context);
  emitStatic(source, 'namespace', node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.name, context));
  addSemicolon(source, node, context);
  endNode(node, context);
  return source.join('');
}

export function emitExportDeclaration(this: any, node: ts.ExportDeclaration, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  source.push(emitExportKeyword(node, context));
  addWhitespace(source, node, context);
  if (node.exportClause) {
    source.push(emit.call(this, node.exportClause, context));
  } else {
    emitStatic(source, '*', node, context);
  }
  if (node.moduleSpecifier) {
    emitStatic(source, 'from', node, context);
    addWhitespace(source, node, context);
    source.push(emit.call(this, node.moduleSpecifier, context));
  }
  addSemicolon(source, node, context);
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitNamedExports(this: any, node: ts.NamedExports, context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '{', node, context);
  emitElements.call(this, source, node, context);
  emitStatic(source, '}', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitExportSpecifier(this: any, node: ts.ExportSpecifier, context: EmitterContext): string {
  const source: string[] = [];
  if (node.propertyName) {
    addWhitespace(source, node, context);
    source.push(emit.call(this, node.propertyName, context));
    emitStatic(source, 'as', node, context);
  }
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.name, context));
  endNode(node, context);
  return source.join('');
}

export function emitExportAssignment(this: any, node: ts.ExportAssignment, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  source.push(emitExportKeyword(node, context));
  if (node.isExportEquals) {
    emitStatic(source, '=', node, context);
  } else {
    source.push(emitDefaultKeyword(node, context));
  }
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.expression, context));
  addSemicolon(source, node, context);
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitInterfaceDeclaration(this: any, node: ts.InterfaceDeclaration, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitModifiers.call(this, source, node, context);
  emitStatic(source, 'interface', node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.name, context));
  emitTypeParameters.call(this, source, node, context);
  if (node.heritageClauses) {
    emitStatic(source, 'extends', node, context);
    for (let i = 0, n = node.heritageClauses.length; i < n; i++) {
      addWhitespace(source, node, context);
      source.push(emit.call(this, node.heritageClauses[i], context));
    }
  }
  emitStatic(source, '{', node, context);
  addTrailingComment(source, context.offset, node, context);
  node.members.forEach(member => {
    addWhitespace(source, node, context);
    source.push(emit.call(this, member, context));
    addTrailingComment(source, context.offset, node, context);
  });
  addLeadingComment(source, context.offset, node, context);
  emitStatic(source, '}', node, context);
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitConstructSignature(this: any, node: ts.ConstructSignatureDeclaration,
    context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitStatic(source, 'new', node, context);
  emitTypeParameters.call(this, source, node, context);
  emitStatic(source, '(', node, context);
  emitParameters.call(this, source, node, context);
  emitStatic(source, ')', node, context);
  if (node.type) {
    emitStatic(source, ':', node, context);
    addWhitespace(source, node, context);
    source.push(emitType(node.type, context));
  }
  addSemicolon(source, node, context);
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitCallSignature(this: any, node: ts.CallSignatureDeclaration, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitTypeParameters.call(this, source, node, context);
  emitStatic(source, '(', node, context);
  emitParameters.call(this, source, node, context);
  emitStatic(source, ')', node, context);
  if (node.type) {
    emitStatic(source, ':', node, context);
    addWhitespace(source, node, context);
    source.push(emitType(node.type, context));
  }
  addSemicolon(source, node, context);
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitPropertySignature(this: any, node: ts.PropertySignature, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.name, context));
  if (node.questionToken) {
    emitStatic(source, '?', node, context);
  }
  if (node.type) {
    emitStatic(source, ':', node, context);
    addWhitespace(source, node, context);
    source.push(emitType(node.type, context));
  }
  if (context.sourceFile.text.substring(context.offset).trim().startsWith(',')) {
    emitStatic(source, ',', node, context);
  }
  addSemicolon(source, node, context);
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

// tslint:disable-next-line cyclomatic-complexity
export function emitMethodSignature(this: any, node: ts.MethodSignature, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.name, context));
  if (node.questionToken) {
    emitStatic(source, '?', node, context);
  }
  emitTypeParameters.call(this, source, node, context);
  emitStatic(source, '(', node, context);
  emitParameters.call(this, source, node, context);
  emitStatic(source, ')', node, context);
  if (node.type) {
    emitStatic(source, ':', node, context);
    addWhitespace(source, node, context);
    source.push(emitType(node.type, context));
  }
  addSemicolon(source, node, context);
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitTypeReference(this: any, node: ts.TypeReferenceNode, context: EmitterContext): string {
  const source: string[] = [];
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.typeName, context));
  emitTypeArguments.call(this, source, node, context);
  endNode(node, context);
  return source.join('');
}

// tslint:disable-next-line cyclomatic-complexity
export function emitClassDeclaration(this: any, node: ts.ClassDeclaration, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  if (node.decorators) {
    node.decorators.forEach(decorator => {
      addWhitespace(source, node, context);
      source.push(emit.call(this, decorator, context));
    });
  }
  emitModifiers.call(this, source, node, context);
  emitStatic(source, 'class', node, context);
  if (node.name) {
    addWhitespace(source, node, context);
    source.push(emit.call(this, node.name, context));
  }
  emitTypeParameters.call(this, source, node, context);
  if (node.heritageClauses) {
    for (let i = 0, n = node.heritageClauses.length; i < n; i++) {
      switch (node.heritageClauses[i].token) {
        case ts.SyntaxKind.ExtendsKeyword:
          emitStatic(source, 'extends', node, context);
          break;
        case ts.SyntaxKind.ImplementsKeyword:
          emitStatic(source, 'implements', node, context);
          break;
      }
      addWhitespace(source, node, context);
      source.push(emit.call(this, node.heritageClauses[i], context));
    }
  }
  addTrailingComment(source, context.offset, node, context);
  emitStatic(source, '{', node, context);
  addTrailingComment(source, context.offset, node, context);
  node.members.forEach(member => {
    addWhitespace(source, node, context);
    source.push(emit.call(this, member, context));
  });
  addLeadingComment(source, context.offset, node, context);
  emitStatic(source, '}', node, context);
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitDecorator(this: any, node: ts.Decorator, context: EmitterContext): string {
  const source: string[] = [];
  addWhitespace(source, node, context);
  emitStatic(source, '@', node, context);
  source.push(emit.call(this, node.expression, context));
  endNode(node, context);
  return source.join('');
}

export function emitHeritageClause(this: any, node: ts.HeritageClause, context: EmitterContext): string {
  const source: string[] = [];
  for (let i = 0, n = node.types.length; i < n; i++) {
    addWhitespace(source, node, context);
    source.push(emit.call(this, node.types[i], context));
    if ((i < n - 1) || node.types.hasTrailingComma) {
      emitStatic(source, ',', node, context);
    }
  }
  endNode(node, context);
  return source.join('');
}

export function emitExpressionWithTypeArguments(this: any, node: ts.ExpressionWithTypeArguments,
  context: EmitterContext): string {
  const source: string[] = [];
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.expression, context));
  emitTypeArguments.call(this, source, node, context);
  endNode(node, context);
  return source.join('');
}

export function emitConstructor(this: any, node: ts.ConstructorDeclaration, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitModifiers.call(this, source, node, context);
  emitStatic(source, 'constructor', node, context);
  emitStatic(source, '(', node, context);
  emitParameters.call(this, source, node, context);
  emitStatic(source, ')', node, context);
  if (node.body) {
    addWhitespace(source, node, context);
    source.push(emit.call(this, node.body, context));
  }
  addSemicolon(source, node, context);
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitPropertyDeclaration(this: any, node: ts.PropertyDeclaration, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  if (node.decorators) {
    node.decorators.forEach(decorator => {
      addWhitespace(source, node, context);
      source.push(emit.call(this, decorator, context));
    });
  }
  emitModifiers.call(this, source, node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.name, context));
  if (node.type) {
    emitStatic(source, ':', node, context);
    addWhitespace(source, node, context);
    source.push(emitType(node.type, context));
  }
  if (node.initializer) {
    emitStatic(source, '=', node, context);
    addWhitespace(source, node, context);
    source.push(emit.call(this, node.initializer, context));
  }
  addSemicolon(source, node, context);
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitGetAccessor(this: any, node: ts.GetAccessorDeclaration, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitModifiers.call(this, source, node, context);
  emitStatic(source, 'get', node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.name, context));
  emitStatic(source, '(', node, context);
  emitParameters.call(this, source, node, context);
  emitStatic(source, ')', node, context);
  if (node.type) {
    emitStatic(source, ':', node, context);
    addWhitespace(source, node, context);
    source.push(emitType(node.type, context));
  }
  addWhitespace(source, node, context);
  if (node.body) {
    source.push(emit.call(this, node.body, context));
  } else {
    addSemicolon(source, node, context);
  }
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitSetAccessor(this: any, node: ts.SetAccessorDeclaration, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitModifiers.call(this, source, node, context);
  emitStatic(source, 'set', node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.name, context));
  emitStatic(source, '(', node, context);
  emitParameters.call(this, source, node, context);
  emitStatic(source, ')', node, context);
  if (node.type) {
    emitStatic(source, ':', node, context);
    addWhitespace(source, node, context);
    source.push(emitType(node.type, context));
  }
  addWhitespace(source, node, context);
  if (node.body) {
    source.push(emit.call(this, node.body, context));
  } else {
    addSemicolon(source, node, context);
  }
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitMethodDeclaration(this: any, node: ts.MethodDeclaration, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  if (node.decorators) {
    node.decorators.forEach(decorator => {
      addWhitespace(source, node, context);
      source.push(emit.call(this, decorator, context));
    });
  }
  emitModifiers.call(this, source, node, context);
  if (node.asteriskToken) {
    emitStatic(source, '*', node, context);
  }
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.name, context));
  if (node.questionToken) {
    emitStatic(source, '?', node, context);
  }
  emitTypeParameters.call(this, source, node, context);
  emitStatic(source, '(', node, context);
  emitParameters.call(this, source, node, context);
  emitStatic(source, ')', node, context);
  if (node.type) {
    emitStatic(source, ':', node, context);
    addWhitespace(source, node, context);
    source.push(emitType(node.type, context));
  }
  if (node.body) {
    addWhitespace(source, node, context);
    source.push(emit.call(this, node.body, context));
  } else {
    addSemicolon(source, node, context);
  }
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitSemicolonClassElement(this: any, node: ts.SemicolonClassElement, context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, ';', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitVariableStatement(this: any, node: ts.VariableStatement, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  node.forEachChild(child => {
    addWhitespace(source, node, context);
    source.push(emit.call(this, child, context));
  });
  addSemicolon(source, node, context);
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitLabeledStatement(this: any, node: ts.LabeledStatement, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.label, context));
  emitStatic(source, ':', node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.statement, context));
  endNode(node, context);
  return source.join('');
}

export function emitBreakStatement(this: any, node: ts.BreakStatement, context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, 'break', node, context);
  if (node.label) {
    addWhitespace(source, node, context);
    source.push(emit.call(this, node.label, context));
  }
  addSemicolon(source, node, context);
  endNode(node, context);
  return source.join('');
}

export function emitSwitchStatement(this: any, node: ts.SwitchStatement, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitStatic(source, 'switch', node, context);
  emitStatic(source, '(', node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.expression, context));
  emitStatic(source, ')', node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.caseBlock, context));
  endNode(node, context);
  return source.join('');
}

export function emitCaseBlock(this: any, node: ts.CaseBlock, context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '{', node, context);
  for (let i = 0, n = node.clauses.length; i < n; i++) {
    addWhitespace(source, node, context);
    source.push(emit.call(this, node.clauses[i], context));
  }
  emitStatic(source, '}', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitCaseClause(this: any, node: ts.CaseClause, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitStatic(source, 'case', node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.expression, context));
  emitStatic(source, ':', node, context);
  addTrailingComment(source, context.offset, node, context);
  emitStatements.call(this, source, node, context);
  endNode(node, context);
  return source.join('');
}

export function emitDefaultClause(this: any, node: ts.DefaultClause, context: EmitterContext): string {
  const source: string[] = [];
  source.push(emitDefaultKeyword(node, context));
  emitStatic(source, ':', node, context);
  emitStatements.call(this, source, node, context);
  endNode(node, context);
  return source.join('');
}

export function emitIfStatement(this: any, node: ts.IfStatement, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitStatic(source, 'if', node, context);
  emitStatic(source, '(', node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.expression, context));
  emitStatic(source, ')', node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.thenStatement, context));
  if (node.elseStatement) {
    emitStatic(source, 'else', node, context);
    addWhitespace(source, node, context);
    source.push(emit.call(this, node.elseStatement, context));
  }
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitWhileStatement(this: any, node: ts.WhileStatement, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitStatic(source, 'while', node, context);
  emitStatic(source, '(', node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.expression, context));
  emitStatic(source, ')', node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.statement, context));
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitDoStatement(this: any, node: ts.DoStatement, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitStatic(source, 'do', node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.statement, context));
  emitStatic(source, 'while', node, context);
  emitStatic(source, '(', node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.expression, context));
  emitStatic(source, ')', node, context);
  addSemicolon(source, node, context);
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitForStatement(this: any, node: ts.ForStatement, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitStatic(source, 'for', node, context);
  emitStatic(source, '(', node, context);
  if (node.initializer) {
    addWhitespace(source, node, context);
    source.push(emit.call(this, node.initializer, context));
  }
  emitStatic(source, ';', node, context);
  if (node.condition) {
    addWhitespace(source, node, context);
    source.push(emit.call(this, node.condition, context));
  }
  emitStatic(source, ';', node, context);
  if (node.incrementor) {
    addWhitespace(source, node, context);
    source.push(emit.call(this, node.incrementor, context));
  }
  emitStatic(source, ')', node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.statement, context));
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitForInStatement(this: any, node: ts.ForInStatement, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitStatic(source, 'for', node, context);
  emitStatic(source, '(', node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.initializer, context));
  emitStatic(source, 'in', node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.expression, context));
  emitStatic(source, ')', node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.statement, context));
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitForOfStatement(this: any, node: ts.ForOfStatement, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitStatic(source, 'for', node, context);
  emitStatic(source, '(', node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.initializer, context));
  emitStatic(source, 'of', node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.expression, context));
  emitStatic(source, ')', node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.statement, context));
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitWithStatement(this: any, node: ts.WithStatement, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitStatic(source, 'with', node, context);
  emitStatic(source, '(', node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.expression, context));
  emitStatic(source, ')', node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.statement, context));
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitUnionType(this: any, node: ts.UnionTypeNode, context: EmitterContext): string {
  const source: string[] = [];
  for (let i = 0, n = node.types.length; i < n; i++) {
    const type = node.types[i];
    addWhitespace(source, node, context);
    source.push(emit.call(this, type, context));
    if ((i < n - 1) || node.types.hasTrailingComma) {
      emitStatic(source, '|', node, context);
    }
  }
  return source.join('');
}

export function emitExpressionStatement(this: any, node: ts.ExpressionStatement, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.expression, context));
  addSemicolon(source, node, context);
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitReturnStatement(this: any, node: ts.ReturnStatement, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitStatic(source, 'return', node, context);
  if (node.expression) {
    addWhitespace(source, node, context);
    source.push(emit.call(this, node.expression, context));
  }
  addSemicolon(source, node, context);
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitDebuggerStatement(this: any, node: ts.DebuggerStatement, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitStatic(source, 'debugger', node, context);
  addSemicolon(source, node, context);
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitTryStatement(this: any, node: ts.TryStatement, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitStatic(source, 'try', node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.tryBlock, context));
  if (node.catchClause) {
    addWhitespace(source, node, context);
    source.push(emit.call(this, node.catchClause, context));
  }
  if (node.finallyBlock) {
    emitStatic(source, 'finally', node, context);
    addWhitespace(source, node, context);
    source.push(emit.call(this, node.finallyBlock, context));
  }
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitCatchClause(this: any, node: ts.CatchClause, context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, 'catch', node, context);
  emitStatic(source, '(', node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.variableDeclaration, context));
  emitStatic(source, ')', node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.block, context));
  endNode(node, context);
  return source.join('');
}

export function emitEmptyStatement(this: any, node: ts.EmptyStatement, context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, ';', node, context);
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitContinueStatement(this: any, node: ts.ContinueStatement, context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, 'continue', node, context);
  if (node.label) {
    addWhitespace(source, node, context);
    source.push(emit.call(this, node.label, context));
  }
  addSemicolon(source, node, context);
  endNode(node, context);
  return source.join('');
}

export function emitThrowStatement(this: any, node: ts.ThrowStatement, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitStatic(source, 'throw', node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.expression, context));
  addSemicolon(source, node, context);
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitNewExpression(this: any, node: ts.NewExpression, context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, 'new', node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.expression, context));
  emitTypeArguments.call(this, source, node, context);
  if (node.getSourceFile().getFullText()
    .substring(context.offset, node.getEnd()).trim().startsWith('(')) {
    emitStatic(source, '(', node, context);
    if (node.arguments) {
      for (let i = 0, n = node.arguments.length; i < n; i++) {
        addWhitespace(source, node, context);
        source.push(emit.call(this, node.arguments[i], context));
        if ((i < n - 1) || node.arguments.hasTrailingComma) {
          emitStatic(source, ',', node, context);
        }
      }
    }
    emitStatic(source, ')', node, context);
  }
  endNode(node, context);
  return source.join('');
}

export function emitArrayBindingPattern(this: any, node: ts.ArrayBindingPattern, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitStatic(source, '[', node, context);
  emitElements.call(this, source, node, context);
  emitStatic(source, ']', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitObjectBindingPattern(this: any, node: ts.ObjectBindingPattern, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitStatic(source, '{', node, context);
  emitElements.call(this, source, node, context);
  emitStatic(source, '}', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitBindingElement(this: any, node: ts.BindingElement, context: EmitterContext): string {
  const source: string[] = [];
  if (node.dotDotDotToken) {
    emitStatic(source, '...', node, context);
  }
  if (node.propertyName) {
    addWhitespace(source, node, context);
    source.push(emit.call(this, node.propertyName, context));
    emitStatic(source, ':', node, context);
  }
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.name, context));
  if (node.initializer) {
    emitStatic(source, '=', node, context);
    addWhitespace(source, node, context);
    source.push(emit.call(this, node.initializer, context));
  }
  endNode(node, context);
  return source.join('');
}

export function emitOmittedExpression(this: any, node: ts.OmittedExpression, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  addWhitespace(source, node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitAwaitExpression(this: any, node: ts.AwaitExpression, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitStatic(source, 'await', node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.expression, context));
  endNode(node, context);
  return source.join('');
}

export function emitVoidExpression(this: any, node: ts.VoidExpression, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitStatic(source, 'void', node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.expression, context));
  endNode(node, context);
  return source.join('');
}

export function emitDeleteExpression(this: any, node: ts.DeleteExpression, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitStatic(source, 'delete', node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.expression, context));
  endNode(node, context);
  return source.join('');
}

export function emitConditionalExpression(this: any, node: ts.ConditionalExpression, context: EmitterContext): string {
  const source: string[] = [];
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.condition, context));
  emitStatic(source, '?', node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.whenTrue, context));
  emitStatic(source, ':', node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.whenFalse, context));
  endNode(node, context);
  return source.join('');
}

export function emitElementAccessExpression(this: any, node: ts.ElementAccessExpression,
    context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.expression, context));
  emitStatic(source, '[', node, context);
  if (node.argumentExpression) {
    addWhitespace(source, node, context);
    source.push(emit.call(this, node.argumentExpression, context));
  }
  emitStatic(source, ']', node, context);
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

// tslint:disable-next-line cyclomatic-complexity
export function emitVariableDeclarationList(this: any, node: ts.VariableDeclarationList,
  context: EmitterContext): string {
  const source: string[] = [];
  // tslint:disable no-bitwise
  if (node.flags & ts.NodeFlags.Const) {
    emitStatic(source, 'const', node, context);
  } else if (node.flags & ts.NodeFlags.Let) {
    emitStatic(source, 'let', node, context);
  } else {
    emitStatic(source, 'var', node, context);
  }
  // tslint:enable no-bitwise
  addTrailingComment(source, context.offset, node, context);
  for (let i = 0, n = node.declarations.length; i < n; i++) {
    addWhitespace(source, node, context);
    source.push(emit.call(this, node.declarations[i], context));
    if ((i < n - 1) || node.declarations.hasTrailingComma) {
      emitStatic(source, ',', node, context);
    }
  }
  endNode(node, context);
  return source.join('');
}

export function emitVariableDeclaration(this: any, node: ts.VariableDeclaration, context: EmitterContext): string {
  const source: string[] = [];
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.name, context));
  if (node.type !== undefined) {
    emitStatic(source, ':', node, context);
    addWhitespace(source, node, context);
    source.push(emitType(node.type, context));
  }
  if (node.initializer !== undefined) {
    emitStatic(source, '=', node, context);
    addWhitespace(source, node, context);
    source.push(emit.call(this, node.initializer, context));
  }
  endNode(node, context);
  return source.join('');
}

export function emitTypeAssertionExpression(this: any, node: ts.TypeAssertion, context: EmitterContext): string {
  const source: string[] = [];

  emitStatic(source, '<', node, context);
  addWhitespace(source, node, context);
  source.push(emitType(node.type, context));
  emitStatic(source, '>', node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.expression, context));

  endNode(node, context);
  return source.join('');
}

export function emitFunctionDeclaration(this: any, node: ts.FunctionDeclaration, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitModifiers.call(this, source, node, context);
  emitStatic(source, 'function', node, context);
  if (node.asteriskToken) {
    emitStatic(source, '*', node, context);
  }
  if (node.name) {
    addWhitespace(source, node, context);
    source.push(emit.call(this, node.name, context));
  }
  emitTypeParameters.call(this, source, node, context);
  emitStatic(source, '(', node, context);
  emitParameters.call(this, source, node, context);
  emitStatic(source, ')', node, context);
  if (node.type !== undefined) {
    emitStatic(source, ':', node, context);
    addWhitespace(source, node, context);
    source.push(emitType(node.type, context));
  }
  if (node.body) {
    addWhitespace(source, node, context);
    source.push(emit.call(this, node.body, context));
  } else {
    addSemicolon(source, node, context);
  }
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitClassExpression(this: any, node: ts.ClassExpression, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitStatic(source, 'class', node, context);
  if (node.name) {
    addWhitespace(source, node, context);
    source.push(emit.call(this, node.name, context));
  }
  emitTypeParameters.call(this, source, node, context);
  if (node.heritageClauses) {
    for (let i = 0, n = node.heritageClauses.length; i < n; i++) {
      switch (node.heritageClauses[i].token) {
        case ts.SyntaxKind.ExtendsKeyword:
          emitStatic(source, 'extends', node, context);
          break;
        case ts.SyntaxKind.ImplementsKeyword:
          emitStatic(source, 'implements', node, context);
          break;
      }
      addWhitespace(source, node, context);
      source.push(emit.call(this, node.heritageClauses[i], context));
    }
  }
  emitStatic(source, '{', node, context);
  addTrailingComment(source, context.offset, node, context);
  node.members.forEach(member => {
    addWhitespace(source, node, context);
    source.push(emit.call(this, member, context));
  });
  emitStatic(source, '}', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitFunctionExpression(this: any, node: ts.FunctionExpression, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitModifiers.call(this, source, node, context);
  emitStatic(source, 'function', node, context);
  if (node.asteriskToken) {
    emitStatic(source, '*', node, context);
  }
  if (node.name) {
    addWhitespace(source, node, context);
    source.push(emit.call(this, node.name, context));
  }
  emitTypeParameters.call(this, source, node, context);
  emitStatic(source, '(', node, context);
  emitParameters.call(this, source, node, context);
  emitStatic(source, ')', node, context);
  if (node.type !== undefined) {
    emitStatic(source, ':', node, context);
    addWhitespace(source, node, context);
    source.push(emitType(node.type, context));
  }
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.body, context));
  endNode(node, context);
  return source.join('');
}

export function emitYieldExpression(this: any, node: ts.YieldExpression, context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, 'yield', node, context);
  if (node.asteriskToken) {
    emitStatic(source, '*', node, context);
  }
  if (node.expression) {
    addWhitespace(source, node, context);
    source.push(emit.call(this, node.expression, context));
  }
  endNode(node, context);
  return source.join('');
}

export function emitMetaProperty(this: any, node: ts.MetaProperty, context: EmitterContext): string {
  const source: string[] = [];
  switch (node.keywordToken) {
    case ts.SyntaxKind.NewKeyword:
      emitStatic(source, 'new', node, context);
      break;
    default:
      throw new Error(`Unknown meta property ${ts.SyntaxKind[node.keywordToken]}`);
  }
  emitStatic(source, '.', node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.name, context));
  endNode(node, context);
  return source.join('');
}

export function emitParenthesizedExpression(this: any, node: ts.ParenthesizedExpression,
    context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '(', node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.expression, context));
  emitStatic(source, ')', node, context);
  endNode(node, context);
  return source.join('');
}

// tslint:disable-next-line cyclomatic-complexity
export function emitCallExpression(this: any, node: ts.CallExpression, context: EmitterContext): string {
  const source: string[] = [];
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.expression, context));
  emitTypeArguments.call(this, source, node, context);
  emitStatic(source, '(', node, context);
  for (let i = 0, n = node.arguments.length; i < n; i++) {
    addLeadingComment(source, context.offset, node, context);
    addTrailingComment(source, context.offset, node, context);
    addWhitespace(source, node, context);
    source.push(emit.call(this, node.arguments[i], context));
    if ((i < n - 1) || node.arguments.hasTrailingComma) {
      emitStatic(source, ',', node, context);
    }
  }
  addLeadingComment(source, context.offset, node, context);
  addTrailingComment(source, context.offset, node, context);
  emitStatic(source, ')', node, context);
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitPropertyAccessExpression(this: any, node: ts.PropertyAccessExpression,
  context: EmitterContext): string {
  const source: string[] = [];
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.expression, context));
  emitStatic(source, '.', node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.name, context));
  endNode(node, context);
  return source.join('');
}

export function emitNonNullExpression(this: any, node: ts.NonNullExpression,
  context: EmitterContext): string {
  const source: string[] = [];
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.expression, context));
  emitStatic(source, '!', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitTypeOfExpression(this: any, node: ts.TypeOfExpression,
  context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, 'typeof', node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.expression, context));
  endNode(node, context);
  return source.join('');
}

export function emitObjectLiteralExpression(this: any, node: ts.ObjectLiteralExpression,
  context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '{', node, context);
  addTrailingComment(source, context.offset, node, context);
  addWhitespace(source, node, context);
  for (let i = 0, n = node.properties.length; i < n; i++) {
    addWhitespace(source, node, context);
    source.push(emit.call(this, node.properties[i], context));
    if ((i < n - 1) || node.properties.hasTrailingComma) {
      emitStatic(source, ',', node, context);
      addTrailingComment(source, context.offset, node, context);
    }
  }
  emitStatic(source, '}', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitShorthandPropertyAssignment(this: any, node: ts.ShorthandPropertyAssignment,
  context: EmitterContext): string {
  const source: string[] = [];
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.name, context));
  if (node.objectAssignmentInitializer) {
    emitStatic(source, '=', node, context);
    addWhitespace(source, node, context);
    source.push(emit.call(this, node.objectAssignmentInitializer, context));
  }
  endNode(node, context);
  return source.join('');
}

export function emitComputedPropertyName(this: any, node: ts.ComputedPropertyName,
  context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '[', node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.expression, context));
  emitStatic(source, ']', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitArrayLiteralExpression(this: any, node: ts.ArrayLiteralExpression,
    context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '[', node, context);
  emitElements.call(this, source, node, context);
  emitStatic(source, ']', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitPropertyAssignment(this: any, node: ts.PropertyAssignment,
  context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.name, context));
  if (node.questionToken) {
    emitStatic(source, '?', node, context);
  }
  emitStatic(source, ':', node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.initializer, context));
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitPrefixUnaryExpression(this: any, node: ts.PrefixUnaryExpression, context: EmitterContext): string {
  // tslint:disable-next-line cyclomatic-complexity
  function getPrefixUnaryOperator(): string {
    switch (node.operator) {
      case ts.SyntaxKind.PlusToken:
        return '+';
      case ts.SyntaxKind.PlusPlusToken:
        return '++';
      case ts.SyntaxKind.MinusToken:
        return '-';
      case ts.SyntaxKind.MinusMinusToken:
        return '--';
      case ts.SyntaxKind.ExclamationToken:
        return '!';
      case ts.SyntaxKind.TildeToken:
        return '~';
    }
  }
  const source: string[] = [];
  addWhitespace(source, node, context);
  source.push(getPrefixUnaryOperator());
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.operand, context));
  endNode(node, context);
  return source.join('');
}

export function emitPostfixUnaryExpression(this: any, node: ts.PostfixUnaryExpression,
    context: EmitterContext): string {
  function getPostfixUnaryOperator(): string {
    switch (node.operator) {
      case ts.SyntaxKind.PlusPlusToken:
        return '++';
      case ts.SyntaxKind.MinusMinusToken:
        return '--';
    }
  }
  const source: string[] = [];
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.operand, context));
  addWhitespace(source, node, context);
  source.push(getPostfixUnaryOperator());
  endNode(node, context);
  return source.join('');
}

export function emitArrowFunction(this: any, node: ts.ArrowFunction, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitTypeParameters.call(this, source, node, context);
  emitModifiers.call(this, source, node, context);
  const parenthesis = Boolean(node.typeParameters)
    || node.getSourceFile().getFullText()
      .substring(context.offset, node.getEnd()).trim().startsWith('(');
  if (parenthesis) {
    emitStatic(source, '(', node, context);
  }
  emitParameters.call(this, source, node, context);
  if (parenthesis) {
    emitStatic(source, ')', node, context);
  }
  if (node.type) {
    emitStatic(source, ':', node, context);
    addWhitespace(source, node, context);
    source.push(emitType(node.type, context));
  }
  emitStatic(source, '=>', node, context);
  source.push(emit.call(this, node.body, context));
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitParameter(this: any, node: ts.ParameterDeclaration, context: EmitterContext): string {
  const source: string[] = [];
  if (node.decorators) {
    node.decorators.forEach(decorator => {
      addWhitespace(source, node, context);
      source.push(emit.call(this, decorator, context));
    });
  }
  emitModifiers.call(this, source, node, context);
  if (node.dotDotDotToken) {
    emitStatic(source, '...', node, context);
  }
  addTrailingComment(source, context.offset, node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.name, context));
  if (node.questionToken) {
    emitStatic(source, '?', node, context);
  }
  if (node.type) {
    emitStatic(source, ':', node, context);
    addWhitespace(source, node, context);
    source.push(emitType(node.type, context));
  }
  if (node.initializer) {
    emitStatic(source, '=', node, context);
    addWhitespace(source, node, context);
    source.push(emit.call(this, node.initializer, context));
  }
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitBlock(this: any, node: ts.Block, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitStatic(source, '{', node, context);
  addTrailingComment(source, context.offset, node, context);
  node.statements.forEach(statement => {
    addWhitespace(source, node, context);
    source.push(emit.call(this, statement, context));
  });
  addLeadingComment(source, context.offset, node, context);
  emitStatic(source, '}', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitAsExpression(this: any, node: ts.AsExpression, context: EmitterContext): string {
  const source: string[] = [];
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.expression, context));
  emitStatic(source, 'as', node, context);
  addWhitespace(source, node, context);
  source.push(emitType(node.type, context));

  endNode(node, context);
  return source.join('');
}

export function emitBinaryExpression(this: any, node: ts.BinaryExpression, context: EmitterContext): string {
  const source: string[] = [];
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.left, context));
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.operatorToken, context));
  addTrailingComment(source, context.offset, node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.right, context));
  endNode(node, context);
  return source.join('');
}

export function emitFirstCompoundAssignment(this: any, node: ts.Token<ts.SyntaxKind.FirstCompoundAssignment>,
    context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '+=', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitAsteriskEqualsToken(this: any, node: ts.Token<ts.SyntaxKind.AsteriskEqualsToken>,
    context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '*=', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitLessThanLessThanToken(this: any, node: ts.Token<ts.SyntaxKind.LessThanLessThanToken>,
    context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '<<', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitSlashToken(this: any, node: ts.Token<ts.SyntaxKind.SlashToken>,
    context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '/', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitGreaterThanGreaterThanGreaterThanEqualsToken(this: any,
    node: ts.Token<ts.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken>, context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '>>>=', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitPercentToken(this: any, node: ts.Token<ts.SyntaxKind.PercentToken>,
    context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '%', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitPercentEqualsToken(this: any, node: ts.Token<ts.SyntaxKind.PercentEqualsToken>,
    context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '%=', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitSlashEqualsToken(this: any, node: ts.Token<ts.SyntaxKind.SlashEqualsToken>,
    context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '/=', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitLessThanEqualsToken(this: any, node: ts.Token<ts.SyntaxKind.LessThanEqualsToken>,
    context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '<=', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitLessThanLessThanEqualsToken(this: any, node: ts.Token<ts.SyntaxKind.LessThanLessThanEqualsToken>,
    context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '<<=', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitGreaterThanGreaterThanEqualsToken(this: any,
    node: ts.Token<ts.SyntaxKind.GreaterThanGreaterThanEqualsToken>, context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '>>=', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitBarEqualsToken(this: any, node: ts.Token<ts.SyntaxKind.BarEqualsToken>,
    context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '|=', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitAmpersandEqualsToken(this: any, node: ts.Token<ts.SyntaxKind.AmpersandEqualsToken>,
    context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '&=', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitAmpersandToken(this: any, node: ts.Token<ts.SyntaxKind.AmpersandToken>,
    context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '&', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitCaretToken(this: any, node: ts.Token<ts.SyntaxKind.CaretToken>,
    context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '^', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitMinusToken(this: any, node: ts.Token<ts.SyntaxKind.MinusToken>,
    context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '-', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitLastBinaryOperator(this: any, node: ts.Token<ts.SyntaxKind.LastBinaryOperator>,
    context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '^=', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitPlusToken(this: any, node: ts.Token<ts.SyntaxKind.PlusToken>, context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '+', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitMinusEqualsToken(this: any, node: ts.Token<ts.SyntaxKind.MinusEqualsToken>,
    context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '-=', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitAsteriskToken(this: any, node: ts.Token<ts.SyntaxKind.AsteriskToken>,
    context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '*', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitEqualsEqualsToken(this: any, node: ts.Token<ts.SyntaxKind.EqualsEqualsToken>,
    context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '==', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitEqualsEqualsEqualsToken(this: any, node: ts.Token<ts.SyntaxKind.EqualsEqualsEqualsToken>,
    context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '===', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitExclamationEqualsToken(this: any, node: ts.Token<ts.SyntaxKind.ExclamationEqualsToken>,
    context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '!=', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitExclamationEqualsEqualsToken(this: any, node: ts.Token<ts.SyntaxKind.ExclamationEqualsEqualsToken>,
    context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '!==', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitCommaToken(this: any, node: ts.Token<ts.SyntaxKind.CommaToken>,
    context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, ',', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitGreaterThanToken(this: any, node: ts.Token<ts.SyntaxKind.GreaterThanToken>,
    context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '>', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitGreaterThanGreaterThanToken(this: any, node: ts.Token<ts.SyntaxKind.GreaterThanGreaterThanToken>,
    context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '>>', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitGreaterThanGreaterThanGreaterThanToken(this: any,
    node: ts.Token<ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken>, context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '>>>', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitBarToken(this: any, node: ts.Token<ts.SyntaxKind.BarToken>,
    context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '|', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitBarBarToken(this: any, node: ts.Token<ts.SyntaxKind.BarBarToken>,
    context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '||', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitAmpersandAmpersandToken(this: any, node: ts.Token<ts.SyntaxKind.AmpersandAmpersandToken>,
    context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '&&', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitAsteriskAsteriskToken(this: any, node: ts.Token<ts.SyntaxKind.AsteriskAsteriskToken>,
    context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '**', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitFirstBinaryOperator(this: any, node: ts.Token<ts.SyntaxKind.FirstBinaryOperator>,
    context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '<', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitLastTypeNode(this: any, node: ts.LiteralTypeNode, context: EmitterContext): string {
  const source: string[] = [];
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.literal, context));
  endNode(node, context);
  return source.join('');
}

export function emitIdentifier(this: any, node: ts.Identifier, context: EmitterContext): string {
  const source: string[] = [];
  addWhitespace(source, node, context);
  const literal = node.getSourceFile().getFullText().substring(node.getStart(), node.getEnd()).trim();
  source.push(literal);
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitTypeAliasDeclaration(this: any, node: ts.TypeAliasDeclaration, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitModifiers.call(this, source, node, context);
  emitStatic(source, 'type', node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.name, context));
  emitTypeParameters.call(this, source, node, context);
  emitStatic(source, '=', node, context);
  addWhitespace(source, node, context);
  source.push(emitType(node.type, context));
  addSemicolon(source, node, context);
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitTypeParameter(this: any, node: ts.TypeParameterDeclaration, context: EmitterContext): string {
  const source: string[] = [];
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.name, context));
  if (node.constraint) {
    emitStatic(source, 'extends', node, context);
    addWhitespace(source, node, context);
    source.push(emit.call(this, node.constraint, context));
  }
  if (node.default) {
    emitStatic(source, '=', node, context);
    addWhitespace(source, node, context);
    source.push(emit.call(this, node.default, context));
  }
  endNode(node, context);
  return source.join('');
}

export function emitTypeQuery(this: any, node: ts.TypeQueryNode, context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, 'typeof', node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.exprName, context));
  return source.join('');
}

export function emitTypeOperator(this: any, node: ts.TypeOperatorNode, context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, 'keyof', node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.type, context));
  endNode(node, context);
  return source.join('');
}

export function emitIntersectionType(this: any, node: ts.IntersectionTypeNode, context: EmitterContext): string {
  const source: string[] = [];
  for (let i = 0, n = node.types.length; i < n; i++) {
    const type = node.types[i];
    addWhitespace(source, node, context);
    source.push(emitType(type, context));
    if ((i < n - 1)) {
      emitStatic(source, '&', node, context);
    }
  }
  endNode(node, context);
  return source.join('');
}

export function emitThisType(this: any, node: ts.ThisTypeNode, context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, 'this', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitArrayType(this: any, node: ts.ArrayTypeNode, context: EmitterContext): string {
  const source: string[] = [];
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.elementType, context));
  emitStatic(source, '[', node, context);
  emitStatic(source, ']', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitIndexedAccessType(this: any, node: ts.IndexedAccessTypeNode, context: EmitterContext): string {
  const source: string[] = [];
  addWhitespace(source, node, context);
  source.push(emitType(node.objectType, context));
  emitStatic(source, '[', node, context);
  addWhitespace(source, node, context);
  source.push(emitType(node.indexType, context));
  emitStatic(source, ']', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitSpreadElement(this: any, node: ts.SpreadElement, context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '...', node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.expression, context));
  endNode(node, context);
  return source.join('');
}

export function emitSpreadAssignment(this: any, node: ts.SpreadAssignment, context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '...', node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.expression, context));
  endNode(node, context);
  return source.join('');
}

export function emitIndexSignature(this: any, node: ts.IndexSignatureDeclaration, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitModifiers.call(this, source, node, context);
  emitStatic(source, '[', node, context);
  emitParameters.call(this, source, node, context);
  emitStatic(source, ']', node, context);
  if (node.type) {
    emitStatic(source, ':', node, context);
    addWhitespace(source, node, context);
    source.push(emitType(node.type, context));
  }
  addSemicolon(source, node, context);
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitRegularExpressionLiteral(this: any, node: ts.RegularExpressionLiteral,
    context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, node.text, node, context);
  endNode(node, context);
  return source.join('');
}

export function emitTupleType(this: any, node: ts.TupleTypeNode, context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '[', node, context);
  for (let i = 0, n = node.elementTypes.length; i < n; i++) {
    addWhitespace(source, node, context);
    source.push(emit.call(this, node.elementTypes[i], context));
    if (i < n - 1) {
      emitStatic(source, ',', node, context);
    }
  }
  emitStatic(source, ']', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitFunctionType(this: any, node: ts.FunctionTypeNode, context: EmitterContext): string {
  const source: string[] = [];
  if (node.name !== undefined) {
    addWhitespace(source, node, context);
    source.push(emit.call(this, node.name, context));
  }
  emitTypeParameters.call(this, source, node, context);
  emitStatic(source, '(', node, context);
  emitParameters.call(this, source, node, context);
  emitStatic(source, ')', node, context);
  if (node.type) {
    emitStatic(source, '=>', node, context);
    addWhitespace(source, node, context);
    source.push(emit.call(this, node.type, context));
  }
  endNode(node, context);
  return source.join('');
}

export function emitTypeLiteral(this: any, node: ts.TypeLiteralNode, context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '{', node, context);
  if (node.members !== undefined) {
    for (let i = 0, n = node.members.length; i < n; i++) {
      addWhitespace(source, node, context);
      source.push(emit.call(this, node.members[i], context));
    }
  }
  emitStatic(source, '}', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitStringLiteral(this: any, node: ts.StringLiteral, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  addWhitespace(source, node, context);
  const literal = node.getSourceFile().getFullText().substring(node.getStart(), node.getEnd()).trim();
  source.push(literal);
  endNode(node, context);
  return source.join('');
}

export function emitFirstLiteralToken(this: any, node: ts.NumericLiteral, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  addWhitespace(source, node, context);
  source.push(node.getSourceFile().getFullText().substring(node.getStart(), node.getEnd()));
  endNode(node, context);
  return source.join('');
}

export function emitTaggedTemplateExpression(this: any, node: ts.TaggedTemplateExpression,
    context: EmitterContext): string {
  const source: string[] = [];
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.tag, context));
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.template, context));
  endNode(node, context);
  return source.join('');
}

export function emitTemplateExpression(this: any, node: ts.TemplateExpression,
    context: EmitterContext): string {
  const source: string[] = [];
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.head, context));
  node.templateSpans.forEach(span => {
    addWhitespace(source, node, context);
    source.push(emit.call(this, span, context));
  });
  endNode(node, context);
  return source.join('');
}

export function emitTemplateHead(this: any, node: ts.TemplateHead,
    context: EmitterContext): string {
  const source: string[] = [];
  const literal = node.getSourceFile().getFullText().substring(node.getStart(), node.getEnd()).trim();
  source.push(literal);
  endNode(node, context);
  return source.join('');
}

export function emitTemplateSpan(this: any, node: ts.TemplateSpan,
    context: EmitterContext): string {
  const source: string[] = [];
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.expression, context));
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.literal, context));
  endNode(node, context);
  return source.join('');
}

export function emitTemplateMiddle(this: any, node: ts.TemplateMiddle,
    context: EmitterContext): string {
  const source: string[] = [];
  const literal = node.getSourceFile().getFullText().substring(node.getStart(), node.getEnd()).trim();
  source.push(literal);
  endNode(node, context);
  return source.join('');
}

export function emitLastTemplateToken(this: any, node: ts.LiteralLikeNode,
    context: EmitterContext): string {
  const source: string[] = [];
  const literal = node.getSourceFile().getFullText().substring(node.getStart(), node.getEnd()).trim();
  source.push(literal);
  endNode(node, context);
  return source.join('');
}

export function emitFirstTemplateToken(this: any, node: ts.LiteralLikeNode, context: EmitterContext): string {
  const source: string[] = [];
  addWhitespace(source, node, context);
  const literal = node.getSourceFile().getFullText().substring(node.getStart(), node.getEnd()).trim();
  source.push(literal);
  endNode(node, context);
  return source.join('');
}

export function emitFirstAssignment(this: any, node: ts.Node, context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '=', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitParenthesizedType(this: any, node: ts.ParenthesizedTypeNode, context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '(', node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.type, context));
  emitStatic(source, ')', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitJsxElement(this: any, node: ts.JsxElement, context: EmitterContext): string {
  const source: string[] = [];
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.openingElement, context));
  for (let i = 0, n = node.children.length; i < n; i++) {
    const child = node.children[i];
    addWhitespace(source, child, context);
    source.push(emit.call(this, child, context));
  }
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.closingElement, context));
  endNode(node, context);
  return source.join('');
}

export function emitJsxSelfClosingElement(this: any, node: ts.JsxSelfClosingElement, context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '<', node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.tagName, context));
  source.push(emit.call(this, node.attributes, context));
  emitStatic(source, '/>', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitJsxOpeningElement(this: any, node: ts.JsxOpeningElement, context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '<', node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.tagName, context));
  source.push(emit.call(this, node.attributes, context));
  emitStatic(source, '>', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitJsxAttributes(this: any, node: ts.JsxAttributes, context: EmitterContext): string {
  const source: string[] = [];
  node.properties.forEach(property => {
    addWhitespace(source, property, context);
    source.push(emit.call(this, property, context));
  });
  endNode(node, context);
  return source.join('');
}

export function emitJsxAttribute(this: any, node: ts.JsxAttribute, context: EmitterContext): string {
  const source: string[] = [];
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.name, context));
  emitStatic(source, '=', node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.initializer, context));
  endNode(node, context);
  return source.join('');
}

export function emitJsxText(this: any, node: ts.JsxText, context: EmitterContext): string {
  const source: string[] = [];
  const text = node.getSourceFile().getFullText().substring(node.getStart(), node.getEnd());
  emitStatic(source, text, node, context);
  endNode(node, context);
  return source.join('');
}

export function emitJsxExpression(this: any, node: ts.JsxExpression, context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '{', node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.expression, context));
  emitStatic(source, '}', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitJsxClosingElement(this: any, node: ts.JsxClosingElement, context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '</', node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.tagName, context));
  emitStatic(source, '>', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitTrueKeyword(this: any, node: ts.Node, context: EmitterContext): string {
  return _emitKeyword('true', node, context);
}

export function emitUndefinedKeyword(this: any, node: ts.Node, context: EmitterContext): string {
  return _emitKeyword('undefined', node, context);
}

export function emitFalseKeyword(this: any, node: ts.Node, context: EmitterContext): string {
  return _emitKeyword('false', node, context);
}

export function emitSuperKeyword(this: any, node: ts.Node, context: EmitterContext): string {
  return _emitKeyword('super', node, context);
}

export function emitExportKeyword(this: any, node: ts.Node, context: EmitterContext): string {
  return _emitKeyword('export', node, context);
}

export function emitThisKeyword(this: any, node: ts.Node, context: EmitterContext): string {
  return _emitKeyword('this', node, context);
}

export function emitDeclareKeyword(this: any, node: ts.Node, context: EmitterContext): string {
  return _emitKeyword('declare', node, context);
}

export function emitAbstractKeyword(this: any, node: ts.Node, context: EmitterContext): string {
  return _emitKeyword('abstract', node, context);
}

export function emitNullKeyword(this: any, node: ts.Node, context: EmitterContext): string {
  return _emitKeyword('null', node, context);
}

export function emitDefaultKeyword(this: any, node: ts.Node, context: EmitterContext): string {
  return _emitKeyword('default', node, context);
}

export function emitReadonlyKeyword(this: any, node: ts.Node, context: EmitterContext): string {
  return _emitKeyword('readonly', node, context);
}

export function emitPrivateKeyword(this: any, node: ts.Node, context: EmitterContext): string {
  return _emitKeyword('private', node, context);
}

export function emitProtectedKeyword(this: any, node: ts.Node, context: EmitterContext): string {
  return _emitKeyword('protected', node, context);
}

export function emitPublicKeyword(this: any, node: ts.Node, context: EmitterContext): string {
  return _emitKeyword('public', node, context);
}

export function emitStaticKeyword(this: any, node: ts.Node, context: EmitterContext): string {
  return _emitKeyword('static', node, context);
}

export function emitAnyKeyword(this: any, node: ts.Node, context: EmitterContext): string {
  return _emitKeyword('any', node, context);
}

export function emitAsyncKeyword(this: any, node: ts.Node, context: EmitterContext): string {
  return _emitKeyword('async', node, context);
}

export function emitInstanceOfKeyword(this: any, node: ts.Node, context: EmitterContext): string {
  return _emitKeyword('instanceof', node, context);
}

export function emitNumberKeyword(this: any, node: ts.Node, context: EmitterContext): string {
  return _emitKeyword('number', node, context);
}

export function emitInKeyword(this: any, node: ts.Node, context: EmitterContext): string {
  return _emitKeyword('in', node, context);
}

export function emitSymbolKeyword(this: any, node: ts.Node, context: EmitterContext): string {
  return _emitKeyword('symbol', node, context);
}

export function emitStringKeyword(this: any, node: ts.Node, context: EmitterContext): string {
  return _emitKeyword('string', node, context);
}

export function emitEnumKeyword(this: any, node: ts.Node, context: EmitterContext): string {
  return _emitKeyword('enum', node, context);
}

export function emitConstKeyword(this: any, node: ts.Node, context: EmitterContext): string {
  return _emitKeyword('const', node, context);
}

export function emitBooleanKeyword(this: any, node: ts.Node, context: EmitterContext): string {
  return _emitKeyword('boolean', node, context);
}

export function emitVoidKeyword(this: any, node: ts.Node, context: EmitterContext): string {
  return _emitKeyword('void', node, context);
}

function _emitKeyword(this: any, keyword: string, node: ts.Node, context: EmitterContext): string {
  const source: string[] = [];
  addWhitespace(source, node, context);
  source.push(keyword);
  context.offset += keyword.length;
  return source.join('');
}
