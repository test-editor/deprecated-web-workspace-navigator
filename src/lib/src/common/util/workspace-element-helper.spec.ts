import { ElementType } from '../element-type';
import { WorkspaceElement } from '../workspace-element';
import { getDirectory } from './workspace-element-helper';

describe('getDirectory()', () => {

  let element: WorkspaceElement;

  beforeEach(() => {
    element = {
      name: "dummy",
      path: "some/random/path/dummy",
      type: ElementType.File,
      children: []
    };
  });

  it('should return a directory\'s path when it ends with a \\', () => {
    // given
    element.path = "some/directory/path/"
    element.type = ElementType.Folder

    // when + then
    expect(getDirectory(element)).toEqual(element.path)
  });

  it('should return append a \\ to a directory\'s path when not ending with a \\', () => {
    // given
    element.path = "some/directory/path"
    element.type = ElementType.Folder

    // when + then
    expect(getDirectory(element)).toEqual("some/directory/path/")
  });

  it('should return the parent\'s path when element is a file', () => {
    // when + then
    expect(getDirectory(element)).toEqual("some/random/path/")
  });

  it('should return empty string on null', () => {
    // when + then
    expect(getDirectory(null)).toEqual("")
  });

  it('should throw an exception for unknown element types', () => {
    // given
    element.type = "random"

    // when + then
    expect(() => getDirectory(element)).toThrowError("Invalid element type: random")
  });

});
