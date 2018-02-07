import { ElementType } from './element-type';
import { Workspace } from './workspace';
import { WorkspaceElement } from './workspace-element';
import { grandChild, createWorkspaceWithSubElements, middleChild, firstChild, lastChild, greatGrandChild } from './workspace.spec.data';

function createWorkspaceWithRootFolder(path: string): Workspace {
  let element: WorkspaceElement = {
    name: 'folder',
    path: path,
    type: ElementType.Folder,
    children: []
  };
  const workspace = new Workspace();
  workspace.reload(element);
  return workspace;
}

function getRoot(workspace: Workspace): WorkspaceElement {
  return workspace.getElement(workspace.getRootPath());
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

describe('Workspace Navigation', () => {

  // given
  let workspace: Workspace;

  beforeEach(() => {
    workspace = createWorkspaceWithSubElements();
    workspace.setExpanded(workspace.getRootPath(), true);
    workspace.setExpanded(middleChild.path, true);
    workspace.setExpanded(grandChild.path, true);
  });

  describe('nextVisible()', () => {

    it('returns the first child element', () => {
      // when
      let actualSuccessor = workspace.nextVisible(getRoot(workspace));

      // then
      expect(actualSuccessor).toEqual(firstChild);
    });

    it('returns the next sibling element', () => {
      // when
      let actualSuccessor = workspace.nextVisible(firstChild);

      // then
      expect(actualSuccessor).toEqual(middleChild);
    });

    it('returns the parent`s next sibling element when collapsed', () => {
      // given
      workspace.setExpanded(grandChild.path, false);
      // when
      let actualSuccessor = workspace.nextVisible(grandChild);

      // then
      expect(actualSuccessor).toEqual(lastChild);
    });

    it('returns null', () => {
      // when
      let actualSuccessor = workspace.nextVisible(lastChild);

      // then
      expect(actualSuccessor).toEqual(null);
    });

    it('skips collapsed elements and returns next sibling element', () => {
      // given
      workspace.setExpanded(middleChild.path, false);
      // when
      let actualSuccessor = workspace.nextVisible(middleChild);

      // then
      expect(actualSuccessor).toEqual(lastChild);
    });
  });

  describe('nextSiblingOrAncestorSibling()', () => {

    it('returns null for root', () => {
      // when
      let actualSuccessor = workspace.nextSiblingOrAncestorSibling(null, getRoot(workspace));

      // then
      expect(actualSuccessor).toEqual(null);
    });

    it('returns null last element', () => {
      // when
      let actualSuccessor = workspace.nextSiblingOrAncestorSibling(getRoot(workspace), lastChild);

      // then
      expect(actualSuccessor).toEqual(null);
    });

    it('returns next sibling', () => {
      // when
      let actualSuccessor = workspace.nextSiblingOrAncestorSibling(getRoot(workspace), firstChild);

      // then
      expect(actualSuccessor).toEqual(middleChild);
    });

    it('returns parent`s next sibling', () => {
      // when
      let actualSuccessor = workspace.nextSiblingOrAncestorSibling(middleChild, grandChild);

      // then
      expect(actualSuccessor).toEqual(lastChild);
    });
  });

  describe('previousVisible()', () => {
    it('returns null for root', () => {
      // when
      let actualSuccessor = workspace.previousVisible(getRoot(workspace));

      // then
      expect(actualSuccessor).toEqual(null);
    });

    it('returns parent', () => {
      // when
      let actualSuccessor = workspace.previousVisible(firstChild);

      // then
      expect(actualSuccessor).toEqual(getRoot(workspace));
    });

    it('returns preceeding sibling', () => {
      // when
      let actualSuccessor = workspace.previousVisible(middleChild);

      // then
      expect(actualSuccessor).toEqual(firstChild);
    });

    it('returns preceeding sibling`s last descendant', () => {
      // when
      let actualSuccessor = workspace.previousVisible(lastChild);

      // then
      expect(actualSuccessor).toEqual(greatGrandChild);
    });

    it('skips collapsed elements and returns preceeding sibling', () => {
      // given
      workspace.setExpanded(middleChild.path, false);

      // when
      let actualSuccessor = workspace.previousVisible(lastChild);

      // then
      expect(actualSuccessor).toEqual(middleChild);
    });
  });

  describe('lastVisibleDescendant()', () => {
    it('returns last child for root', () => {
      // when
      let actualSuccessor = workspace.lastVisibleDescendant(getRoot(workspace));

      // then
      expect(actualSuccessor).toEqual(lastChild);
    });

    it('returns itself when collapsed', () => {
      // given
      workspace.setExpanded(workspace.getRootPath(), false);
      // when
      let actualSuccessor = workspace.lastVisibleDescendant(getRoot(workspace));

      // then
      expect(actualSuccessor).toEqual(getRoot(workspace));
    });

    it('returns last descendant', () => {
      // when
      let actualSuccessor = workspace.lastVisibleDescendant(middleChild);

      // then
      expect(actualSuccessor).toEqual(greatGrandChild);
    });

    it('returns last visible descendant', () => {
      // given
      workspace.setExpanded(grandChild.path, false);
      // when
      let actualSuccessor = workspace.lastVisibleDescendant(middleChild);

      // then
      expect(actualSuccessor).toEqual(grandChild);
    });
  });
});
