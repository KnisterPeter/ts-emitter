import * as ts from 'typescript';

import {
  addWhitespace,
  emitStatic,
  addLeadingComment,
  addTrailingComment,
  addSemicolon,
  addComma,
  endNode,
  addLeadingAmpersand,
  addLeadingBar,
  getSourceFile
} from './utils';

export interface EmitterContext {
  offset: number;
}

// tslint:disable-next-line cyclomatic-complexity
function emitStatement(node: ts.Statement, context: EmitterContext): string {
  switch (node.kind) {
    case ts.SyntaxKind.ImportDeclaration:
      return emitImportDeclaration(node as ts.ImportDeclaration, context);
    case ts.SyntaxKind.ImportEqualsDeclaration:
      return emitImportEqualsDeclaration(node as ts.ImportEqualsDeclaration, context);
    case ts.SyntaxKind.VariableStatement:
      return emitVariableStatement(node as ts.VariableStatement, context);
    case ts.SyntaxKind.ExportDeclaration:
      return emitExportDeclaration(node as ts.ExportDeclaration, context);
    case ts.SyntaxKind.ExportAssignment:
      return emitExportAssignment(node as ts.ExportAssignment, context);
    case ts.SyntaxKind.NamespaceExportDeclaration:
      return emitNamespaceExportDeclaration(node as ts.NamespaceExportDeclaration, context);
    case ts.SyntaxKind.ExpressionStatement:
      return emitExpressionStatement(node as ts.ExpressionStatement, context);
    case ts.SyntaxKind.FunctionDeclaration:
      return emitFunctionDeclaration(node as ts.FunctionDeclaration, context);
    case ts.SyntaxKind.ClassDeclaration:
      return emitClassDeclaration(node as ts.ClassDeclaration, context);
    case ts.SyntaxKind.TypeAliasDeclaration:
      return emitTypeAliasDeclaration(node as ts.TypeAliasDeclaration, context);
    case ts.SyntaxKind.InterfaceDeclaration:
      return emitInterfaceDeclaration(node as ts.InterfaceDeclaration, context);
    case ts.SyntaxKind.ForInStatement:
      return emitForInStatement(node as ts.ForInStatement, context);
    case ts.SyntaxKind.ForOfStatement:
      return emitForOfStatement(node as ts.ForOfStatement, context);
    case ts.SyntaxKind.ForStatement:
      return emitForStatement(node as ts.ForStatement, context);
    case ts.SyntaxKind.WithStatement:
      return emitWithStatement(node as ts.WithStatement, context);
    case ts.SyntaxKind.ModuleDeclaration:
      return emitModuleDeclaration(node as ts.ModuleDeclaration, context);
    case ts.SyntaxKind.WhileStatement:
      return emitWhileStatement(node as ts.WhileStatement, context);
    case ts.SyntaxKind.EnumDeclaration:
      return emitEnumDeclaration(node as ts.EnumDeclaration, context);
    case ts.SyntaxKind.DoStatement:
      return emitDoStatement(node as ts.DoStatement, context);
    case ts.SyntaxKind.EmptyStatement:
      return emitEmptyStatement(node as ts.EmptyStatement, context);
    case ts.SyntaxKind.IfStatement:
      return emitIfStatement(node as ts.IfStatement, context);
    case ts.SyntaxKind.SwitchStatement:
      return emitSwitchStatement(node as ts.SwitchStatement, context);
    case ts.SyntaxKind.BreakStatement:
      return emitBreakStatement(node as ts.BreakStatement, context);
    case ts.SyntaxKind.LabeledStatement:
      return emitLabeledStatement(node as ts.LabeledStatement, context);
    case ts.SyntaxKind.ContinueStatement:
      return emitContinueStatement(node as ts.ContinueStatement, context);
    case ts.SyntaxKind.ReturnStatement:
      return emitReturnStatement(node as ts.ReturnStatement, context);
    case ts.SyntaxKind.TryStatement:
      return emitTryStatement(node as ts.TryStatement, context);
    case ts.SyntaxKind.DebuggerStatement:
      return emitDebuggerStatement(node as ts.DebuggerStatement, context);
    case ts.SyntaxKind.Block:
      return emitBlock(node as ts.Block, context);
    case ts.SyntaxKind.ThrowStatement:
      return emitThrowStatement(node as ts.ThrowStatement, context);
    default:
      throw new Error(`Unknown statement kind '${ts.SyntaxKind[node.kind]}'`);
  }
}

interface StatementsNode extends ts.Node {
  statements?: ts.NodeArray<ts.Statement>;
}

// tslint:disable-next-line cyclomatic-complexity
function emitStatements<T extends StatementsNode>(source: string[], node: T, context: EmitterContext): void {
  if (node.statements) {
    for (let i = 0, n = node.statements.length; i < n; i++) {
      const statement = node.statements[i];
      addWhitespace(source, statement, context);
      source.push(emitStatement(statement, context));
    }
  }
}

interface ElementsNode extends ts.Node {
  elements?: ts.NodeArray<ts.Node>;
}

function emitElements<T extends ElementsNode>(source: string[], node: T, context: EmitterContext): void {
  addLeadingComment(source, context.offset, node, context);
  if (node.elements) {
    for (let i = 0, n = node.elements.length; i < n; i++) {
      addLeadingComment(source, context.offset, node, context);
      addTrailingComment(source, context.offset, node, context);
      const element = node.elements[i];
      addWhitespace(source, element, context);
      source.push(emit(element, context));
      addLeadingComment(source, context.offset, node, context);
      addTrailingComment(source, context.offset, node, context);
      if ((i < n - 1) || node.elements.hasTrailingComma) {
        emitStatic(source, ',', node, context);
        addTrailingComment(source, context.offset, node, context);
      }
    }
  }
  addLeadingComment(source, context.offset, node, context);
  addTrailingComment(source, context.offset, node, context);
}

interface TypedNode extends ts.Node {
  typeParameters?: ts.NodeArray<ts.Node>;
}

