import { toSource } from './index';
import { getSourceFile } from './test-utils';

test('Optional catch clause', () => {
  const source = `
    let input = "...";
    try {
        JSON.parse(input);
    }
    catch {
        // ^ Notice that our 'catch' clause doesn't declare a variable.
        console.log("Invalid JSON given" + input)
    }
  `;
  const sourceFile = getSourceFile(source, true);
  expect(toSource(sourceFile)).toBe(source);
});
