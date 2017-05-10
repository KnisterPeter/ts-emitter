import * as ts from 'typescript';

import { emitType } from './types';
import { addWhitespace, emitStatic, addLeadingComment, addTrailingComment } from './utils';

export interface EmitterContext {
  sourceFile: ts.SourceFile;
  offset: number;
}

export function emit(this: any, node: ts.Node, context: EmitterContext): string {
  const emitterFunction = `emit${ts.SyntaxKind[node.kind]}`;
  if (this[emitterFunction] !== undefined) {
    return this[emitterFunction](node, context);
  }
  throw new Error(`Unknown node kind ${ts.SyntaxKind[node.kind]}`);
}

export function emitSourceFile(this: any, node: ts.SourceFile, context: EmitterContext): string {
  const source: string[] = [];
  node.forEachChild(child => {
    addWhitespace(source, node, context);
    source.push(emit.call(this, child, context));
  });
  context.offset = node.getEnd();
  return source.join('');
}

export function emitEndOfFileToken(this: any, node: ts.EndOfFileToken, context: EmitterContext): string {
  const source: string[] = [];
  addWhitespace(source, node, context);
  context.offset = node.getEnd();
  return source.join('');
}

export function emitModuleDeclaration(this: any, node: ts.ModuleDeclaration, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  if (node.modifiers) {
    node.modifiers.forEach(modifier => {
      addWhitespace(source, node, context);
      source.push(emit.call(this, modifier, context));
    });
  }
  emitStatic(source, 'module', node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.name, context));
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.body, context));
  context.offset = node.getEnd();
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitModuleBlock(this: any, node: ts.ModuleBlock, context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '{', node, context);
  for (let i = 0, n = node.statements.length; i < n; i++) {
    addWhitespace(source, node, context);
    source.push(emit.call(this, node.statements[i], context));
  }
  emitStatic(source, '}', node, context);
  context.offset = node.getEnd();
  return source.join('');
}

export function emitImportEqualsDeclaration(this: any, node: ts.ImportEqualsDeclaration,
    context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitStatic(source, 'import', node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.name, context));
  emitStatic(source, '=', node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.moduleReference, context));
  if (context.sourceFile.text.substring(context.offset).startsWith(';')) {
    emitStatic(source, ';', node, context);
  }
  context.offset = node.getEnd();
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
  context.offset = node.getEnd();
  return source.join('');
}

export function emitFirstNode(this: any, node: ts.QualifiedName, context: EmitterContext): string {
  const source: string[] = [];
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.left, context));
  emitStatic(source, '.', node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.right, context));
  context.offset = node.getEnd();
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
  if (context.sourceFile.text.substring(context.offset).startsWith(';')) {
    emitStatic(source, ';', node, context);
  }
  context.offset = node.getEnd();
  return source.join('');
}

export function emitImportClause(this: any, node: ts.ImportClause, context: EmitterContext): string {
  const source: string[] = [];
  if (node.namedBindings) {
    addWhitespace(source, node, context);
    source.push(emit.call(this, node.namedBindings, context));
  }
  if (node.name) {
    addWhitespace(source, node, context);
    source.push(emit.call(this, node.name, context));
  }
  context.offset = node.getEnd();
  return source.join('');
}

export function emitNamespaceImport(this: any, node: ts.NamespaceImport, context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '* as ', node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.name, context));
  context.offset = node.getEnd();
  return source.join('');
}

export function emitNamedImports(this: any, node: ts.NamedImports, context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '{', node, context);
  for (let i = 0, n = node.elements.length; i < n; i++) {
    addWhitespace(source, node, context);
    source.push(emit.call(this, node.elements[i], context));
    if ((i < n - 1) || node.elements.hasTrailingComma) {
      emitStatic(source, ',', node, context);
    }
  }
  emitStatic(source, '}', node, context);
  context.offset = node.getEnd();
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
  context.offset = node.getEnd();
  return source.join('');
}

