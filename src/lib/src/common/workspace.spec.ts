import { ElementType } from './element-type';
import { Workspace } from './workspace';
import { WorkspaceElement } from './workspace-element';
import { grandChild, createWorkspaceWithSubElements, middleChild } from './workspace.spec.data';

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
    expect(retrievedElement.path).toBe(workspace.getRootPath());
  });

  it('normalizes paths when retrieving elements', () => {
    // given
    let workspace = createWorkspaceWithRootFolder('/some/folder//');

    // when
    let retrievedElement = workspace.getElement('some/folder');

    // then
    expect(retrievedElement.path).toBe(workspace.getRootPath());
  });

});

describe('Workspace.getSubpaths()', () => {

  // given
  let workspace = createWorkspaceWithRootFolder('root');

  it('returns no subpaths for empty path', () => {
    // when + then
    expect(workspace.getSubpaths('')).toEqual([]);
  });

  it('returns no subpaths for simple file', () => {
    // when + then
    expect(workspace.getSubpaths('example.tsl')).toEqual([]);
  });

  it('provides all subpaths of a path', () => {
    // given
    let path = 'some/example/path';

    // when
    let subpaths = workspace.getSubpaths(path);

    // then
    expect(subpaths).toEqual(['some', 'some/example']);
  });

  it('normalizes the paths', () => {
    // given
    let path = '//some/example/path//';

    // when
    let subpaths = workspace.getSubpaths(path);

    // then
    expect(subpaths).toEqual(['some', 'some/example']);
  });

});



describe('Workspace.getParent()', () => {

      it('returns the parent element', () => {
        // given
        let path = grandChild.path;
        // when
        let actualParent = createWorkspaceWithSubElements().getParent(path);
        // then
        expect(actualParent).toEqual(middleChild);
      });

      it('returns null for the root element', () => {
        // given
        let workspace = createWorkspaceWithSubElements();
        let path = workspace.getRootPath();
        // when
        let actualParent = workspace.getParent(path);
        // then
        expect(actualParent).toBeNull();
      });


      it('returns null for parent of empty path', () => {
        // given
        let workspace = createWorkspaceWithRootFolder('/');
        // when
        let actualParent = workspace.getParent('');
        // then
        expect(actualParent).toBeNull();
      });

      it('returns root, if root´s normalized path is the empty string, for a path not containing any slashes', () => {
        // given
        let workspace = createWorkspaceWithRootFolder('/');
        workspace.getElement(workspace.getRootPath()).children.push({
          name: 'firstChild',
          path: 'firstChild',
          type: ElementType.File,
          children: []
        });
        // when
        let actualParent = workspace.getParent('firstChild');
        // then
        expect(actualParent.path).toEqual(workspace.getRootPath());
      });

    });
