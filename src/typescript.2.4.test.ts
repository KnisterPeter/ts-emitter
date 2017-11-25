import { getSourceFile } from './emitter.test';
import { toSource } from './index';

test('Handle dynamic imports', () => {
  const source = `
    import('./some-file').then(() => undefined);
  `;
  const sourceFile = getSourceFile(source, true);
  expect(toSource(sourceFile)).toBe(source);
});