export function emitExportDeclaration(this: any, node: ts.ExportDeclaration, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitStatic(source, 'export', node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.exportClause, context));
  if (node.moduleSpecifier) {
    emitStatic(source, 'from', node, context);
    addWhitespace(source, node, context);
    source.push(emit.call(this, node.moduleSpecifier, context));
  }
  if (context.sourceFile.text.substring(context.offset).startsWith(';')) {
    emitStatic(source, ';', node, context);
  }
  context.offset = node.getEnd();
  return source.join('');
}

export function emitNamedExports(this: any, node: ts.NamedExports, context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '{', node, context);
  for (let i = 0, n = node.elements.length; i < n; i++) {
    addWhitespace(source, node, context);
    source.push(emit.call(this, node.elements[i], context));
    if ((i < n - 1) || node.elements.hasTrailingComma) {
      emitStatic(source, ',', node, context);
    }
  }
  emitStatic(source, '}', node, context);
  context.offset = node.getEnd();
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
  context.offset = node.getEnd();
  return source.join('');
}

export function emitExportAssignment(this: any, node: ts.ExportAssignment, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitStatic(source, 'export default', node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.expression, context));
  if (context.sourceFile.text.substring(context.offset).startsWith(';')) {
    emitStatic(source, ';', node, context);
  }
  context.offset = node.getEnd();
  return source.join('');
}

// tslint:disable-next-line cyclomatic-complexity
export function emitInterfaceDeclaration(this: any, node: ts.InterfaceDeclaration, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  if (node.modifiers) {
    node.modifiers.forEach(modifier => {
      addWhitespace(source, node, context);
      source.push(emit.call(this, modifier, context));
    });
  }
  emitStatic(source, 'interface', node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.name, context));
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
  if (node.heritageClauses) {
    emitStatic(source, 'extends', node, context);
    for (let i = 0, n = node.heritageClauses.length; i < n; i++) {
      addWhitespace(source, node, context);
      source.push(emit.call(this, node.heritageClauses[i], context));
      if ((i < n - 1) || node.heritageClauses.hasTrailingComma) {
        emitStatic(source, ',', node, context);
      }
    }
  }
  emitStatic(source, '{', node, context);
  node.members.forEach(member => {
    addWhitespace(source, node, context);
    source.push(emit.call(this, member, context));
  });
  emitStatic(source, '}', node, context);
  context.offset = node.getEnd();
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitConstructSignature(this: any, node: ts.ConstructSignatureDeclaration,
    context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitStatic(source, 'new', node, context);
  emitStatic(source, '(', node, context);
  for (let i = 0, n = node.parameters.length; i < n; i++) {
    addWhitespace(source, node, context);
    source.push(emit.call(this, node.parameters[i], context));
    if ((i < n - 1) || node.parameters.hasTrailingComma) {
      emitStatic(source, ',', node, context);
    }
  }
  emitStatic(source, ')', node, context);
  if (node.type) {
    emitStatic(source, ':', node, context);
    addWhitespace(source, node, context);
    source.push(emitType(node.type, context));
  }
  if (context.sourceFile.text.substring(context.offset).startsWith(';')) {
    emitStatic(source, ';', node, context);
  }
  context.offset = node.getEnd();
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitCallSignature(this: any, node: ts.CallSignatureDeclaration, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitStatic(source, '(', node, context);
  for (let i = 0, n = node.parameters.length; i < n; i++) {
    addWhitespace(source, node, context);
    source.push(emit.call(this, node.parameters[i], context));
    if ((i < n - 1) || node.parameters.hasTrailingComma) {
      emitStatic(source, ',', node, context);
    }
  }
  emitStatic(source, ')', node, context);
  if (node.type) {
    emitStatic(source, ':', node, context);
    addWhitespace(source, node, context);
    source.push(emitType(node.type, context));
  }
  if (context.sourceFile.text.substring(context.offset).startsWith(';')) {
    emitStatic(source, ';', node, context);
  }
  context.offset = node.getEnd();
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
  if (context.sourceFile.text.substring(context.offset).startsWith(';')) {
    emitStatic(source, ';', node, context);
  }
  context.offset = node.getEnd();
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
  emitStatic(source, '(', node, context);
  for (let i = 0, n = node.parameters.length; i < n; i++) {
    addWhitespace(source, node, context);
    source.push(emit.call(this, node.parameters[i], context));
    if ((i < n - 1) || node.parameters.hasTrailingComma) {
      emitStatic(source, ',', node, context);
    }
  }
  emitStatic(source, ')', node, context);
  if (node.type) {
    emitStatic(source, ':', node, context);
    addWhitespace(source, node.name, context);
    source.push(emitType(node.type, context));
  }
  if (context.sourceFile.text.substring(context.offset).startsWith(';')) {
    emitStatic(source, ';', node, context);
  }
  context.offset = node.getEnd();
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitClassDeclaration(this: any, node: ts.ClassDeclaration, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  if (node.modifiers) {
    node.modifiers.forEach(modifier => {
      addWhitespace(source, node, context);
      source.push(emit.call(this, modifier, context));
    });
  }
  emitStatic(source, 'class', node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.name, context));
  if (node.heritageClauses) {
    emitStatic(source, 'extends', node, context);
    for (let i = 0, n = node.heritageClauses.length; i < n; i++) {
      addWhitespace(source, node, context);
      source.push(emit.call(this, node.heritageClauses[i], context));
      if ((i < n - 1) || node.heritageClauses.hasTrailingComma) {
        emitStatic(source, ',', node, context);
      }
    }
  }
  emitStatic(source, '{', node, context);
  node.members.forEach(member => {
    addWhitespace(source, node, context);
    source.push(emit.call(this, member, context));
  });
  emitStatic(source, '}', node, context);
  context.offset = node.getEnd();
  addTrailingComment(source, node, context);
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
  context.offset = node.getEnd();
  return source.join('');
}

export function emitExpressionWithTypeArguments(this: any, node: ts.ExpressionWithTypeArguments,
  context: EmitterContext): string {
  const source: string[] = [];
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.expression, context));
  context.offset = node.getEnd();
  return source.join('');
}

