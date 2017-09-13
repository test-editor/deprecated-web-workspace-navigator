import { ElementType } from './element-type';
import { Workspace } from './workspace';
import { WorkspaceElement } from './workspace-element';

function createWorkspaceWithRootFolder(path: string): Workspace {
  let element: WorkspaceElement = {
    name: 'folder',
    path: path,
    type: ElementType.Folder,
    children: []
  };
  return new Workspace(element);
}

describe('Workspace', () => {

  it('can retrieve root element', () => {
    // given
    let workspace = createWorkspaceWithRootFolder('root');

    // when
    let retrievedElement = workspace.getElement('root');

    // then
    expect(retrievedElement).toBe(workspace.root);
  });

  it('normalizes paths when retrieving elements', () => {
    // given
    let workspace = createWorkspaceWithRootFolder('/some/folder//');

    // when
    let retrievedElement = workspace.getElement('some/folder');

    // then
    expect(retrievedElement).toBe(workspace.root);
  });

});

describe('Workspace.getSubpaths()', () => {

  // given
  let workspace = createWorkspaceWithRootFolder('root');

  it('returns empty path', () => {
    // when + then
    expect(workspace.getSubpaths('')).toEqual(['']);
  });

  it('returns filename if just a file', () => {
    // when + then
    expect(workspace.getSubpaths('example.tsl')).toEqual(['example.tsl']);
  });

  it('provides all subpaths of a path', () => {
    // given
    let path = 'some/example/path';

    // when
    let subpaths = workspace.getSubpaths(path);

    // then
    expect(subpaths).toEqual(['some', 'some/example', 'some/example/path']);
  });

  it('normalizes the paths', () => {
    // given
    let path = '//some/example/path//';

    // when
    let subpaths = workspace.getSubpaths(path);

    // then
    expect(subpaths).toEqual(['some', 'some/example', 'some/example/path']);
  });

});

describe('Workspace.getDirectory()', () => {

  let element: WorkspaceElement;

  beforeEach(() => {
    element = {
      name: 'dummy',
      path: 'some/random/path/dummy',
      type: ElementType.File,
      children: []
    };
  });

  it('should return the directory\'s path when it\'s a directory', () => {
    // given
    element.path = 'some/directory/path';
    element.type = ElementType.Folder;

    // when + then
    expect(Workspace.getDirectory(element)).toEqual('some/directory/path');
  });

  it('should return a directory\'s path when it ends with a \\', () => {
    // given
    element.path = 'some/directory/path/';
    element.type = ElementType.Folder;

    // when + then
    expect(Workspace.getDirectory(element)).toEqual('some/directory/path');
  });

  it('should return the parent\'s path when element is a file', () => {
    // when + then
    expect(Workspace.getDirectory(element)).toEqual('some/random/path');
  });

  it('should return empty string on null', () => {
    // when + then
    expect(Workspace.getDirectory(null)).toEqual('');
  });

});