function emitTypeParameters<T extends TypedNode>(source: string[], node: T, context: EmitterContext): void {
  if (node.typeParameters) {
    emitStatic(source, '<', node, context);
    for (let i = 0, n = node.typeParameters.length; i < n; i++) {
      addTrailingComment(source, context.offset, node, context);
      addWhitespace(source, node, context);
      source.push(emit(node.typeParameters[i], context));
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

function emitTypeArguments<T extends TypeArgumentedNode>(source: string[], node: T, context: EmitterContext): void {
  if (node.typeArguments) {
    emitStatic(source, '<', node, context);
    for (let i = 0, n = node.typeArguments.length; i < n; i++) {
      addWhitespace(source, node, context);
      source.push(emit(node.typeArguments[i], context));
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

function emitParameters<T extends NodeWithParameters>(source: string[], node: T, context: EmitterContext): void {
  addLeadingComment(source, context.offset, node, context);
  if (node.parameters) {
    for (let i = 0, n = node.parameters.length; i < n; i++) {
      addTrailingComment(source, context.offset, node, context);
      addLeadingComment(source, context.offset, node, context);
      addWhitespace(source, node, context);
      source.push(emit(node.parameters[i], context));
      addLeadingComment(source, context.offset, node, context);
      if ((i < n - 1) || node.parameters.hasTrailingComma) {
        emitStatic(source, ',', node, context);
      }
      addLeadingComment(source, context.offset, node, context);
    }
  }
  addLeadingComment(source, context.offset, node, context);
  addTrailingComment(source, context.offset, node, context);
}

interface NodeWithModifiers extends ts.Node {
  parameters?: ts.NodeArray<ts.Node>;
}

function emitModifiers<T extends NodeWithModifiers>(source: string[], node: T, context: EmitterContext): void {
  if (node.modifiers) {
    node.modifiers.forEach(modifier => {
      addWhitespace(source, node, context);
      source.push(emit(modifier, context));
    });
  }
}

function emitShebang(node: ts.SourceFile, context: EmitterContext): string {
  const source: string[] = [];
  const filePrefix = ts.getShebang(getSourceFile(node).getFullText());
  if (filePrefix) {
    source.push(filePrefix);
    context.offset += filePrefix.length;
  }
  return source.join('');
}

export function emit(node: ts.Node, context: EmitterContext): string {
  if (emitter[node.kind]) {
    return (emitter as any)[node.kind](node, context);
  }
  throw new Error(`Unknown node kind ${ts.SyntaxKind[node.kind]}`);
}

export function emitSourceFile(node: ts.SourceFile, context: EmitterContext): string {
  const source: string[] = [];
  source.push(emitShebang(node, context));
  emitStatements(source, node, context);
  addWhitespace(source, node, context);
  source.push(emitEndOfFileToken(node.endOfFileToken, context));
  endNode(node, context);
  return source.join('');
}

export function emitEndOfFileToken(node: ts.EndOfFileToken, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  addWhitespace(source, node, context);
  endNode(node, context);
  return source.join('');
}

export function emitEnumDeclaration(node: ts.EnumDeclaration, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitModifiers(source, node, context);
  source.push(emitEnumKeyword(node, context));
  addWhitespace(source, node, context);
  source.push(emitIdentifier(node.name, context));
  emitStatic(source, '{', node, context);
  addTrailingComment(source, context.offset, node, context);
  if (node.members) {
    for (let i = 0, n = node.members.length; i < n; i++) {
      addWhitespace(source, node, context);
      source.push(emitEnumMember(node.members[i], context));
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

export function emitEnumMember(node: ts.EnumMember, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  addWhitespace(source, node, context);
  source.push(emitPropertName(node.name, context));
  if (node.initializer) {
    emitStatic(source, '=', node, context);
    addWhitespace(source, node, context);
    source.push(emitExpression(node.initializer, context));
  }
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

function emitExpression(node: ts.Expression, context: EmitterContext): string {
  // tslint:disable-next-line cyclomatic-complexity
  switch (node.kind) {
    case ts.SyntaxKind.NonNullExpression:
      return emitNonNullExpression(node as ts.NonNullExpression, context);
    case ts.SyntaxKind.TemplateExpression:
      return emitTemplateExpression(node as ts.TemplateExpression, context);
    case ts.SyntaxKind.OmittedExpression:
      return emitOmittedExpression(node as ts.OmittedExpression, context);
    case ts.SyntaxKind.SpreadElement:
      return emitSpreadElement(node as ts.SpreadElement, context);
    case ts.SyntaxKind.VoidExpression:
      return emitVoidExpression(node as ts.VoidExpression, context);
    case ts.SyntaxKind.FirstTemplateToken:
      return emitFirstTemplateToken(node, context);
    case ts.SyntaxKind.JsxElement:
      return emitJsxElement(node as ts.JsxElement, context);
    case ts.SyntaxKind.JsxSelfClosingElement:
      return emitJsxSelfClosingElement(node as ts.JsxSelfClosingElement, context);
    case ts.SyntaxKind.ClassExpression:
      return emitClassExpression(node as ts.ClassExpression, context);
    case ts.SyntaxKind.Identifier:
      return emitIdentifier(node as ts.Identifier, context);
    case ts.SyntaxKind.RegularExpressionLiteral:
      return emitRegularExpressionLiteral(node as ts.RegularExpressionLiteral, context);
    case ts.SyntaxKind.PostfixUnaryExpression:
      return emitPostfixUnaryExpression(node as ts.PostfixUnaryExpression, context);
    case ts.SyntaxKind.YieldExpression:
      return emitYieldExpression(node as ts.YieldExpression, context);
    case ts.SyntaxKind.ObjectLiteralExpression:
      return emitObjectLiteralExpression(node as ts.ObjectLiteralExpression, context);
    case ts.SyntaxKind.DeleteExpression:
      return emitDeleteExpression(node as ts.DeleteExpression, context);
    case ts.SyntaxKind.ConditionalExpression:
      return emitConditionalExpression(node as ts.ConditionalExpression, context);
    case ts.SyntaxKind.AwaitExpression:
      return emitAwaitExpression(node as ts.AwaitExpression, context);
    case ts.SyntaxKind.NewExpression:
      return emitNewExpression(node as ts.NewExpression, context);
    case ts.SyntaxKind.FunctionExpression:
      return emitFunctionExpression(node as ts.FunctionExpression, context);
    case ts.SyntaxKind.ArrayLiteralExpression:
      return emitArrayLiteralExpression(node as ts.ArrayLiteralExpression, context);
    case ts.SyntaxKind.TypeOfExpression:
      return emitTypeOfExpression(node as ts.TypeOfExpression, context);
    case ts.SyntaxKind.ArrowFunction:
      return emitArrowFunction(node as ts.ArrowFunction, context);
    case ts.SyntaxKind.AsExpression:
      return emitAsExpression(node as ts.AsExpression, context);
    case ts.SyntaxKind.MetaProperty:
      return emitMetaProperty(node as ts.MetaProperty, context);
    case ts.SyntaxKind.TaggedTemplateExpression:
      return emitTaggedTemplateExpression(node as ts.TaggedTemplateExpression, context);
    case ts.SyntaxKind.TypeAssertionExpression:
      return emitTypeAssertionExpression(node as ts.TypeAssertion, context);
    case ts.SyntaxKind.StringLiteral:
      return emitStringLiteral(node as ts.StringLiteral, context);
    case ts.SyntaxKind.FirstLiteralToken:
      // todo: check if ts.NumericLiteral is correct
      return emitFirstLiteralToken(node as ts.NumericLiteral, context);
    case ts.SyntaxKind.BinaryExpression:
      return emitBinaryExpression(node as ts.BinaryExpression, context);
    case ts.SyntaxKind.NullKeyword:
      return emitNullKeyword(node, context);
    case ts.SyntaxKind.ThisKeyword:
      return emitThisKeyword(node, context);
    case ts.SyntaxKind.TrueKeyword:
      return emitTrueKeyword(node, context);
    case ts.SyntaxKind.FalseKeyword:
      return emitFalseKeyword(node, context);
    case ts.SyntaxKind.PrefixUnaryExpression:
      return emitPrefixUnaryExpression(node as ts.PrefixUnaryExpression, context);
    case ts.SyntaxKind.PropertyAccessExpression:
      return emitPropertyAccessExpression(node as ts.PropertyAccessExpression, context);
    case ts.SyntaxKind.CallExpression:
      return emitCallExpression(node as ts.CallExpression, context);
    case ts.SyntaxKind.ElementAccessExpression:
      return emitElementAccessExpression(node as ts.ElementAccessExpression, context);
    case ts.SyntaxKind.ParenthesizedExpression:
      return emitParenthesizedExpression(node as ts.ParenthesizedExpression, context);
    default:
      throw new Error(`Unknown Expression kind '${ts.SyntaxKind[node.kind]}'`);
  }
}

function emitPropertName(node: ts.PropertyName, context: EmitterContext): string {
  switch (node.kind) {
    case ts.SyntaxKind.Identifier:
      return emitIdentifier(node, context);
    case ts.SyntaxKind.StringLiteral:
      return emitStringLiteral(node, context);
    case ts.SyntaxKind.ComputedPropertyName:
      return emitComputedPropertyName(node, context);
    case ts.SyntaxKind.FirstLiteralToken:
      return emitFirstLiteralToken(node, context);
    default:
      throw new Error(`Unknown PropertyName kind '${ts.SyntaxKind[(node as any).kind]}'`);
  }
}

export function emitModuleDeclaration(node: ts.ModuleDeclaration, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitModifiers(source, node, context);
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
  source.push(emitModuleName(node.name, context));
  addWhitespace(source, node, context);
  if (node.body) {
    source.push(emit(node.body, context));
  }
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitModuleName(node: ts.ModuleName, context: EmitterContext): string {
  switch (node.kind) {
    case ts.SyntaxKind.Identifier:
      return emitIdentifier(node, context);
    case ts.SyntaxKind.StringLiteral:
      return emitStringLiteral(node, context);
  }
}

export function emitModuleBlock(node: ts.ModuleBlock, context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '{', node, context);
  addTrailingComment(source, context.offset, node, context);
  emitStatements(source, node, context);
  addLeadingComment(source, context.offset, node, context);
  emitStatic(source, '}', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitImportEqualsDeclaration(node: ts.ImportEqualsDeclaration,
    context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitModifiers(source, node, context);
  emitStatic(source, 'import', node, context);
  addWhitespace(source, node, context);
  source.push(emitIdentifier(node.name, context));
  emitStatic(source, '=', node, context);
  addWhitespace(source, node, context);
  source.push(emit(node.moduleReference, context));
  addSemicolon(source, node, context);
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitExternalModuleReference(node: ts.ExternalModuleReference,
    context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitStatic(source, 'require', node, context);
  emitStatic(source, '(', node, context);
  addWhitespace(source, node, context);
  if (node.expression) {
    source.push(emitExpression(node.expression, context));
  }
  emitStatic(source, ')', node, context);
  endNode(node, context);
  return source.join('');
}

function emitQualifiedName(node: ts.QualifiedName, context: EmitterContext): string {
  const source: string[] = [];
  addWhitespace(source, node, context);
  source.push(emitEntityName(node.left, context));
  emitStatic(source, '.', node, context);
  addWhitespace(source, node, context);
  source.push(emitIdentifier(node.right, context));
  endNode(node, context);
  return source.join('');
}

function emitEntityName(node: ts.EntityName, context: EmitterContext): string {
  switch (node.kind) {
    case ts.SyntaxKind.Identifier:
      return emitIdentifier(node, context);
    case ts.SyntaxKind.QualifiedName:
      return emitQualifiedName(node, context);
  }
}

export function emitFirstNode(node: ts.QualifiedName, context: EmitterContext): string {
  const source: string[] = [];
  addWhitespace(source, node, context);
  source.push(emitEntityName(node.left, context));
  emitStatic(source, '.', node, context);
  addWhitespace(source, node, context);
  source.push(emitIdentifier(node.right, context));
  endNode(node, context);
  return source.join('');
}

export function emitImportDeclaration(node: ts.ImportDeclaration, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitStatic(source, 'import', node, context);
  if (node.importClause) {
    addWhitespace(source, node, context);
    source.push(emitImportClause(node.importClause, context));
    emitStatic(source, 'from', node, context);
  }
  addWhitespace(source, node, context);
  source.push(emitExpression(node.moduleSpecifier, context));
  addSemicolon(source, node, context);
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitImportClause(node: ts.ImportClause, context: EmitterContext): string {
  const source: string[] = [];
  if (node.name) {
    addWhitespace(source, node, context);
    source.push(emitIdentifier(node.name, context));
    if (node.namedBindings) {
      emitStatic(source, ',', node, context);
    }
  }
  if (node.namedBindings) {
    addWhitespace(source, node, context);
    source.push(emit(node.namedBindings, context));
  }
  endNode(node, context);
  return source.join('');
}

export function emitNamespaceImport(node: ts.NamespaceImport, context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '* as ', node, context);
  addWhitespace(source, node, context);
  source.push(emitIdentifier(node.name, context));
  endNode(node, context);
  return source.join('');
}

export function emitNamedImports(node: ts.NamedImports, context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '{', node, context);
  emitElements(source, node, context);
  emitStatic(source, '}', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitImportSpecifier(node: ts.ImportSpecifier, context: EmitterContext): string {
  const source: string[] = [];
  if (node.propertyName) {
    addWhitespace(source, node, context);
    source.push(emitIdentifier(node.propertyName, context));
    emitStatic(source, 'as', node, context);
  }
  addWhitespace(source, node, context);
  source.push(emitIdentifier(node.name, context));
  endNode(node, context);
  return source.join('');
}

export function emitNamespaceExportDeclaration(node: ts.NamespaceExportDeclaration,
    context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitStatic(source, 'export', node, context);
  emitStatic(source, 'as', node, context);
  emitStatic(source, 'namespace', node, context);
  addWhitespace(source, node, context);
  source.push(emitIdentifier(node.name, context));
  addSemicolon(source, node, context);
  endNode(node, context);
  return source.join('');
}

export function emitExportDeclaration(node: ts.ExportDeclaration, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  source.push(emitExportKeyword(node, context));
  addWhitespace(source, node, context);
  if (node.exportClause) {
    source.push(emitNamedExports(node.exportClause, context));
  } else {
    emitStatic(source, '*', node, context);
  }
  if (node.moduleSpecifier) {
    emitStatic(source, 'from', node, context);
    addWhitespace(source, node, context);
    source.push(emitExpression(node.moduleSpecifier, context));
  }
  addSemicolon(source, node, context);
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitNamedExports(node: ts.NamedExports, context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '{', node, context);
  emitElements(source, node, context);
  emitStatic(source, '}', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitExportSpecifier(node: ts.ExportSpecifier, context: EmitterContext): string {
  const source: string[] = [];
  if (node.propertyName) {
    addWhitespace(source, node, context);
    source.push(emitIdentifier(node.propertyName, context));
    emitStatic(source, 'as', node, context);
  }
  addWhitespace(source, node, context);
  source.push(emitIdentifier(node.name, context));
  endNode(node, context);
  return source.join('');
}

export function emitExportAssignment(node: ts.ExportAssignment, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  source.push(emitExportKeyword(node, context));
  if (node.isExportEquals) {
    emitStatic(source, '=', node, context);
  } else {
    source.push(emitDefaultKeyword(node, context));
  }
  addWhitespace(source, node, context);
  source.push(emitExpression(node.expression, context));
  addSemicolon(source, node, context);
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitInterfaceDeclaration(node: ts.InterfaceDeclaration, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitModifiers(source, node, context);
  emitStatic(source, 'interface', node, context);
  addWhitespace(source, node, context);
  source.push(emitIdentifier(node.name, context));
  emitTypeParameters(source, node, context);
  if (node.heritageClauses) {
    emitStatic(source, 'extends', node, context);
    for (let i = 0, n = node.heritageClauses.length; i < n; i++) {
      addWhitespace(source, node, context);
      source.push(emitHeritageClause(node.heritageClauses[i], context));
    }
  }
  addTrailingComment(source, context.offset, node, context);
  emitStatic(source, '{', node, context);
  addTrailingComment(source, context.offset, node, context);
  node.members.forEach(member => {
    addWhitespace(source, node, context);
    source.push(emit(member, context));
    addTrailingComment(source, context.offset, node, context);
  });
  addLeadingComment(source, context.offset, node, context);
  emitStatic(source, '}', node, context);
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

function emitTypeNode(node: ts.TypeNode, context: EmitterContext): string {
  // tslint:disable-next-line cyclomatic-complexity
  switch (node.kind) {
    case ts.SyntaxKind.FirstTypeNode:
      return emitFirstTypeNode(node as ts.TypePredicateNode, context);
    case ts.SyntaxKind.LastTypeNode:
      return emitLastTypeNode(node as ts.LiteralTypeNode, context);
    case ts.SyntaxKind.FunctionType:
      return emitFunctionType(node as ts.FunctionTypeNode, context);
    case ts.SyntaxKind.TypeReference:
      return emitTypeReference(node as ts.TypeReferenceNode, context);
    case ts.SyntaxKind.StringKeyword:
      return emitStringKeyword(node, context);
    case ts.SyntaxKind.AnyKeyword:
      return emitAnyKeyword(node, context);
    case ts.SyntaxKind.VoidKeyword:
      return emitVoidKeyword(node, context);
    case ts.SyntaxKind.NullKeyword:
      return emitNullKeyword(node, context);
    case ts.SyntaxKind.UndefinedKeyword:
      return emitUndefinedKeyword(node, context);
    case ts.SyntaxKind.SymbolKeyword:
      return emitSymbolKeyword(node, context);
    case ts.SyntaxKind.NumberKeyword:
      return emitNumberKeyword(node, context);
    case ts.SyntaxKind.BooleanKeyword:
      return emitBooleanKeyword(node, context);
    case ts.SyntaxKind.ObjectKeyword:
      return emitObjectKeyword(node as ts.KeywordTypeNode, context);
    case ts.SyntaxKind.NeverKeyword:
      return emitNeverKeyword(node as ts.KeywordTypeNode, context);
    case ts.SyntaxKind.ThisType:
      return emitThisType(node as ts.ThisTypeNode, context);
    case ts.SyntaxKind.ParenthesizedType:
      return emitParenthesizedType(node as ts.ParenthesizedTypeNode, context);
    case ts.SyntaxKind.ConstructorType:
      return emitConstructorType(node as ts.ConstructorTypeNode, context);
    case ts.SyntaxKind.TypeLiteral:
      return emitTypeLiteral(node as ts.TypeLiteralNode, context);
    case ts.SyntaxKind.IndexedAccessType:
      return emitIndexedAccessType(node as ts.IndexedAccessTypeNode, context);
    case ts.SyntaxKind.TypeOperator:
      return emitTypeOperator(node as ts.TypeOperatorNode, context);
    case ts.SyntaxKind.UnionType:
      return emitUnionType(node as ts.UnionTypeNode, context);
    case ts.SyntaxKind.IntersectionType:
      return emitIntersectionType(node as ts.IntersectionTypeNode, context);
    case ts.SyntaxKind.TypeQuery:
      return emitTypeQuery(node as ts.TypeQueryNode, context);
    case ts.SyntaxKind.ArrayType:
      return emitArrayType(node as ts.ArrayTypeNode, context);
    case ts.SyntaxKind.TupleType:
      return emitTupleType(node as ts.TupleTypeNode, context);
    case ts.SyntaxKind.MappedType:
      return emitMappedType(node as ts.MappedTypeNode, context);
    default:
      throw new Error(`Unknown TypeNode kind ${ts.SyntaxKind[node.kind]}`);
  }
}

export function emitConstructSignature(node: ts.ConstructSignatureDeclaration,
    context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitStatic(source, 'new', node, context);
  emitTypeParameters(source, node, context);
  emitStatic(source, '(', node, context);
  emitParameters(source, node, context);
  emitStatic(source, ')', node, context);
  if (node.type) {
    emitStatic(source, ':', node, context);
    addWhitespace(source, node, context);
    source.push(emitTypeNode(node.type, context));
  }
  addSemicolon(source, node, context);
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitCallSignature(node: ts.CallSignatureDeclaration, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitTypeParameters(source, node, context);
  emitStatic(source, '(', node, context);
  emitParameters(source, node, context);
  emitStatic(source, ')', node, context);
  if (node.type) {
    emitStatic(source, ':', node, context);
    addWhitespace(source, node, context);
    source.push(emitTypeNode(node.type, context));
  }
  addSemicolon(source, node, context);
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitPropertySignature(node: ts.PropertySignature, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitModifiers(source, node, context);
  addWhitespace(source, node, context);
  source.push(emitPropertName(node.name, context));
  if (node.questionToken) {
    emitStatic(source, '?', node, context);
  }
  if (node.type) {
    emitStatic(source, ':', node, context);
    addWhitespace(source, node, context);
    source.push(emitTypeNode(node.type, context));
  }
  addComma(source, node, context);
  addSemicolon(source, node, context);
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

// tslint:disable-next-line cyclomatic-complexity
export function emitMethodSignature(node: ts.MethodSignature, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  addWhitespace(source, node, context);
  source.push(emitPropertName(node.name, context));
  if (node.questionToken) {
    emitStatic(source, '?', node, context);
  }
  emitTypeParameters(source, node, context);
  emitStatic(source, '(', node, context);
  emitParameters(source, node, context);
  emitStatic(source, ')', node, context);
  if (node.type) {
    emitStatic(source, ':', node, context);
    addWhitespace(source, node, context);
    source.push(emitTypeNode(node.type, context));
  }
  addComma(source, node, context);
  addSemicolon(source, node, context);
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitTypeReference(node: ts.TypeReferenceNode, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  addWhitespace(source, node, context);
  source.push(emitEntityName(node.typeName, context));
  emitTypeArguments(source, node, context);
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitMappedType(node: ts.MappedTypeNode, context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '{', node, context);
  if (node.readonlyToken) {
    emitStatic(source, 'readonly', node, context);
  }
  if (node.typeParameter) {
    emitStatic(source, '[', node, context);
    addWhitespace(source, node, context);
    source.push(emitMappedTypeTypeParameter(node.typeParameter, context));
    emitStatic(source, ']', node, context);
  }
  if (node.questionToken) {
    emitStatic(source, '?', node, context);
  }
  if (node.type) {
    emitStatic(source, ':', node, context);
    addWhitespace(source, node, context);
    source.push(emitTypeNode(node.type, context));
    addSemicolon(source, node, context);
  }
  emitStatic(source, '}', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitMappedTypeTypeParameter(node: ts.TypeParameterDeclaration,
    context: EmitterContext): string {
  const source: string[] = [];
  addWhitespace(source, node, context);
  source.push(emitIdentifier(node.name, context));
  if (node.constraint) {
    emitStatic(source, 'in', node, context);
    addWhitespace(source, node, context);
    source.push(emitTypeNode(node.constraint, context));
  }
  endNode(node, context);
  return source.join('');
}

// tslint:disable-next-line cyclomatic-complexity
export function emitClassDeclaration(node: ts.ClassDeclaration, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  if (node.decorators) {
    node.decorators.forEach(decorator => {
      addWhitespace(source, node, context);
      source.push(emitDecorator(decorator, context));
    });
  }
  emitModifiers(source, node, context);
  emitStatic(source, 'class', node, context);
  if (node.name) {
    addWhitespace(source, node, context);
    source.push(emitIdentifier(node.name, context));
  }
  emitTypeParameters(source, node, context);
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
      source.push(emitHeritageClause(node.heritageClauses[i], context));
    }
  }
  addTrailingComment(source, context.offset, node, context);
  emitStatic(source, '{', node, context);
  addTrailingComment(source, context.offset, node, context);
  node.members.forEach(member => {
    addWhitespace(source, node, context);
    source.push(emit(member, context));
  });
  addLeadingComment(source, context.offset, node, context);
  emitStatic(source, '}', node, context);
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitDecorator(node: ts.Decorator, context: EmitterContext): string {
  const source: string[] = [];
  addWhitespace(source, node, context);
  emitStatic(source, '@', node, context);
  source.push(emit(node.expression, context));
  endNode(node, context);
  return source.join('');
}

export function emitHeritageClause(node: ts.HeritageClause, context: EmitterContext): string {
  const source: string[] = [];
  for (let i = 0, n = node.types.length; i < n; i++) {
    addWhitespace(source, node, context);
    source.push(emit(node.types[i], context));
    if ((i < n - 1) || node.types.hasTrailingComma) {
      emitStatic(source, ',', node, context);
    }
  }
  endNode(node, context);
  return source.join('');
}

export function emitExpressionWithTypeArguments(node: ts.ExpressionWithTypeArguments,
  context: EmitterContext): string {
  const source: string[] = [];
  addWhitespace(source, node, context);
  source.push(emit(node.expression, context));
  emitTypeArguments(source, node, context);
  endNode(node, context);
  return source.join('');
}

export function emitConstructor(node: ts.ConstructorDeclaration, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitModifiers(source, node, context);
  emitStatic(source, 'constructor', node, context);
  emitStatic(source, '(', node, context);
  emitParameters(source, node, context);
  emitStatic(source, ')', node, context);
  if (node.body) {
    addWhitespace(source, node, context);
    source.push(emitBlock(node.body, context));
  }
  addSemicolon(source, node, context);
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitPropertyDeclaration(node: ts.PropertyDeclaration, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  if (node.decorators) {
    node.decorators.forEach(decorator => {
      addWhitespace(source, node, context);
      source.push(emitDecorator(decorator, context));
    });
  }
  emitModifiers(source, node, context);
  addWhitespace(source, node, context);
  source.push(emitPropertName(node.name, context));
  if (node.questionToken) {
    emitStatic(source, '?', node, context);
  }
  if (node.type) {
    emitStatic(source, ':', node, context);
    addWhitespace(source, node, context);
    source.push(emitTypeNode(node.type, context));
  }
  if (node.initializer) {
    emitStatic(source, '=', node, context);
    addWhitespace(source, node, context);
    source.push(emitExpression(node.initializer, context));
  }
  addSemicolon(source, node, context);
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitGetAccessor(node: ts.GetAccessorDeclaration, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  if (node.decorators) {
    node.decorators.forEach(decorator => {
      addWhitespace(source, node, context);
      source.push(emitDecorator(decorator, context));
    });
  }
  emitModifiers(source, node, context);
  emitStatic(source, 'get', node, context);
  addWhitespace(source, node, context);
  source.push(emitPropertName(node.name, context));
  emitStatic(source, '(', node, context);
  emitParameters(source, node, context);
  emitStatic(source, ')', node, context);
  if (node.type) {
    emitStatic(source, ':', node, context);
    addWhitespace(source, node, context);
    source.push(emitTypeNode(node.type, context));
  }
  addWhitespace(source, node, context);
  if (node.body) {
    source.push(emitBlock(node.body, context));
  } else {
    addSemicolon(source, node, context);
  }
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitSetAccessor(node: ts.SetAccessorDeclaration, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  if (node.decorators) {
    node.decorators.forEach(decorator => {
      addWhitespace(source, node, context);
      source.push(emitDecorator(decorator, context));
    });
  }
  emitModifiers(source, node, context);
  emitStatic(source, 'set', node, context);
  addWhitespace(source, node, context);
  source.push(emitPropertName(node.name, context));
  emitStatic(source, '(', node, context);
  emitParameters(source, node, context);
  emitStatic(source, ')', node, context);
  if (node.type) {
    emitStatic(source, ':', node, context);
    addWhitespace(source, node, context);
    source.push(emitTypeNode(node.type, context));
  }
  addWhitespace(source, node, context);
  if (node.body) {
    source.push(emitBlock(node.body, context));
  } else {
    addSemicolon(source, node, context);
  }
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitMethodDeclaration(node: ts.MethodDeclaration, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  if (node.decorators) {
    node.decorators.forEach(decorator => {
      addWhitespace(source, node, context);
      source.push(emitDecorator(decorator, context));
    });
  }
  emitModifiers(source, node, context);
  if (node.asteriskToken) {
    emitStatic(source, '*', node, context);
  }
  addWhitespace(source, node, context);
  source.push(emitPropertName(node.name, context));
  if (node.questionToken) {
    emitStatic(source, '?', node, context);
  }
  emitTypeParameters(source, node, context);
  emitStatic(source, '(', node, context);
  emitParameters(source, node, context);
  emitStatic(source, ')', node, context);
  if (node.type) {
    emitStatic(source, ':', node, context);
    addWhitespace(source, node, context);
    source.push(emitTypeNode(node.type, context));
  }
  if (node.body) {
    addWhitespace(source, node, context);
    source.push(emitBlock(node.body, context));
  } else {
    addSemicolon(source, node, context);
  }
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitSemicolonClassElement(node: ts.SemicolonClassElement, context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, ';', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitVariableStatement(node: ts.VariableStatement, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitModifiers(source, node, context);
  source.push(emitVariableDeclarationList(node.declarationList, context));
  addSemicolon(source, node, context);
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitLabeledStatement(node: ts.LabeledStatement, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  addWhitespace(source, node, context);
  source.push(emitIdentifier(node.label, context));
  emitStatic(source, ':', node, context);
  addWhitespace(source, node, context);
  source.push(emitStatement(node.statement, context));
  endNode(node, context);
  return source.join('');
}

export function emitBreakStatement(node: ts.BreakStatement, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitStatic(source, 'break', node, context);
  if (node.label) {
    addWhitespace(source, node, context);
    source.push(emitIdentifier(node.label, context));
  }
  addSemicolon(source, node, context);
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitSwitchStatement(node: ts.SwitchStatement, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitStatic(source, 'switch', node, context);
  emitStatic(source, '(', node, context);
  addWhitespace(source, node, context);
  source.push(emitExpression(node.expression, context));
  emitStatic(source, ')', node, context);
  addWhitespace(source, node, context);
  source.push(emitCaseBlock(node.caseBlock, context));
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitCaseBlock(node: ts.CaseBlock, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitStatic(source, '{', node, context);
  for (let i = 0, n = node.clauses.length; i < n; i++) {
    addWhitespace(source, node, context);
    source.push(emit(node.clauses[i], context));
  }
  addLeadingComment(source, context.offset, node, context);
  emitStatic(source, '}', node, context);
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitCaseClause(node: ts.CaseClause, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitStatic(source, 'case', node, context);
  addWhitespace(source, node, context);
  source.push(emitExpression(node.expression, context));
  emitStatic(source, ':', node, context);
  addTrailingComment(source, context.offset, node, context);
  emitStatements(source, node, context);
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitDefaultClause(node: ts.DefaultClause, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  source.push(emitDefaultKeyword(node, context));
  emitStatic(source, ':', node, context);
  addTrailingComment(source, context.offset, node, context);
  emitStatements(source, node, context);
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitIfStatement(node: ts.IfStatement, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitStatic(source, 'if', node, context);
  emitStatic(source, '(', node, context);
  addTrailingComment(source, context.offset, node, context);
  addWhitespace(source, node, context);
  source.push(emitExpression(node.expression, context));
  emitStatic(source, ')', node, context);
  addTrailingComment(source, context.offset, node, context);
  addWhitespace(source, node, context);
  source.push(emitStatement(node.thenStatement, context));
  if (node.elseStatement) {
    addLeadingComment(source, context.offset, node, context);
    emitStatic(source, 'else', node, context);
    addTrailingComment(source, context.offset, node, context);
    addWhitespace(source, node, context);
    source.push(emitStatement(node.elseStatement, context));
  }
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitWhileStatement(node: ts.WhileStatement, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitStatic(source, 'while', node, context);
  emitStatic(source, '(', node, context);
  addWhitespace(source, node, context);
  source.push(emitExpression(node.expression, context));
  emitStatic(source, ')', node, context);
  addWhitespace(source, node, context);
  source.push(emitStatement(node.statement, context));
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitDoStatement(node: ts.DoStatement, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitStatic(source, 'do', node, context);
  addWhitespace(source, node, context);
  source.push(emitStatement(node.statement, context));
  emitStatic(source, 'while', node, context);
  emitStatic(source, '(', node, context);
  addWhitespace(source, node, context);
  source.push(emitExpression(node.expression, context));
  emitStatic(source, ')', node, context);
  addSemicolon(source, node, context);
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitForStatement(node: ts.ForStatement, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitStatic(source, 'for', node, context);
  emitStatic(source, '(', node, context);
  addTrailingComment(source, context.offset, node, context);
  if (node.initializer) {
    addWhitespace(source, node, context);
    source.push(emit(node.initializer, context));
  }
  addTrailingComment(source, context.offset, node, context);
  emitStatic(source, ';', node, context);
  addTrailingComment(source, context.offset, node, context);
  if (node.condition) {
    addWhitespace(source, node, context);
    source.push(emitExpression(node.condition, context));
  }
  addTrailingComment(source, context.offset, node, context);
  emitStatic(source, ';', node, context);
  addTrailingComment(source, context.offset, node, context);
  if (node.incrementor) {
    addWhitespace(source, node, context);
    source.push(emitExpression(node.incrementor, context));
  }
  emitStatic(source, ')', node, context);
  addWhitespace(source, node, context);
  source.push(emitStatement(node.statement, context));
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitForInStatement(node: ts.ForInStatement, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitStatic(source, 'for', node, context);
  emitStatic(source, '(', node, context);
  addWhitespace(source, node, context);
  source.push(emit(node.initializer, context));
  emitStatic(source, 'in', node, context);
  addWhitespace(source, node, context);
  source.push(emitExpression(node.expression, context));
  emitStatic(source, ')', node, context);
  addWhitespace(source, node, context);
  source.push(emitStatement(node.statement, context));
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitForOfStatement(node: ts.ForOfStatement, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitStatic(source, 'for', node, context);
  if (node.awaitModifier) {
    emitStatic(source, 'await', node, context);
  }
  emitStatic(source, '(', node, context);
  addWhitespace(source, node, context);
  source.push(emit(node.initializer, context));
  emitStatic(source, 'of', node, context);
  addWhitespace(source, node, context);
  source.push(emitExpression(node.expression, context));
  emitStatic(source, ')', node, context);
  addWhitespace(source, node, context);
  source.push(emitStatement(node.statement, context));
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitWithStatement(node: ts.WithStatement, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitStatic(source, 'with', node, context);
  emitStatic(source, '(', node, context);
  addWhitespace(source, node, context);
  source.push(emitExpression(node.expression, context));
  emitStatic(source, ')', node, context);
  addWhitespace(source, node, context);
  source.push(emitStatement(node.statement, context));
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitUnionType(node: ts.UnionTypeNode, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingBar(source, node, context);
  addLeadingComment(source, node, context);
  for (let i = 0, n = node.types.length; i < n; i++) {
    const type = node.types[i];
    addWhitespace(source, node, context);
    source.push(emitTypeNode(type, context));
    if ((i < n - 1) || node.types.hasTrailingComma) {
      emitStatic(source, '|', node, context);
    }
  }
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitExpressionStatement(node: ts.ExpressionStatement, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  addWhitespace(source, node, context);
  source.push(emitExpression(node.expression, context));
  addSemicolon(source, node, context);
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitReturnStatement(node: ts.ReturnStatement, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitStatic(source, 'return', node, context);
  if (node.expression) {
    addWhitespace(source, node, context);
    source.push(emitExpression(node.expression, context));
  }
  addSemicolon(source, node, context);
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitDebuggerStatement(node: ts.DebuggerStatement, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitStatic(source, 'debugger', node, context);
  addSemicolon(source, node, context);
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitTryStatement(node: ts.TryStatement, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitStatic(source, 'try', node, context);
  addWhitespace(source, node, context);
  source.push(emitBlock(node.tryBlock, context));
  if (node.catchClause) {
    addWhitespace(source, node, context);
    source.push(emitCatchClause(node.catchClause, context));
  }
  if (node.finallyBlock) {
    emitStatic(source, 'finally', node, context);
    addWhitespace(source, node, context);
    source.push(emitBlock(node.finallyBlock, context));
  }
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitCatchClause(node: ts.CatchClause, context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, 'catch', node, context);
  emitStatic(source, '(', node, context);
  addWhitespace(source, node, context);
  source.push(emitVariableDeclaration(node.variableDeclaration, context));
  emitStatic(source, ')', node, context);
  addWhitespace(source, node, context);
  source.push(emitBlock(node.block, context));
  endNode(node, context);
  return source.join('');
}

export function emitEmptyStatement(node: ts.EmptyStatement, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitStatic(source, ';', node, context);
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitContinueStatement(node: ts.ContinueStatement, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitStatic(source, 'continue', node, context);
  if (node.label) {
    addWhitespace(source, node, context);
    source.push(emitIdentifier(node.label, context));
  }
  addSemicolon(source, node, context);
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitThrowStatement(node: ts.ThrowStatement, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitStatic(source, 'throw', node, context);
  addWhitespace(source, node, context);
  source.push(emitExpression(node.expression, context));
  addSemicolon(source, node, context);
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitNewExpression(node: ts.NewExpression, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitStatic(source, 'new', node, context);
  addWhitespace(source, node, context);
  source.push(emit(node.expression, context));
  emitTypeArguments(source, node, context);
  if (getSourceFile(node).getFullText()
    .substring(context.offset, node.getEnd()).trim().startsWith('(')) {
    emitStatic(source, '(', node, context);
    addTrailingComment(source, context.offset, node, context);
    if (node.arguments) {
      for (let i = 0, n = node.arguments.length; i < n; i++) {
        addTrailingComment(source, context.offset, node, context);
        addWhitespace(source, node, context);
        source.push(emitExpression(node.arguments[i], context));
        if ((i < n - 1) || node.arguments.hasTrailingComma) {
          emitStatic(source, ',', node, context);
        }
      }
    }
    emitStatic(source, ')', node, context);
  }
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitArrayBindingPattern(node: ts.ArrayBindingPattern, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitStatic(source, '[', node, context);
  emitElements(source, node, context);
  emitStatic(source, ']', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitObjectBindingPattern(node: ts.ObjectBindingPattern, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitStatic(source, '{', node, context);
  emitElements(source, node, context);
  emitStatic(source, '}', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitBindingElement(node: ts.BindingElement, context: EmitterContext): string {
  const source: string[] = [];
  if (node.dotDotDotToken) {
    emitStatic(source, '...', node, context);
  }
  if (node.propertyName) {
    addWhitespace(source, node, context);
    source.push(emitPropertName(node.propertyName, context));
    emitStatic(source, ':', node, context);
  }
  addWhitespace(source, node, context);
  source.push(emit(node.name, context));
  if (node.initializer) {
    emitStatic(source, '=', node, context);
    addWhitespace(source, node, context);
    source.push(emitExpression(node.initializer, context));
  }
  endNode(node, context);
  return source.join('');
}

export function emitOmittedExpression(node: ts.OmittedExpression, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  addWhitespace(source, node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitAwaitExpression(node: ts.AwaitExpression, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitStatic(source, 'await', node, context);
  addWhitespace(source, node, context);
  source.push(emit(node.expression, context));
  endNode(node, context);
  return source.join('');
}

export function emitVoidExpression(node: ts.VoidExpression, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitStatic(source, 'void', node, context);
  addWhitespace(source, node, context);
  source.push(emit(node.expression, context));
  endNode(node, context);
  return source.join('');
}

export function emitDeleteExpression(node: ts.DeleteExpression, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitStatic(source, 'delete', node, context);
  addWhitespace(source, node, context);
  source.push(emit(node.expression, context));
  endNode(node, context);
  return source.join('');
}

export function emitConditionalExpression(node: ts.ConditionalExpression, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  addWhitespace(source, node, context);
  source.push(emitExpression(node.condition, context));
  addLeadingComment(source, context.offset, node, context);
  emitStatic(source, '?', node, context);
  addTrailingComment(source, context.offset, node, context);
  addWhitespace(source, node, context);
  source.push(emitExpression(node.whenTrue, context));
  addLeadingComment(source, context.offset, node, context);
  emitStatic(source, ':', node, context);
  addTrailingComment(source, context.offset, node, context);
  addWhitespace(source, node, context);
  source.push(emitExpression(node.whenFalse, context));
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitElementAccessExpression(node: ts.ElementAccessExpression,
    context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  addWhitespace(source, node, context);
  source.push(emit(node.expression, context));
  emitStatic(source, '[', node, context);
  if (node.argumentExpression) {
    addWhitespace(source, node, context);
    source.push(emitExpression(node.argumentExpression, context));
  }
  emitStatic(source, ']', node, context);
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

// tslint:disable-next-line cyclomatic-complexity
export function emitVariableDeclarationList(node: ts.VariableDeclarationList,
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
    source.push(emitVariableDeclaration(node.declarations[i], context));
    if ((i < n - 1) || node.declarations.hasTrailingComma) {
      emitStatic(source, ',', node, context);
    }
  }
  endNode(node, context);
  return source.join('');
}

export function emitVariableDeclaration(node: ts.VariableDeclaration, context: EmitterContext): string {
  const source: string[] = [];
  addWhitespace(source, node, context);
  source.push(emit(node.name, context));
  if (node.type !== undefined) {
    emitStatic(source, ':', node, context);
    addTrailingComment(source, context.offset, node, context);
    addWhitespace(source, node, context);
    source.push(emitTypeNode(node.type, context));
  }
  if (node.initializer !== undefined) {
    emitStatic(source, '=', node, context);
    addTrailingComment(source, context.offset, node, context);
    addWhitespace(source, node, context);
    source.push(emitExpression(node.initializer, context));
  }
  endNode(node, context);
  return source.join('');
}

export function emitTypeAssertionExpression(node: ts.TypeAssertion, context: EmitterContext): string {
  const source: string[] = [];

  emitStatic(source, '<', node, context);
  addWhitespace(source, node, context);
  source.push(emitTypeNode(node.type, context));
  emitStatic(source, '>', node, context);
  addWhitespace(source, node, context);
  source.push(emit(node.expression, context));

  endNode(node, context);
  return source.join('');
}

export function emitFunctionDeclaration(node: ts.FunctionDeclaration, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitModifiers(source, node, context);
  emitStatic(source, 'function', node, context);
  if (node.asteriskToken) {
    emitStatic(source, '*', node, context);
  }
  addTrailingComment(source, context.offset, node, context);
  if (node.name) {
    addWhitespace(source, node, context);
    source.push(emitIdentifier(node.name, context));
  }
  emitTypeParameters(source, node, context);
  emitStatic(source, '(', node, context);
  emitParameters(source, node, context);
  emitStatic(source, ')', node, context);
  if (node.type !== undefined) {
    emitStatic(source, ':', node, context);
    addWhitespace(source, node, context);
    source.push(emitTypeNode(node.type, context));
  }
  if (node.body) {
    addWhitespace(source, node, context);
    source.push(emitBlock(node.body, context));
  } else {
    addSemicolon(source, node, context);
  }
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitClassExpression(node: ts.ClassExpression, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitStatic(source, 'class', node, context);
  if (node.name) {
    addWhitespace(source, node, context);
    source.push(emitIdentifier(node.name, context));
  }
  emitTypeParameters(source, node, context);
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
      source.push(emitHeritageClause(node.heritageClauses[i], context));
    }
  }
  emitStatic(source, '{', node, context);
  addTrailingComment(source, context.offset, node, context);
  node.members.forEach(member => {
    addWhitespace(source, node, context);
    source.push(emit(member, context));
  });
  emitStatic(source, '}', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitFunctionExpression(node: ts.FunctionExpression, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitModifiers(source, node, context);
  emitStatic(source, 'function', node, context);
  if (node.asteriskToken) {
    emitStatic(source, '*', node, context);
  }
  if (node.name) {
    addWhitespace(source, node, context);
    source.push(emitIdentifier(node.name, context));
  }
  emitTypeParameters(source, node, context);
  emitStatic(source, '(', node, context);
  emitParameters(source, node, context);
  emitStatic(source, ')', node, context);
  if (node.type !== undefined) {
    emitStatic(source, ':', node, context);
    addWhitespace(source, node, context);
    source.push(emitTypeNode(node.type, context));
  }
  addWhitespace(source, node, context);
  source.push(emitBlock(node.body, context));
  endNode(node, context);
  return source.join('');
}

export function emitYieldExpression(node: ts.YieldExpression, context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, 'yield', node, context);
  if (node.asteriskToken) {
    emitStatic(source, '*', node, context);
  }
  if (node.expression) {
    addWhitespace(source, node, context);
    source.push(emitExpression(node.expression, context));
  }
  endNode(node, context);
  return source.join('');
}

export function emitMetaProperty(node: ts.MetaProperty, context: EmitterContext): string {
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
  source.push(emitIdentifier(node.name, context));
  endNode(node, context);
  return source.join('');
}

export function emitParenthesizedExpression(node: ts.ParenthesizedExpression,
    context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitStatic(source, '(', node, context);
  addTrailingComment(source, context.offset, node, context);
  addWhitespace(source, node, context);
  source.push(emitExpression(node.expression, context));
  emitStatic(source, ')', node, context);
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitCallExpression(node: ts.CallExpression, context: EmitterContext): string {
  const source: string[] = [];
  addWhitespace(source, node, context);
  source.push(emit(node.expression, context));
  emitTypeArguments(source, node, context);
  emitStatic(source, '(', node, context);
  for (let i = 0, n = node.arguments.length; i < n; i++) {
    addLeadingComment(source, context.offset, node, context);
    addTrailingComment(source, context.offset, node, context);
    addWhitespace(source, node, context);
    source.push(emitExpression(node.arguments[i], context));
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

export function emitPropertyAccessExpression(node: ts.PropertyAccessExpression,
  context: EmitterContext): string {
  const source: string[] = [];
  addWhitespace(source, node, context);
  source.push(emit(node.expression, context));
  emitStatic(source, '.', node, context);
  addTrailingComment(source, context.offset, node, context);
  addWhitespace(source, node, context);
  source.push(emitIdentifier(node.name, context));
  endNode(node, context);
  return source.join('');
}

export function emitNonNullExpression(node: ts.NonNullExpression,
  context: EmitterContext): string {
  const source: string[] = [];
  addWhitespace(source, node, context);
  source.push(emitExpression(node.expression, context));
  emitStatic(source, '!', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitTypeOfExpression(node: ts.TypeOfExpression,
  context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, 'typeof', node, context);
  addWhitespace(source, node, context);
  source.push(emit(node.expression, context));
  endNode(node, context);
  return source.join('');
}

export function emitObjectLiteralExpression(node: ts.ObjectLiteralExpression,
  context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '{', node, context);
  addTrailingComment(source, context.offset, node, context);
  addWhitespace(source, node, context);
  for (let i = 0, n = node.properties.length; i < n; i++) {
    addWhitespace(source, node, context);
    source.push(emit(node.properties[i], context));
    if ((i < n - 1) || node.properties.hasTrailingComma) {
      emitStatic(source, ',', node, context);
      addTrailingComment(source, context.offset, node, context);
    }
  }
  emitStatic(source, '}', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitShorthandPropertyAssignment(node: ts.ShorthandPropertyAssignment,
  context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  addWhitespace(source, node, context);
  source.push(emitIdentifier(node.name, context));
  if (node.objectAssignmentInitializer) {
    emitStatic(source, '=', node, context);
    addWhitespace(source, node, context);
    source.push(emitExpression(node.objectAssignmentInitializer, context));
  }
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitComputedPropertyName(node: ts.ComputedPropertyName,
  context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '[', node, context);
  addWhitespace(source, node, context);
  source.push(emitExpression(node.expression, context));
  emitStatic(source, ']', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitArrayLiteralExpression(node: ts.ArrayLiteralExpression,
    context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '[', node, context);
  emitElements(source, node, context);
  emitStatic(source, ']', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitPropertyAssignment(node: ts.PropertyAssignment,
  context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  addWhitespace(source, node, context);
  source.push(emitPropertName(node.name, context));
  if (node.questionToken) {
    emitStatic(source, '?', node, context);
  }
  emitStatic(source, ':', node, context);
  addTrailingComment(source, context.offset, node, context);
  addWhitespace(source, node, context);
  source.push(emitExpression(node.initializer, context));
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitPrefixUnaryExpression(node: ts.PrefixUnaryExpression, context: EmitterContext): string {
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
  addLeadingComment(source, node, context);
  addWhitespace(source, node, context);
  source.push(getPrefixUnaryOperator());
  addWhitespace(source, node, context);
  source.push(emit(node.operand, context));
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitPostfixUnaryExpression(node: ts.PostfixUnaryExpression,
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
  source.push(emit(node.operand, context));
  addWhitespace(source, node, context);
  source.push(getPostfixUnaryOperator());
  endNode(node, context);
  return source.join('');
}

export function emitArrowFunction(node: ts.ArrowFunction, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitTypeParameters(source, node, context);
  emitModifiers(source, node, context);
  addTrailingComment(source, context.offset, node, context);
  const parenthesis = Boolean(node.typeParameters)
    || node.parameters.length === 0
    || getSourceFile(node).getFullText()
      .substring(context.offset, node.getEnd()).trim().startsWith('(');
  if (parenthesis) {
    emitStatic(source, '(', node, context);
  }
  emitParameters(source, node, context);
  if (parenthesis) {
    emitStatic(source, ')', node, context);
  }
  if (node.type) {
    emitStatic(source, ':', node, context);
    addWhitespace(source, node, context);
    source.push(emitTypeNode(node.type, context));
  }
  emitStatic(source, '=>', node, context);
  source.push(emit(node.body, context));
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitParameter(node: ts.ParameterDeclaration, context: EmitterContext): string {
  const source: string[] = [];
  if (node.decorators) {
    node.decorators.forEach(decorator => {
      addWhitespace(source, node, context);
      source.push(emitDecorator(decorator, context));
    });
  }
  emitModifiers(source, node, context);
  if (node.dotDotDotToken) {
    emitStatic(source, '...', node, context);
  }
  addTrailingComment(source, context.offset, node, context);
  addWhitespace(source, node, context);
  source.push(emit(node.name, context));
  if (node.questionToken) {
    emitStatic(source, '?', node, context);
  }
  if (node.type) {
    emitStatic(source, ':', node, context);
    addWhitespace(source, node, context);
    source.push(emitTypeNode(node.type, context));
  }
  if (node.initializer) {
    emitStatic(source, '=', node, context);
    addWhitespace(source, node, context);
    source.push(emitExpression(node.initializer, context));
  }
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitBlock(node: ts.Block, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitStatic(source, '{', node, context);
  addTrailingComment(source, context.offset, node, context);
  node.statements.forEach(statement => {
    addWhitespace(source, node, context);
    source.push(emitStatement(statement, context));
  });
  addLeadingComment(source, context.offset, node, context);
  emitStatic(source, '}', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitAsExpression(node: ts.AsExpression, context: EmitterContext): string {
  const source: string[] = [];
  addWhitespace(source, node, context);
  source.push(emitExpression(node.expression, context));
  emitStatic(source, 'as', node, context);
  addWhitespace(source, node, context);
  source.push(emitTypeNode(node.type, context));

  endNode(node, context);
  return source.join('');
}

export function emitBinaryExpression(node: ts.BinaryExpression, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  addWhitespace(source, node, context);
  source.push(emitExpression(node.left, context));
  addWhitespace(source, node, context);
  source.push(emit(node.operatorToken, context));
  addTrailingComment(source, context.offset, node, context);
  addWhitespace(source, node, context);
  source.push(emitExpression(node.right, context));
  endNode(node, context);
  return source.join('');
}

function _emitToken(source: string[], token: string, node: ts.Node, context: EmitterContext): void {
  addLeadingComment(source, node, context);
  emitStatic(source, token, node, context);
}

export function emitFirstCompoundAssignment(node: ts.Token<ts.SyntaxKind.FirstCompoundAssignment>,
    context: EmitterContext): string {
  const source: string[] = [];
  _emitToken(source, '+=', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitGreaterThanEqualsToken(node: ts.Token<ts.SyntaxKind.GreaterThanEqualsToken>,
    context: EmitterContext): string {
  const source: string[] = [];
  _emitToken(source, '>=', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitAsteriskEqualsToken(node: ts.Token<ts.SyntaxKind.AsteriskEqualsToken>,
    context: EmitterContext): string {
  const source: string[] = [];
  _emitToken(source, '*=', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitLessThanLessThanToken(node: ts.Token<ts.SyntaxKind.LessThanLessThanToken>,
    context: EmitterContext): string {
  const source: string[] = [];
  _emitToken(source, '<<', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitSlashToken(node: ts.Token<ts.SyntaxKind.SlashToken>,
    context: EmitterContext): string {
  const source: string[] = [];
  _emitToken(source, '/', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitGreaterThanGreaterThanGreaterThanEqualsToken(this: any,
    node: ts.Token<ts.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken>, context: EmitterContext): string {
  const source: string[] = [];
  _emitToken(source, '>>>=', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitPercentToken(node: ts.Token<ts.SyntaxKind.PercentToken>,
    context: EmitterContext): string {
  const source: string[] = [];
  _emitToken(source, '%', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitPercentEqualsToken(node: ts.Token<ts.SyntaxKind.PercentEqualsToken>,
    context: EmitterContext): string {
  const source: string[] = [];
  _emitToken(source, '%=', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitSlashEqualsToken(node: ts.Token<ts.SyntaxKind.SlashEqualsToken>,
    context: EmitterContext): string {
  const source: string[] = [];
  _emitToken(source, '/=', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitLessThanEqualsToken(node: ts.Token<ts.SyntaxKind.LessThanEqualsToken>,
    context: EmitterContext): string {
  const source: string[] = [];
  _emitToken(source, '<=', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitLessThanLessThanEqualsToken(node: ts.Token<ts.SyntaxKind.LessThanLessThanEqualsToken>,
    context: EmitterContext): string {
  const source: string[] = [];
  _emitToken(source, '<<=', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitGreaterThanGreaterThanEqualsToken(this: any,
    node: ts.Token<ts.SyntaxKind.GreaterThanGreaterThanEqualsToken>, context: EmitterContext): string {
  const source: string[] = [];
  _emitToken(source, '>>=', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitBarEqualsToken(node: ts.Token<ts.SyntaxKind.BarEqualsToken>,
    context: EmitterContext): string {
  const source: string[] = [];
  _emitToken(source, '|=', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitAmpersandEqualsToken(node: ts.Token<ts.SyntaxKind.AmpersandEqualsToken>,
    context: EmitterContext): string {
  const source: string[] = [];
  _emitToken(source, '&=', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitAmpersandToken(node: ts.Token<ts.SyntaxKind.AmpersandToken>,
    context: EmitterContext): string {
  const source: string[] = [];
  _emitToken(source, '&', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitCaretToken(node: ts.Token<ts.SyntaxKind.CaretToken>,
    context: EmitterContext): string {
  const source: string[] = [];
  _emitToken(source, '^', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitMinusToken(node: ts.Token<ts.SyntaxKind.MinusToken>,
    context: EmitterContext): string {
  const source: string[] = [];
  _emitToken(source, '-', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitLastBinaryOperator(node: ts.Token<ts.SyntaxKind.LastBinaryOperator>,
    context: EmitterContext): string {
  const source: string[] = [];
  _emitToken(source, '^=', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitPlusToken(node: ts.Token<ts.SyntaxKind.PlusToken>, context: EmitterContext): string {
  const source: string[] = [];
  _emitToken(source, '+', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitMinusEqualsToken(node: ts.Token<ts.SyntaxKind.MinusEqualsToken>,
    context: EmitterContext): string {
  const source: string[] = [];
  _emitToken(source, '-=', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitAsteriskToken(node: ts.Token<ts.SyntaxKind.AsteriskToken>,
    context: EmitterContext): string {
  const source: string[] = [];
  _emitToken(source, '*', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitEqualsEqualsToken(node: ts.Token<ts.SyntaxKind.EqualsEqualsToken>,
    context: EmitterContext): string {
  const source: string[] = [];
  _emitToken(source, '==', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitEqualsEqualsEqualsToken(node: ts.Token<ts.SyntaxKind.EqualsEqualsEqualsToken>,
    context: EmitterContext): string {
  const source: string[] = [];
  _emitToken(source, '===', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitExclamationEqualsToken(node: ts.Token<ts.SyntaxKind.ExclamationEqualsToken>,
    context: EmitterContext): string {
  const source: string[] = [];
  _emitToken(source, '!=', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitExclamationEqualsEqualsToken(node: ts.Token<ts.SyntaxKind.ExclamationEqualsEqualsToken>,
    context: EmitterContext): string {
  const source: string[] = [];
  _emitToken(source, '!==', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitCommaToken(node: ts.Token<ts.SyntaxKind.CommaToken>,
    context: EmitterContext): string {
  const source: string[] = [];
  _emitToken(source, ',', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitGreaterThanToken(node: ts.Token<ts.SyntaxKind.GreaterThanToken>,
    context: EmitterContext): string {
  const source: string[] = [];
  _emitToken(source, '>', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitGreaterThanGreaterThanToken(node: ts.Token<ts.SyntaxKind.GreaterThanGreaterThanToken>,
    context: EmitterContext): string {
  const source: string[] = [];
  _emitToken(source, '>>', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitGreaterThanGreaterThanGreaterThanToken(this: any,
    node: ts.Token<ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken>, context: EmitterContext): string {
  const source: string[] = [];
  _emitToken(source, '>>>', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitBarToken(node: ts.Token<ts.SyntaxKind.BarToken>,
    context: EmitterContext): string {
  const source: string[] = [];
  _emitToken(source, '|', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitBarBarToken(node: ts.Token<ts.SyntaxKind.BarBarToken>,
    context: EmitterContext): string {
  const source: string[] = [];
  _emitToken(source, '||', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitAmpersandAmpersandToken(node: ts.Token<ts.SyntaxKind.AmpersandAmpersandToken>,
    context: EmitterContext): string {
  const source: string[] = [];
  _emitToken(source, '&&', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitAsteriskAsteriskToken(node: ts.Token<ts.SyntaxKind.AsteriskAsteriskToken>,
    context: EmitterContext): string {
  const source: string[] = [];
  _emitToken(source, '**', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitFirstBinaryOperator(node: ts.Token<ts.SyntaxKind.FirstBinaryOperator>,
    context: EmitterContext): string {
  const source: string[] = [];
  _emitToken(source, '<', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitLastTypeNode(node: ts.LiteralTypeNode, context: EmitterContext): string {
  const source: string[] = [];
  addWhitespace(source, node, context);
  source.push(emitExpression(node.literal, context));
  endNode(node, context);
  return source.join('');
}

export function emitIdentifier(node: ts.Identifier, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  addWhitespace(source, node, context);
  const literal = (node as any).newText
    ? (node as any).newText
    : getSourceFile(node).getFullText().substring(node.getStart(), node.getEnd()).trim();
  source.push(literal);
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitTypeAliasDeclaration(node: ts.TypeAliasDeclaration, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitModifiers(source, node, context);
  emitStatic(source, 'type', node, context);
  addWhitespace(source, node, context);
  source.push(emitIdentifier(node.name, context));
  emitTypeParameters(source, node, context);
  emitStatic(source, '=', node, context);
  addWhitespace(source, node, context);
  source.push(emitTypeNode(node.type, context));
  addSemicolon(source, node, context);
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitTypeParameter(node: ts.TypeParameterDeclaration, context: EmitterContext): string {
  const source: string[] = [];
  addWhitespace(source, node, context);
  source.push(emitIdentifier(node.name, context));
  if (node.constraint) {
    emitStatic(source, 'extends', node, context);
    addWhitespace(source, node, context);
    source.push(emitTypeNode(node.constraint, context));
  }
  if (node.default) {
    emitStatic(source, '=', node, context);
    addWhitespace(source, node, context);
    source.push(emitTypeNode(node.default, context));
  }
  endNode(node, context);
  return source.join('');
}

export function emitTypeQuery(node: ts.TypeQueryNode, context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, 'typeof', node, context);
  addWhitespace(source, node, context);
  source.push(emitEntityName(node.exprName, context));
  return source.join('');
}

export function emitTypeOperator(node: ts.TypeOperatorNode, context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, 'keyof', node, context);
  addWhitespace(source, node, context);
  source.push(emitTypeNode(node.type, context));
  endNode(node, context);
  return source.join('');
}

export function emitIntersectionType(node: ts.IntersectionTypeNode, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingAmpersand(source, node, context);
  for (let i = 0, n = node.types.length; i < n; i++) {
    const type = node.types[i];
    addWhitespace(source, node, context);
    source.push(emitTypeNode(type, context));
    if ((i < n - 1)) {
      emitStatic(source, '&', node, context);
    }
  }
  endNode(node, context);
  return source.join('');
}

export function emitThisType(node: ts.ThisTypeNode, context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, 'this', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitArrayType(node: ts.ArrayTypeNode, context: EmitterContext): string {
  const source: string[] = [];
  addWhitespace(source, node, context);
  source.push(emitTypeNode(node.elementType, context));
  emitStatic(source, '[', node, context);
  emitStatic(source, ']', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitIndexedAccessType(node: ts.IndexedAccessTypeNode, context: EmitterContext): string {
  const source: string[] = [];
  addWhitespace(source, node, context);
  source.push(emitTypeNode(node.objectType, context));
  emitStatic(source, '[', node, context);
  addWhitespace(source, node, context);
  source.push(emitTypeNode(node.indexType, context));
  emitStatic(source, ']', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitSpreadElement(node: ts.SpreadElement, context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '...', node, context);
  addWhitespace(source, node, context);
  source.push(emitExpression(node.expression, context));
  endNode(node, context);
  return source.join('');
}

export function emitSpreadAssignment(node: ts.SpreadAssignment, context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '...', node, context);
  addWhitespace(source, node, context);
  source.push(emitExpression(node.expression, context));
  endNode(node, context);
  return source.join('');
}

export function emitIndexSignature(node: ts.IndexSignatureDeclaration, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  emitModifiers(source, node, context);
  emitStatic(source, '[', node, context);
  emitParameters(source, node, context);
  emitStatic(source, ']', node, context);
  if (node.type) {
    emitStatic(source, ':', node, context);
    addWhitespace(source, node, context);
    source.push(emitTypeNode(node.type, context));
  }
  addComma(source, node, context);
  addSemicolon(source, node, context);
  endNode(node, context);
  addTrailingComment(source, node, context);
  return source.join('');
}

export function emitRegularExpressionLiteral(node: ts.RegularExpressionLiteral,
    context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, node.text, node, context);
  endNode(node, context);
  return source.join('');
}

export function emitTupleType(node: ts.TupleTypeNode, context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '[', node, context);
  for (let i = 0, n = node.elementTypes.length; i < n; i++) {
    addWhitespace(source, node, context);
    source.push(emitTypeNode(node.elementTypes[i], context));
    if (i < n - 1) {
      emitStatic(source, ',', node, context);
    }
  }
  emitStatic(source, ']', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitConstructorType(node: ts.ConstructorTypeNode, context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, 'new', node, context);
  emitTypeParameters(source, node, context);
  emitStatic(source, '(', node, context);
  emitParameters(source, node, context);
  emitStatic(source, ')', node, context);
  if (node.type) {
    emitStatic(source, '=>', node, context);
    addWhitespace(source, node, context);
    source.push(emitTypeNode(node.type, context));
  }
  addSemicolon(source, node, context);
  endNode(node, context);
  return source.join('');
}

export function emitFirstTypeNode(node: ts.TypePredicateNode, context: EmitterContext): string {
  const source: string[] = [];
  addWhitespace(source, node, context);
  source.push(emit(node.parameterName, context));
  emitStatic(source, 'is', node, context);
  addWhitespace(source, node, context);
  source.push(emitTypeNode(node.type, context));
  endNode(node, context);
  return source.join('');
}

export function emitFunctionType(node: ts.FunctionTypeNode, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  if (node.name !== undefined) {
    addWhitespace(source, node, context);
    source.push(emitPropertName(node.name, context));
  }
  emitTypeParameters(source, node, context);
  emitStatic(source, '(', node, context);
  emitParameters(source, node, context);
  emitStatic(source, ')', node, context);
  if (node.type) {
    emitStatic(source, '=>', node, context);
    addWhitespace(source, node, context);
    source.push(emitTypeNode(node.type, context));
  }
  endNode(node, context);
  return source.join('');
}

export function emitTypeLiteral(node: ts.TypeLiteralNode, context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '{', node, context);
  if (node.members !== undefined) {
    for (let i = 0, n = node.members.length; i < n; i++) {
      addWhitespace(source, node, context);
      source.push(emit(node.members[i], context));
      addLeadingComment(source, context.offset, node, context);
    }
  }
  emitStatic(source, '}', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitStringLiteral(node: ts.StringLiteral, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  addWhitespace(source, node, context);
  const literal = (node as any).newText
    ? (node as any).newText
    : getSourceFile(node).getFullText().substring(node.getStart(), node.getEnd()).trim();
  source.push(literal);
  endNode(node, context);
  return source.join('');
}

export function emitFirstLiteralToken(node: ts.NumericLiteral, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingComment(source, node, context);
  addWhitespace(source, node, context);
  const literal = (node as any).newText
    ? (node as any).newText
    : getSourceFile(node).getFullText().substring(node.getStart(), node.getEnd()).trim();
  source.push(literal);
  endNode(node, context);
  return source.join('');
}

export function emitTaggedTemplateExpression(node: ts.TaggedTemplateExpression,
    context: EmitterContext): string {
  const source: string[] = [];
  addWhitespace(source, node, context);
  source.push(emit(node.tag, context));
  addWhitespace(source, node, context);
  source.push(emit(node.template, context));
  endNode(node, context);
  return source.join('');
}

export function emitTemplateExpression(node: ts.TemplateExpression,
    context: EmitterContext): string {
  const source: string[] = [];
  addWhitespace(source, node, context);
  source.push(emitTemplateHead(node.head, context));
  node.templateSpans.forEach(span => {
    addWhitespace(source, node, context);
    source.push(emitTemplateSpan(span, context));
  });
  endNode(node, context);
  return source.join('');
}

export function emitTemplateHead(node: ts.TemplateHead,
    context: EmitterContext): string {
  const source: string[] = [];
  const literal = (node as any).newText
    ? (node as any).newText
    : getSourceFile(node).getFullText().substring(node.getStart(), node.getEnd()).trim();
  source.push(literal);
  endNode(node, context);
  return source.join('');
}

export function emitTemplateSpan(node: ts.TemplateSpan,
    context: EmitterContext): string {
  const source: string[] = [];
  addWhitespace(source, node, context);
  source.push(emitExpression(node.expression, context));
  addWhitespace(source, node, context);
  source.push(emit(node.literal, context));
  endNode(node, context);
  return source.join('');
}

export function emitTemplateMiddle(node: ts.TemplateMiddle,
    context: EmitterContext): string {
  const source: string[] = [];
  const literal = (node as any).newText
    ? (node as any).newText
    : getSourceFile(node).getFullText().substring(node.getStart(), node.getEnd()).trim();
  source.push(literal);
  endNode(node, context);
  return source.join('');
}

export function emitLastTemplateToken(node: ts.LiteralLikeNode,
    context: EmitterContext): string {
  const source: string[] = [];
  const literal = (node as any).newText
    ? (node as any).newText
    : getSourceFile(node).getFullText().substring(node.getStart(), node.getEnd()).trim();
  source.push(literal);
  endNode(node, context);
  return source.join('');
}

export function emitFirstTemplateToken(node: ts.Expression, context: EmitterContext): string {
  const source: string[] = [];
  addWhitespace(source, node, context);
  const literal = (node as any).newText
    ? (node as any).newText
    : getSourceFile(node).getFullText().substring(node.getStart(), node.getEnd()).trim();
  source.push(literal);
  endNode(node, context);
  return source.join('');
}

export function emitFirstAssignment(node: ts.Node, context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '=', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitParenthesizedType(node: ts.ParenthesizedTypeNode, context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '(', node, context);
  addWhitespace(source, node, context);
  source.push(emitTypeNode(node.type, context));
  emitStatic(source, ')', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitJsxElement(node: ts.JsxElement, context: EmitterContext): string {
  const source: string[] = [];
  addWhitespace(source, node, context);
  source.push(emitJsxOpeningElement(node.openingElement, context));
  for (let i = 0, n = node.children.length; i < n; i++) {
    const child = node.children[i];
    addWhitespace(source, child, context);
    source.push(emit(child, context));
  }
  addWhitespace(source, node, context);
  source.push(emitJsxClosingElement(node.closingElement, context));
  endNode(node, context);
  return source.join('');
}

export function emitJsxSelfClosingElement(node: ts.JsxSelfClosingElement, context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '<', node, context);
  addWhitespace(source, node, context);
  source.push(emit(node.tagName, context));
  source.push(emitJsxAttributes(node.attributes, context));
  emitStatic(source, '/>', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitJsxOpeningElement(node: ts.JsxOpeningElement, context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '<', node, context);
  addWhitespace(source, node, context);
  source.push(emit(node.tagName, context));
  source.push(emitJsxAttributes(node.attributes, context));
  emitStatic(source, '>', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitJsxAttributes(node: ts.JsxAttributes, context: EmitterContext): string {
  const source: string[] = [];
  node.properties.forEach(property => {
    addWhitespace(source, property, context);
    source.push(emit(property, context));
  });
  endNode(node, context);
  return source.join('');
}

export function emitJsxAttribute(node: ts.JsxAttribute, context: EmitterContext): string {
  const source: string[] = [];
  addWhitespace(source, node, context);
  source.push(emitIdentifier(node.name, context));
  if (node.initializer) {
    emitStatic(source, '=', node, context);
    addWhitespace(source, node, context);
    source.push(emit(node.initializer, context));
  }
  endNode(node, context);
  return source.join('');
}

export function emitJsxText(node: ts.JsxText, context: EmitterContext): string {
  const source: string[] = [];
  const text = (node as any).newText
    ? (node as any).newText
    : getSourceFile(node).getFullText().substring(node.getStart(), node.getEnd()).trim();
  emitStatic(source, text, node, context);
  endNode(node, context);
  return source.join('');
}

export function emitJsxExpression(node: ts.JsxExpression, context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '{', node, context);
  if (node.expression) {
    addWhitespace(source, node, context);
    source.push(emitExpression(node.expression, context));
  }
  emitStatic(source, '}', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitJsxClosingElement(node: ts.JsxClosingElement, context: EmitterContext): string {
  const source: string[] = [];
  emitStatic(source, '</', node, context);
  addWhitespace(source, node, context);
  source.push(emit(node.tagName, context));
  emitStatic(source, '>', node, context);
  endNode(node, context);
  return source.join('');
}

export function emitTrueKeyword(node: ts.Node, context: EmitterContext): string {
  return _emitKeyword('true', node, context);
}

export function emitUndefinedKeyword(node: ts.Node, context: EmitterContext): string {
  return _emitKeyword('undefined', node, context);
}

export function emitFalseKeyword(node: ts.Node, context: EmitterContext): string {
  return _emitKeyword('false', node, context);
}

export function emitSuperKeyword(node: ts.Node, context: EmitterContext): string {
  return _emitKeyword('super', node, context);
}

export function emitExportKeyword(node: ts.Node, context: EmitterContext): string {
  return _emitKeyword('export', node, context);
}

export function emitThisKeyword(node: ts.Node, context: EmitterContext): string {
  return _emitKeyword('this', node, context);
}

export function emitDeclareKeyword(node: ts.Node, context: EmitterContext): string {
  return _emitKeyword('declare', node, context);
}

export function emitAbstractKeyword(node: ts.Node, context: EmitterContext): string {
  return _emitKeyword('abstract', node, context);
}

export function emitNullKeyword(node: ts.Node, context: EmitterContext): string {
  return _emitKeyword('null', node, context);
}

export function emitObjectKeyword(node: ts.KeywordTypeNode, context: EmitterContext): string {
  return _emitKeyword('object', node, context);
}

export function emitNeverKeyword(node: ts.KeywordTypeNode, context: EmitterContext): string {
  return _emitKeyword('never', node, context);
}

export function emitDefaultKeyword(node: ts.Node, context: EmitterContext): string {
  return _emitKeyword('default', node, context);
}

export function emitReadonlyKeyword(node: ts.Node, context: EmitterContext): string {
  return _emitKeyword('readonly', node, context);
}

export function emitPrivateKeyword(node: ts.Node, context: EmitterContext): string {
  return _emitKeyword('private', node, context);
}

export function emitProtectedKeyword(node: ts.Node, context: EmitterContext): string {
  return _emitKeyword('protected', node, context);
}

export function emitPublicKeyword(node: ts.Node, context: EmitterContext): string {
  return _emitKeyword('public', node, context);
}

export function emitStaticKeyword(node: ts.Node, context: EmitterContext): string {
  return _emitKeyword('static', node, context);
}

export function emitAnyKeyword(node: ts.Node, context: EmitterContext): string {
  return _emitKeyword('any', node, context);
}

export function emitAsyncKeyword(node: ts.Node, context: EmitterContext): string {
  return _emitKeyword('async', node, context);
}

export function emitInstanceOfKeyword(node: ts.Node, context: EmitterContext): string {
  return _emitKeyword('instanceof', node, context);
}

export function emitNumberKeyword(node: ts.Node, context: EmitterContext): string {
  return _emitKeyword('number', node, context);
}

export function emitInKeyword(node: ts.Node, context: EmitterContext): string {
  return _emitKeyword('in', node, context);
}

export function emitSymbolKeyword(node: ts.Node, context: EmitterContext): string {
  return _emitKeyword('symbol', node, context);
}

export function emitStringKeyword(node: ts.Node, context: EmitterContext): string {
  const source: string[] = [];
  addLeadingAmpersand(source, node, context);
  addLeadingBar(source, node, context);
  source.push(_emitKeyword('string', node, context));
  return source.join('');
}

export function emitEnumKeyword(node: ts.Node, context: EmitterContext): string {
  return _emitKeyword('enum', node, context);
}

export function emitConstKeyword(node: ts.Node, context: EmitterContext): string {
  return _emitKeyword('const', node, context);
}

export function emitBooleanKeyword(node: ts.Node, context: EmitterContext): string {
  return _emitKeyword('boolean', node, context);
}

export function emitVoidKeyword(node: ts.Node, context: EmitterContext): string {
  return _emitKeyword('void', node, context);
}

function _emitKeyword(keyword: string, node: ts.Node, context: EmitterContext): string {
  const source: string[] = [];
  addWhitespace(source, node, context);
  source.push(keyword);
  context.offset += keyword.length;
  return source.join('');
}

const emitter = {
  [ts.SyntaxKind.SourceFile]: emitSourceFile,
  [ts.SyntaxKind.NamespaceImport]: emitNamespaceImport,
  [ts.SyntaxKind.NamedImports]: emitNamedImports,
  [ts.SyntaxKind.ImportSpecifier]: emitImportSpecifier,
  [ts.SyntaxKind.FirstNode]: emitFirstNode,
  [ts.SyntaxKind.StringLiteral]: emitStringLiteral,
  [ts.SyntaxKind.Identifier]: emitIdentifier,
  [ts.SyntaxKind.ExternalModuleReference]: emitExternalModuleReference,
  [ts.SyntaxKind.VariableDeclarationList]: emitVariableDeclarationList,
  [ts.SyntaxKind.Constructor]: emitConstructor,
  [ts.SyntaxKind.ExportSpecifier]: emitExportSpecifier,
  [ts.SyntaxKind.Block]: emitBlock,
  [ts.SyntaxKind.IndexSignature]: emitIndexSignature,
  [ts.SyntaxKind.BinaryExpression]: emitBinaryExpression,
  [ts.SyntaxKind.FirstLiteralToken]: emitFirstLiteralToken,
  [ts.SyntaxKind.PropertyAccessExpression]: emitPropertyAccessExpression,
  [ts.SyntaxKind.FirstCompoundAssignment]: emitFirstCompoundAssignment,
  [ts.SyntaxKind.ThisKeyword]: emitThisKeyword,
  [ts.SyntaxKind.TrueKeyword]: emitTrueKeyword,
  [ts.SyntaxKind.FirstAssignment]: emitFirstAssignment,
  [ts.SyntaxKind.FalseKeyword]: emitFalseKeyword,
  [ts.SyntaxKind.PublicKeyword]: emitPublicKeyword,
  [ts.SyntaxKind.Parameter]: emitParameter,
  [ts.SyntaxKind.ModuleDeclaration]: emitModuleDeclaration,
  [ts.SyntaxKind.NewExpression]: emitNewExpression,
  [ts.SyntaxKind.ExportKeyword]: emitExportKeyword,
  [ts.SyntaxKind.ArrowFunction]: emitArrowFunction,
  [ts.SyntaxKind.ModuleBlock]: emitModuleBlock,
  [ts.SyntaxKind.PlusToken]: emitPlusToken,
  [ts.SyntaxKind.CallExpression]: emitCallExpression,
  [ts.SyntaxKind.FunctionExpression]: emitFunctionExpression,
  [ts.SyntaxKind.PropertyDeclaration]: emitPropertyDeclaration,
  [ts.SyntaxKind.ObjectLiteralExpression]: emitObjectLiteralExpression,
  [ts.SyntaxKind.DeclareKeyword]: emitDeclareKeyword,
  [ts.SyntaxKind.PropertyAssignment]: emitPropertyAssignment,
  [ts.SyntaxKind.PrivateKeyword]: emitPrivateKeyword,
  [ts.SyntaxKind.ExpressionWithTypeArguments]: emitExpressionWithTypeArguments,
  [ts.SyntaxKind.ConstKeyword]: emitConstKeyword,
  [ts.SyntaxKind.SuperKeyword]: emitSuperKeyword,
  [ts.SyntaxKind.RegularExpressionLiteral]: emitRegularExpressionLiteral,
  [ts.SyntaxKind.GetAccessor]: emitGetAccessor,
  [ts.SyntaxKind.SetAccessor]: emitSetAccessor,
  [ts.SyntaxKind.JsxElement]: emitJsxElement,
  [ts.SyntaxKind.MethodDeclaration]: emitMethodDeclaration,
  [ts.SyntaxKind.JsxExpression]: emitJsxExpression,
  [ts.SyntaxKind.TypeParameter]: emitTypeParameter,
  [ts.SyntaxKind.JsxText]: emitJsxText,
  [ts.SyntaxKind.CallSignature]: emitCallSignature,
  [ts.SyntaxKind.ConstructSignature]: emitConstructSignature,
  [ts.SyntaxKind.JsxAttribute]: emitJsxAttribute,
  [ts.SyntaxKind.PropertySignature]: emitPropertySignature,
  [ts.SyntaxKind.NonNullExpression]: emitNonNullExpression,
  [ts.SyntaxKind.MethodSignature]: emitMethodSignature,
  [ts.SyntaxKind.ParenthesizedExpression]: emitParenthesizedExpression,
  [ts.SyntaxKind.PrefixUnaryExpression]: emitPrefixUnaryExpression,
  [ts.SyntaxKind.TemplateExpression]: emitTemplateExpression,
  [ts.SyntaxKind.FirstBinaryOperator]: emitFirstBinaryOperator,
  [ts.SyntaxKind.AmpersandAmpersandToken]: emitAmpersandAmpersandToken,
  [ts.SyntaxKind.PostfixUnaryExpression]: emitPostfixUnaryExpression,
  [ts.SyntaxKind.AsyncKeyword]: emitAsyncKeyword,
  [ts.SyntaxKind.AwaitExpression]: emitAwaitExpression,
  [ts.SyntaxKind.ArrayLiteralExpression]: emitArrayLiteralExpression,
  [ts.SyntaxKind.TemplateMiddle]: emitTemplateMiddle,
  [ts.SyntaxKind.LastTemplateToken]: emitLastTemplateToken,
  [ts.SyntaxKind.ArrayBindingPattern]: emitArrayBindingPattern,
  [ts.SyntaxKind.OmittedExpression]: emitOmittedExpression,
  [ts.SyntaxKind.BindingElement]: emitBindingElement,
  [ts.SyntaxKind.CaseClause]: emitCaseClause,
  [ts.SyntaxKind.DefaultClause]: emitDefaultClause,
  [ts.SyntaxKind.ObjectBindingPattern]: emitObjectBindingPattern,
  [ts.SyntaxKind.ElementAccessExpression]: emitElementAccessExpression,
  [ts.SyntaxKind.AsteriskToken]: emitAsteriskToken,
  [ts.SyntaxKind.SlashToken]: emitSlashToken,
  [ts.SyntaxKind.StaticKeyword]: emitStaticKeyword,
  [ts.SyntaxKind.MappedType]: emitMappedType,
  [ts.SyntaxKind.ReadonlyKeyword]: emitReadonlyKeyword,
  [ts.SyntaxKind.TypeOperator]: emitTypeOperator,
  [ts.SyntaxKind.TypeReference]: emitTypeReference,
  [ts.SyntaxKind.VoidExpression]: emitVoidExpression,
  [ts.SyntaxKind.StringKeyword]: emitStringKeyword,
  [ts.SyntaxKind.ConditionalExpression]: emitConditionalExpression,
  [ts.SyntaxKind.ExclamationEqualsEqualsToken]: emitExclamationEqualsEqualsToken,
  [ts.SyntaxKind.BarBarToken]: emitBarBarToken,
  [ts.SyntaxKind.ClassExpression]: emitClassExpression,
  [ts.SyntaxKind.TypeAssertionExpression]: emitTypeAssertionExpression,
  [ts.SyntaxKind.NullKeyword]: emitNullKeyword,
  [ts.SyntaxKind.LastBinaryOperator]: emitLastBinaryOperator,
  [ts.SyntaxKind.TypeLiteral]: emitTypeLiteral,
  [ts.SyntaxKind.SpreadElement]: emitSpreadElement,
  [ts.SyntaxKind.SpreadAssignment]: emitSpreadAssignment,
  [ts.SyntaxKind.TypeOfExpression]: emitTypeOfExpression,
  [ts.SyntaxKind.IntersectionType]: emitIntersectionType,
  [ts.SyntaxKind.ArrayType]: emitArrayType,
  [ts.SyntaxKind.NumberKeyword]: emitNumberKeyword,
  [ts.SyntaxKind.ShorthandPropertyAssignment]: emitShorthandPropertyAssignment,
  [ts.SyntaxKind.LastTypeNode]: emitLastTypeNode,
  [ts.SyntaxKind.TypeQuery]: emitTypeQuery,
  [ts.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken]: emitGreaterThanGreaterThanGreaterThanEqualsToken,
  [ts.SyntaxKind.FirstTemplateToken]: emitFirstTemplateToken,
  [ts.SyntaxKind.SemicolonClassElement]: emitSemicolonClassElement,
  [ts.SyntaxKind.AsExpression]: emitAsExpression,
  [ts.SyntaxKind.ExclamationEqualsToken]: emitExclamationEqualsToken,
  [ts.SyntaxKind.AmpersandToken]: emitAmpersandToken,
  [ts.SyntaxKind.CaretToken]: emitCaretToken,
  [ts.SyntaxKind.AsteriskAsteriskToken]: emitAsteriskAsteriskToken,
  [ts.SyntaxKind.GreaterThanGreaterThanToken]: emitGreaterThanGreaterThanToken,
  [ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken]: emitGreaterThanGreaterThanGreaterThanToken,
  [ts.SyntaxKind.TupleType]: emitTupleType,
  [ts.SyntaxKind.FunctionType]: emitFunctionType,
  [ts.SyntaxKind.UnionType]: emitUnionType,
  [ts.SyntaxKind.ParenthesizedType]: emitParenthesizedType,
  [ts.SyntaxKind.VoidKeyword]: emitVoidKeyword,
  [ts.SyntaxKind.PercentToken]: emitPercentToken,
  [ts.SyntaxKind.EqualsEqualsToken]: emitEqualsEqualsToken,
  [ts.SyntaxKind.IndexedAccessType]: emitIndexedAccessType,
  [ts.SyntaxKind.DefaultKeyword]: emitDefaultKeyword,
  [ts.SyntaxKind.ProtectedKeyword]: emitProtectedKeyword,
  [ts.SyntaxKind.AnyKeyword]: emitAnyKeyword,
  [ts.SyntaxKind.GreaterThanToken]: emitGreaterThanToken,
  [ts.SyntaxKind.MinusEqualsToken]: emitMinusEqualsToken,
  [ts.SyntaxKind.EqualsEqualsEqualsToken]: emitEqualsEqualsEqualsToken,
  [ts.SyntaxKind.AbstractKeyword]: emitAbstractKeyword,
  [ts.SyntaxKind.InstanceOfKeyword]: emitInstanceOfKeyword,
  [ts.SyntaxKind.ThisType]: emitThisType,
  [ts.SyntaxKind.InKeyword]: emitInKeyword,
  [ts.SyntaxKind.LessThanEqualsToken]: emitLessThanEqualsToken,
  [ts.SyntaxKind.AsteriskEqualsToken]: emitAsteriskEqualsToken,
  [ts.SyntaxKind.CommaToken]: emitCommaToken,
  [ts.SyntaxKind.AmpersandEqualsToken]: emitAmpersandEqualsToken,
  [ts.SyntaxKind.BarToken]: emitBarToken,
  [ts.SyntaxKind.BooleanKeyword]: emitBooleanKeyword,
  [ts.SyntaxKind.MinusToken]: emitMinusToken,
  [ts.SyntaxKind.SlashEqualsToken]: emitSlashEqualsToken,
  [ts.SyntaxKind.BarEqualsToken]: emitBarEqualsToken,
  [ts.SyntaxKind.UndefinedKeyword]: emitUndefinedKeyword,
  [ts.SyntaxKind.GreaterThanEqualsToken]: emitGreaterThanEqualsToken,
  [ts.SyntaxKind.LessThanLessThanToken]: emitLessThanLessThanToken,
  [ts.SyntaxKind.PercentEqualsToken]: emitPercentEqualsToken,
  [ts.SyntaxKind.LessThanLessThanEqualsToken]: emitLessThanLessThanEqualsToken,
  [ts.SyntaxKind.GreaterThanGreaterThanEqualsToken]: emitGreaterThanGreaterThanEqualsToken
};