export function emitConstructor(this: any, node: ts.ConstructorDeclaration, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitStatic(source, 'constructor', node, context);
  emitStatic(source, '(', node, context);
  for (let i = 0, n = node.parameters.length; i < n; i++) {
    const parameter = node.parameters[i];
    if (parameter.modifiers) {
      parameter.modifiers.forEach(modifier => {
        addWhitespace(source, node, context);
        source.push(emit.call(this, modifier, context));
      });
    }
    if (parameter.dotDotDotToken) {
      emitStatic(source, '...', node, context);
    }
    addWhitespace(source, node, context);
    source.push(emit.call(this, parameter, context));
    if ((i < n - 1) || node.parameters.hasTrailingComma) {
      emitStatic(source, ',', node, context);
    }
  }
  emitStatic(source, ')', node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.body, context));
  context.offset = node.getEnd();
  return source.join('');
}

// tslint:disable-next-line cyclomatic-complexity
export function emitPropertyDeclaration(this: any, node: ts.PropertyDeclaration, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  if (node.modifiers) {
    for (let i = 0, n = node.modifiers.length; i < n; i++) {
      addWhitespace(source, node, context);
      source.push(emit.call(this, node.modifiers[i], context));
      if ((i < n - 1) || node.modifiers.hasTrailingComma) {
        emitStatic(source, ',', node, context);
      }
    }
  }
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
  emitStatic(source, ';', node, context);
  context.offset = node.getEnd();
  return source.join('');
}

