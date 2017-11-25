import { toSource } from './index';
import { getSourceFile } from './test-utils';

test('Handle dynamic imports', () => {
  const source = `
    import('./some-file').then(() => undefined);
  `;
  const sourceFile = getSourceFile(source, true);
  expect(toSource(sourceFile)).toBe(source);
});

test('Handle string enums', () => {
  const source = `
    enum Colors {
      Red = "RED",
      Green = "GREEN",
      Blue = "BLUE",
    }
  `;
  const sourceFile = getSourceFile(source, true);
  expect(toSource(sourceFile)).toBe(source);
});
