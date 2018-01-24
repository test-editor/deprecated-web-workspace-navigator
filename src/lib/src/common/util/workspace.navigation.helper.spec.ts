import { WorkspaceNavigationHelper } from './workspace.navigation.helper';
import { createWorkspaceWithSubElements, firstChild, middleChild, grandChild, lastChild, greatGrandChild } from '../workspace.spec.data';
import { UiState } from '../../component/ui-state';
import { worker } from 'cluster';

describe('WorkspaceNavigationHelper', () => {

  // given
  const workspace = createWorkspaceWithSubElements();
  let uiState: UiState​​ = null;
  let helper: WorkspaceNavigationHelper = null;

  beforeEach(() => {
    uiState = new UiState();
    helper = new WorkspaceNavigationHelper(workspace, uiState);
    uiState.setExpanded(workspace.getRootPath(), true);
    uiState.setExpanded(middleChild.path, true);
    uiState.setExpanded(grandChild.path, true);
  });

  describe('nextVisible()', () => {

    it('returns the first child element', () => {
      // when
      let actualSuccessor = helper.nextVisible(workspace.root);

      // then
      expect(actualSuccessor).toEqual(firstChild);
    });

    it('returns the next sibling element', () => {
      // when
      let actualSuccessor = helper.nextVisible(firstChild);

      // then
      expect(actualSuccessor).toEqual(middleChild);
    });

    it('returns the parent`s next sibling element when collapsed', () => {
      // given
      uiState.setExpanded(grandChild.path, false);
      // when
      let actualSuccessor = helper.nextVisible(grandChild);

      // then
      expect(actualSuccessor).toEqual(lastChild);
    });

    it('returns null', () => {
      // when
      let actualSuccessor = helper.nextVisible(lastChild);

      // then
      expect(actualSuccessor).toEqual(null);
    });

    it('skips collapsed elements and returns next sibling element', () => {
      // given
      uiState.setExpanded(middleChild.path, false);
      // when
      let actualSuccessor = helper.nextVisible(middleChild);

      // then
      expect(actualSuccessor).toEqual(lastChild);
    });
  });

  describe('nextSiblingOrAncestorSibling()', () => {

    it('returns null for root', () => {
      // when
      let actualSuccessor = helper.nextSiblingOrAncestorSibling(null, workspace.root);

      // then
      expect(actualSuccessor).toEqual(null);
    });

    it('returns null last element', () => {
      // when
      let actualSuccessor = helper.nextSiblingOrAncestorSibling(workspace.root, lastChild);

      // then
      expect(actualSuccessor).toEqual(null);
    });

    it('returns next sibling', () => {
      // when
      let actualSuccessor = helper.nextSiblingOrAncestorSibling(workspace.root, firstChild);

      // then
      expect(actualSuccessor).toEqual(middleChild);
    });

    it('returns parent`s next sibling', () => {
      // when
      let actualSuccessor = helper.nextSiblingOrAncestorSibling(middleChild, grandChild);

      // then
      expect(actualSuccessor).toEqual(lastChild);
    });
  });

  describe('previousVisible()', () => {
    it('returns null for root', () => {
      // when
      let actualSuccessor = helper.previousVisible(workspace.root);

      // then
      expect(actualSuccessor).toEqual(null);
    });

    it('returns parent', () => {
      // when
      let actualSuccessor = helper.previousVisible(firstChild);

      // then
      expect(actualSuccessor).toEqual(workspace.root);
    });

    it('returns preceeding sibling', () => {
      // when
      let actualSuccessor = helper.previousVisible(middleChild);

      // then
      expect(actualSuccessor).toEqual(firstChild);
    });

    it('returns preceeding sibling`s last descendant', () => {
      // when
      let actualSuccessor = helper.previousVisible(lastChild);

      // then
      expect(actualSuccessor).toEqual(greatGrandChild);
    });

    it('skips collapsed elements and returns preceeding sibling', () => {
      // given
      uiState.setExpanded(middleChild.path, false);

      // when
      let actualSuccessor = helper.previousVisible(lastChild);

      // then
      expect(actualSuccessor).toEqual(middleChild);
    });
  });

  describe('lastVisibleDescendant()', () => {
    it('returns last child for root', () => {
      // when
      let actualSuccessor = helper.lastVisibleDescendant(workspace.root);

      // then
      expect(actualSuccessor).toEqual(lastChild);
    });

    it('returns itself when collapsed', () => {
      // given
      uiState.setExpanded(workspace.root.path, false);
      // when
      let actualSuccessor = helper.lastVisibleDescendant(workspace.root);

      // then
      expect(actualSuccessor).toEqual(workspace.root);
    });

    it('returns last descendant', () => {
      // when
      let actualSuccessor = helper.lastVisibleDescendant(middleChild);

      // then
      expect(actualSuccessor).toEqual(greatGrandChild);
    });

    it('returns last visible descendant', () => {
      // given
      uiState.setExpanded(grandChild.path, false);
      // when
      let actualSuccessor = helper.lastVisibleDescendant(middleChild);

      // then
      expect(actualSuccessor).toEqual(grandChild);
    });
  });
});