// tslint:disable-next-line cyclomatic-complexity
export function emitMethodDeclaration(this: any, node: ts.MethodDeclaration, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  if (node.modifiers) {
    node.modifiers.forEach(modifier => {
      addWhitespace(source, node, context);
      source.push(emit.call(this, modifier, context));
    });
  }
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.name, context));
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
  emitStatic(source, '(', node, context);
  for (let i = 0, n = node.parameters.length; i < n; i++) {
    addWhitespace(source, node, context);
    source.push(emit.call(this, node.parameters[i], context));
    if ((i < n - 1) || node.parameters.hasTrailingComma) {
      emitStatic(source, ',', node, context);
    }
  }
  emitStatic(source, ')', node, context);
  if (node.type) {
    emitStatic(source, ':', node, context);
    addWhitespace(source, node, context);
    source.push(emitType(node.type, context));
  }
  if (node.body) {
    addWhitespace(source, node, context);
    source.push(emit.call(this, node.body, context));
  }
  if (context.sourceFile.text.substring(context.offset).startsWith(';')) {
    emitStatic(source, ';', node, context);
  }
  context.offset = node.getEnd();
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitVariableStatement(this: any, node: ts.VariableStatement, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  node.forEachChild(child => {
    addWhitespace(source, node, context);
    source.push(emit.call(this, child, context));
  });
  if (context.sourceFile.text.substring(context.offset).startsWith(';')) {
    emitStatic(source, ';', node, context);
  }
  context.offset = node.getEnd();
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitBreakStatement(this: any, node: ts.BreakStatement, context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, 'break', node, context);
  if (node.label) {
    addWhitespace(source, node, context);
    source.push(emit.call(this, node.label, context));
  }
  if (context.sourceFile.text.substring(context.offset).startsWith(';')) {
    emitStatic(source, ';', node, context);
  }
  context.offset = node.getEnd();
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
  context.offset = node.getEnd();
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
  context.offset = node.getEnd();
  return source.join('');
}

export function emitCaseClause(this: any, node: ts.CaseClause, context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, 'case', node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.expression, context));
  emitStatic(source, ':', node, context);
  for (let i = 0, n = node.statements.length; i < n; i++) {
    addWhitespace(source, node, context);
    source.push(emit.call(this, node.statements[i], context));
  }
  context.offset = node.getEnd();
  return source.join('');
}

export function emitDefaultClause(this: any, node: ts.DefaultClause, context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, 'default', node, context);
  emitStatic(source, ':', node, context);
  for (let i = 0, n = node.statements.length; i < n; i++) {
    addWhitespace(source, node, context);
    source.push(emit.call(this, node.statements[i], context));
  }
  context.offset = node.getEnd();
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
  context.offset = node.getEnd();
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
  context.offset = node.getEnd();
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
  if (context.sourceFile.text.substring(context.offset).startsWith(';')) {
    emitStatic(source, ';', node, context);
  }
  context.offset = node.getEnd();
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
  context.offset = node.getEnd();
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
  context.offset = node.getEnd();
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
  context.offset = node.getEnd();
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
  context.offset = node.getEnd();
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitExpressionStatement(this: any, node: ts.ExpressionStatement, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.expression, context));
  if (context.sourceFile.text.substring(context.offset).startsWith(';')) {
    emitStatic(source, ';', node, context);
  }
  context.offset = node.getEnd();
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitReturnStatement(this: any, node: ts.ReturnStatement, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitStatic(source, 'return', node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.expression, context));
  if (context.sourceFile.text.substring(context.offset).startsWith(';')) {
    emitStatic(source, ';', node, context);
  }
  context.offset = node.getEnd();
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
  context.offset = node.getEnd();
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
  context.offset = node.getEnd();
  return source.join('');
}

export function emitEmptyStatement(this: any, node: ts.EmptyStatement, context: EmitterContext): string {
  const source: string[] = [];
  context.offset = node.getEnd();
  return source.join('');
}

export function emitThrowStatement(this: any, node: ts.ThrowStatement, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitStatic(source, 'throw', node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.expression, context));
  if (context.sourceFile.text.substring(context.offset).startsWith(';')) {
    emitStatic(source, ';', node, context);
  }
  context.offset = node.getEnd();
  return source.join('');
}

