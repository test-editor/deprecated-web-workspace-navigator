import { PathValidator } from './path-validator';

let cases = [
  {
    input: 'test.txt',
    expected: true,
    description: 'should allow a simple file'
  },
  {
    input: 'simple/path/test.txt',
    expected: true,
    description: 'should allow a simple path'
  },
  {
    input: '../test.txt',
    expected: false,
    description: 'should prevent dot segment at the beginning'
  },
  {
    input: 'simple/path/../test.txt',
    expected: false,
    description: 'should prevent dot segment in between'
  },
];

describe('PathValidator', () => {

  let validator: PathValidator;

  beforeEach(() => {
    validator = new PathValidator();
  });

  cases.forEach(value => {
    it(value.description, () => {
      // when
      let result = validator.isValid(value.input);

      // then
      expect(result).toBe(value.expected);
    });
  });

});
