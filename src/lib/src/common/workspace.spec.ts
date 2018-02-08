import { ElementType } from './element-type';
import { Workspace } from './workspace';
import { WorkspaceElement } from './workspace-element';
import { grandChild, createWorkspaceWithSubElements, middleChild, firstChild, lastChild, greatGrandChild, root } from './workspace.spec.data';
import { ElementState } from './element-state';

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

describe('Workspace', () => {

  it('can retrieve root element', () => {
    // given
    let workspace = createWorkspaceWithRootFolder('root');

    // when
    let retrievedElement = workspace.getElementInfo('root');

    // then
    expect(retrievedElement.path).toBe(workspace.getRootPath());
  });

  it('normalizes paths when retrieving elements', () => {
    // given
    let workspace = createWorkspaceWithRootFolder('/some/folder//');

    // when
    let retrievedElement = workspace.getElementInfo('some/folder');

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

describe('Workspace Navigation', () => {

  // given
  let workspace: Workspace;

  beforeEach(() => {
    workspace = createWorkspaceWithSubElements();
    workspace.setExpanded(root.path, true);
    workspace.setExpanded(middleChild.path, true);
    workspace.setExpanded(grandChild.path, true);
  });

  describe('selectSuccessor()', () => {

    it('returns the first child element', () => {
      // given
      workspace.setSelected(root.path);

      // when
      workspace.selectSuccessor();

      // then
      expect(workspace.getSelected()).toEqual(firstChild.path);
    });

    it('returns the next sibling element', () => {
      // given
      workspace.setSelected(firstChild.path);

      // when
      workspace.selectSuccessor();

      // then
      expect(workspace.getSelected()).toEqual(middleChild.path);
    });

    it('returns the parent`s next sibling element when collapsed', () => {
      // given
      workspace.setSelected(grandChild.path);
      workspace.setExpanded(grandChild.path, false);

      // when
      workspace.selectSuccessor();

      // then
      expect(workspace.getSelected()).toEqual(lastChild.path);
    });

    it('does not change selection for last element', () => {
      // given
      workspace.setSelected(lastChild.path);

      // when
      workspace.selectSuccessor();

      // then
      expect(workspace.getSelected()).toEqual(lastChild.path);
    });

    it('skips collapsed elements and returns next sibling element', () => {
      // given
      workspace.setSelected(lastChild.path);
      workspace.setExpanded(middleChild.path, false);

      // when
      workspace.selectSuccessor();

      // then
      expect(workspace.getSelected()).toEqual(lastChild.path);
    });
  });

  describe('previousVisible()', () => {
    it('does not change selection for root', () => {
      // given
      workspace.setSelected(root.path);
      // when
      workspace.selectPredecessor();

      // then
      expect(workspace.getSelected()).toEqual(root.path);
    });

    it('returns parent', () => {
      // given
      workspace.setSelected(firstChild.path);

      // when
      workspace.selectPredecessor();

      // then
      expect(workspace.getSelected()).toEqual(root.path);
    });

    it('returns preceeding sibling', () => {
      // given
      workspace.setSelected(middleChild.path);

      // when
      workspace.selectPredecessor();

      // then
      expect(workspace.getSelected()).toEqual(firstChild.path);
    });

    it('returns preceeding sibling`s last descendant', () => {
      // given
      workspace.setSelected(lastChild.path);

      // when
      workspace.selectPredecessor();

      // then
      expect(workspace.getSelected()).toEqual(greatGrandChild.path);
    });

    it('skips collapsed elements and returns preceeding sibling', () => {
      // given
      workspace.setSelected(lastChild.path);
      workspace.setExpanded(middleChild.path, false);

      // when
      workspace.selectPredecessor();

      // then
      expect(workspace.getSelected()).toEqual(middleChild.path);
    });
  });

});

describe('Workspace marker interface', () => {
  it('allows to set values initially', () => {
    // given
    const workspace = new Workspace();

    // when
    workspace.setMarkerValue('sample/path', 'testStatus', ElementState.Running);

    // then
    expect(workspace.getMarkerValue('sample/path', 'testStatus')).toEqual(ElementState.Running);
  });

  it('throws error when trying to retrieve marker fields on unknown paths', () => {
    // given
    const workspace = new Workspace();

    // when + then
    expect(() => workspace.getMarkerValue('unknown/path', 'unknownFieldName'))
        .toThrowError('There are no marker fields for path "unknown/path".');
  });

  it('throws error when trying to retrieve unknown marker fields', () => {
    // given
    const workspace = new Workspace();
    workspace.setMarkerValue('sample/path', 'testStatus', ElementState.Running);

    // when + then
    expect(() => workspace.getMarkerValue('sample/path', 'unknownFieldName'))
        .toThrowError('The marker field "unknownFieldName" does not exist for path "sample/path".');
  });

  it('allows to set and retrieve null values', () => {
    // given
    const workspace = new Workspace();
    workspace.setMarkerValue('sample/path', 'testStatus', null);

    // when
    const actualValue = workspace.getMarkerValue('sample/path', 'testStatus');

    // then
    expect(actualValue).toBeNull();
  });

  it('allows to set and retrieve values for the empty path', () => {
    // given
    const workspace = new Workspace();
    workspace.setMarkerValue('', 'testStatus', ElementState.Running);

    // when
    const actualValue = workspace.getMarkerValue('', 'testStatus');

    // then
    expect(actualValue).toEqual(ElementState.Running);
  });

  [null, undefined].forEach((invalidPath) => {
    it(`does not allow the path to be ${invalidPath} when setting field values`, () => {
      // given
      const workspace = new Workspace();

      // when + then
      expect(() => workspace.setMarkerValue(invalidPath, 'testStatus', ElementState.Running))
          .toThrowError(`path must not be ${invalidPath}`);
    });
  });

  [null, undefined].forEach((invalidPath) => {
    it(`does not allow the path to be ${invalidPath} when retrieving field values`, () => {
      // given
      const workspace = new Workspace();

      // when + then
      expect(() => workspace.getMarkerValue(invalidPath, 'testStatus'))
          .toThrowError(`path must not be ${invalidPath}`);
    });
  });

  [null, undefined, ''].forEach((invalidFieldName) => {
    it(`does not allow the field name to be ${invalidFieldName} when setting field values`, () => {
      // given
      const workspace = new Workspace();

      // when + then
      expect(() => workspace.setMarkerValue('existing/path', invalidFieldName, ElementState.Running))
          .toThrowError('empty field names are not allowed');
    });
  });

  it('allows to retrieve all markers for a given path', () => {
    // given
    const workspace = new Workspace();
    workspace.setMarkerValue('some/path', 'aField', 42);
    workspace.setMarkerValue('some/path', 'anotherField', 'foo');
    workspace.setMarkerValue('some/other/path', 'anUnrelatedField', 'bar');

    // when
    const actualMarker = workspace.getMarkers('some/path');

    // then
    expect(actualMarker.aField).toEqual(42);
    expect(actualMarker.anotherField).toEqual('foo');
    expect(actualMarker.anUnrelatedField).toBeUndefined();
  });

  it('returns empty object if there are no markers for a given path', () => {
    // given
    const workspace = new Workspace();
    workspace.setMarkerValue('some/other/path', 'anUnrelatedField', 'bar');

    // when
    const actualMarker = workspace.getMarkers('some/path');

    // then
    expect(actualMarker).toEqual({});
  });

});