export function emitNewExpression(this: any, node: ts.NewExpression, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitStatic(source, 'new', node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.expression, context));
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
  context.offset = node.getEnd();
  return source.join('');
}

export function emitElementAccessExpression(this: any, node: ts.ElementAccessExpression,
    context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.expression, context));
  emitStatic(source, '[', node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.argumentExpression, context));
  emitStatic(source, ']', node, context);
  context.offset = node.getEnd();
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitVariableDeclarationList(this: any, node: ts.VariableDeclarationList,
  context: EmitterContext): string {
  const source: string[] = [];
  switch (node.flags) {
    case ts.NodeFlags.Const:
      emitStatic(source, 'const', node, context);
      break;
    case ts.NodeFlags.Let:
      emitStatic(source, 'let', node, context);
      break;
    default:
      emitStatic(source, 'var', node, context);
  }
  addTrailingComment(source, context.offset, node, context);
  for (let i = 0, n = node.declarations.length; i < n; i++) {
    addWhitespace(source, node, context);
    source.push(emit.call(this, node.declarations[i], context));
    if ((i < n - 1) || node.declarations.hasTrailingComma) {
      emitStatic(source, ',', node, context);
    }
  }
  context.offset = node.getEnd();
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
  context.offset = node.getEnd();
  return source.join('');
}

// tslint:disable-next-line cyclomatic-complexity
export function emitFunctionDeclaration(this: any, node: ts.FunctionDeclaration, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  if (node.modifiers) {
    node.modifiers.forEach(modifier => {
      addWhitespace(source, node, context);
      source.push(emit.call(this, modifier, context));
    });
  }
  emitStatic(source, 'function', node, context);
  if (node.asteriskToken) {
    emitStatic(source, '*', node, context);
  }
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.name, context));
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
  emitStatic(source, '(', node, context);
  for (let i = 0, n = node.parameters.length; i < n; i++) {
    addWhitespace(source, node, context);
    source.push(emit.call(this, node.parameters[i], context));
    if ((i < n - 1) || node.parameters.hasTrailingComma) {
      emitStatic(source, ',', node, context);
    }
  }
  emitStatic(source, ')', node, context);
  if (node.type !== undefined) {
    emitStatic(source, ':', node, context);
    addWhitespace(source, node, context);
    source.push(emitType(node.type, context));
  }
  if (node.body) {
    addWhitespace(source, node, context);
    source.push(emit.call(this, node.body, context));
  }
  if (context.sourceFile.text.substring(context.offset).startsWith(';')) {
    emitStatic(source, ';', node, context);
  }
  context.offset = node.getEnd();
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitFunctionExpression(this: any, node: ts.FunctionExpression, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitStatic(source, 'function', node, context);
  if (node.name) {
    addWhitespace(source, node, context);
    source.push(emit.call(this, node.name, context));
  }
  emitStatic(source, '(', node, context);
  for (let i = 0, n = node.parameters.length; i < n; i++) {
    addWhitespace(source, node, context);
    source.push(emit.call(this, node.parameters[i], context));
    if ((i < n - 1) || node.parameters.hasTrailingComma) {
      emitStatic(source, ',', node, context);
    }
  }
  emitStatic(source, ')', node, context);
  if (node.type !== undefined) {
    emitStatic(source, ':', node, context);
    addWhitespace(source, node, context);
    source.push(emitType(node.type, context));
  }
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.body, context));
  context.offset = node.getEnd();
  return source.join('');
}

export function emitYieldExpression(this: any, node: ts.YieldExpression, context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, 'yield', node, context);
  if (node.expression) {
    addWhitespace(source, node, context);
    source.push(emit.call(this, node.expression, context));
  }
  context.offset = node.getEnd();
  return source.join('');
}

export function emitParenthesizedExpression(this: any, node: ts.ParenthesizedExpression,
    context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '(', node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.expression, context));
  emitStatic(source, ')', node, context);
  context.offset = node.getEnd();
  return source.join('');
}

export function emitCallExpression(this: any, node: ts.CallExpression, context: EmitterContext): string {
  const source: string[] = [];
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.expression, context));
  emitStatic(source, '(', node, context);
  for (let i = 0, n = node.arguments.length; i < n; i++) {
    addWhitespace(source, node, context);
    source.push(emit.call(this, node.arguments[i], context));
    if ((i < n - 1) || node.arguments.hasTrailingComma) {
      emitStatic(source, ',', node, context);
    }
  }
  emitStatic(source, ')', node, context);
  context.offset = node.getEnd();
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
  context.offset = node.getEnd();
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
    }
  }
  emitStatic(source, '}', node, context);
  context.offset = node.getEnd();
  return source.join('');
}

export function emitArrayLiteralExpression(this: any, node: ts.ArrayLiteralExpression,
    context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '[', node, context);
  for (let i = 0, n = node.elements.length; i < n; i++) {
    addWhitespace(source, node, context);
    source.push(emit.call(this, node.elements[i], context));
    if ((i < n - 1) || node.elements.hasTrailingComma) {
      emitStatic(source, ',', node, context);
    }
  }
  emitStatic(source, ']', node, context);
  context.offset = node.getEnd();
  return source.join('');
}

export function emitPropertyAssignment(this: any, node: ts.PropertyAssignment,
  context: EmitterContext): string {
  const source: string[] = [];
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.name, context));
  emitStatic(source, ':', node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.initializer, context));
  context.offset = node.getEnd();
  return source.join('');
}

export function emitPrefixUnaryExpression(this: any, node: ts.PrefixUnaryExpression, context: EmitterContext): string {
  function getPrefixUnaryOperator(): string {
    switch (node.operator) {
      case ts.SyntaxKind.PlusPlusToken:
        return '++';
      case ts.SyntaxKind.MinusToken:
        return '-';
      case ts.SyntaxKind.ExclamationToken:
        return '!';
    }
    throw new Error(`Unknown operator ${ts.SyntaxKind[node.operator]}`);
  }
  const source: string[] = [];
  addWhitespace(source, node, context);
  source.push(getPrefixUnaryOperator());
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.operand, context));
  context.offset = node.getEnd();
  return source.join('');
}

export function emitPostfixUnaryExpression(this: any, node: ts.PostfixUnaryExpression,
    context: EmitterContext): string {
  function getPostfixUnaryOperator(): string {
    switch (node.operator) {
      case ts.SyntaxKind.PlusPlusToken:
        return '++';
    }
    throw new Error(`Unknown operator ${ts.SyntaxKind[node.operator]}`);
  }
  const source: string[] = [];
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.operand, context));
  addWhitespace(source, node, context);
  source.push(getPostfixUnaryOperator());
  context.offset = node.getEnd();
  return source.join('');
}

export function emitArrowFunction(this: any, node: ts.ArrowFunction, context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '(', node, context);
  for (let i = 0, n = node.parameters.length; i < n; i++) {
    addWhitespace(source, node, context);
    source.push(emit.call(this, node.parameters[i], context));
    if ((i < n - 1) || node.parameters.hasTrailingComma) {
      emitStatic(source, ',', node, context);
    }
  }
  emitStatic(source, ')', node, context);
  emitStatic(source, '=>', node, context);
  source.push(emit.call(this, node.body, context));
  return source.join('');
}

export function emitParameter(this: any, node: ts.ParameterDeclaration, context: EmitterContext): string {
  const source: string[] = [];
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.name, context));
  if (node.type) {
    emitStatic(source, ':', node, context);
    addWhitespace(source, node, context);
    source.push(emitType(node.type, context));
  }
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
  emitStatic(source, '}', node, context);
  context.offset = node.getEnd();
  return source.join('');
}

export function emitBinaryExpression(this: any, node: ts.BinaryExpression, context: EmitterContext): string {
  const source: string[] = [];
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.left, context));
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.operatorToken, context));
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.right, context));
  context.offset = node.getEnd();
  return source.join('');
}

export function emitPlusToken(this: any, node: ts.Token<ts.SyntaxKind.PlusToken>, context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '+', node, context);
  context.offset = node.getEnd();
  return source.join('');
}

export function emitAsteriskToken(this: any, node: ts.Token<ts.SyntaxKind.AsteriskToken>,
    context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '*', node, context);
  context.offset = node.getEnd();
  return source.join('');
}

export function emitFirstBinaryOperator(this: any, node: ts.Token<ts.SyntaxKind.FirstBinaryOperator>,
    context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '<', node, context);
  context.offset = node.getEnd();
  return source.join('');
}

export function emitIdentifier(this: any, node: ts.Identifier, context: EmitterContext): string {
  const source: string[] = [];
  addWhitespace(source, node, context);
  source.push(node.text);
  context.offset = node.getEnd();
  return source.join('');
}

// tslint:disable-next-line cyclomatic-complexity
export function emitTypeAliasDeclaration(this: any, node: ts.TypeAliasDeclaration, context: EmitterContext): string {
  const source: string[] = [];
  if (node.modifiers) {
    node.modifiers.forEach(modifier => {
      addWhitespace(source, node, context);
      source.push(emit.call(this, modifier, context));
    });
  }
  emitStatic(source, 'type', node, context);
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.name, context));
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
  emitStatic(source, '=', node, context);
  addWhitespace(source, node, context);
  source.push(emitType(node.type, context));
  if (context.sourceFile.text.substring(context.offset).startsWith(';')) {
    emitStatic(source, ';', node, context);
  }
  context.offset = node.getEnd();
  return source.join('');
}

export function emitTypeParameter(this: any, node: ts.TypeParameterDeclaration, context: EmitterContext): string {
  const source: string[] = [];
  addWhitespace(source, node, context);
  source.push(emit.call(this, node.name, context));
  context.offset = node.getEnd();
  return source.join('');
}

export function emitIndexSignature(this: any, node: ts.IndexSignatureDeclaration, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitStatic(source, '[', node, context);
  for (let i = 0, n = node.parameters.length; i < n; i++) {
    addWhitespace(source, node, context);
    source.push(emit.call(this, node.parameters[i], context));
    if ((i < n - 1) || node.parameters.hasTrailingComma) {
      emitStatic(source, ',', node, context);
    }
  }
  emitStatic(source, ']', node, context);
  if (node.type) {
    emitStatic(source, ':', node, context);
    addWhitespace(source, node, context);
    source.push(emitType(node.type, context));
  }
  if (context.sourceFile.text.substring(context.offset).startsWith(';')) {
    emitStatic(source, ';', node, context);
  }
  context.offset = node.getEnd();
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitStringLiteral(this: any, node: ts.StringLiteral, context: EmitterContext): string {
  const source: string[] = [];
  addWhitespace(source, node, context);
  const literal = context.sourceFile.text.substring(node.pos, node.getEnd()).trim();
  source.push(literal.substr(0, 1));
  source.push(node.text);
  source.push(literal.substr(-1));
  context.offset = node.getEnd();
  return source.join('');
}

export function emitFirstLiteralToken(this: any, node: ts.LiteralExpression, context: EmitterContext): string {
  const source: string[] = [];
  addWhitespace(source, node, context);
  source.push(node.text);
  context.offset = node.getEnd();
  return source.join('');
}

export function emitFirstAssignment(this: any, node: ts.Node, context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '=', node, context);
  context.offset = node.getEnd();
  return source.join('');
}
export function emitTrueKeyword(this: any, node: ts.Node, context: EmitterContext): string {
  return _emitKeyword('true', node, context);
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

function _emitKeyword(this: any, keyword: string, node: ts.Node, context: EmitterContext): string {
  const source: string[] = [];
  addWhitespace(source, node, context);
  source.push(keyword);
  context.offset = node.getEnd();
  return source.join('');
}
