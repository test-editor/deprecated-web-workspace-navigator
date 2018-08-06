import { WorkspaceElement } from './workspace-element';
import { ElementType } from './element-type';
import { Workspace } from './workspace';

export const firstChild: WorkspaceElement = {
  name: 'firstChild',
  path: 'root/firstChild',
  type: ElementType.File,
  children: []
};
export const greatGrandChild: WorkspaceElement = {
  name: 'greatGrandChild',
  path: 'root/middleChild/grandChild/greatGrandChild',
  type: ElementType.File,
  children: []
};
export const grandChild: WorkspaceElement = {
  name: 'grandChild',
  path: 'root/middleChild/grandChild',
  type: ElementType.Folder,
  children: [greatGrandChild]
};
export const middleChild: WorkspaceElement = {
  name: 'middleChild',
  path: 'root/middleChild',
  type: ElementType.Folder,
  children: [grandChild]
};
export const lastChild: WorkspaceElement = {
  name: 'lastChild',
  path: 'root/lastChild',
  type: ElementType.File,
  children: []
};

export const root: WorkspaceElement = {
  name: 'folder',
  path: 'root',
  type: ElementType.Folder,
  children: [firstChild, middleChild, lastChild]
};

/**
 * + root
 *   - firstChild
 *   + middleChild
 *     + grandChild
 *       - greatGrandChild
 *   - lastChild
 */
export function createWorkspaceWithSubElements(): Workspace {
  const workspace = new Workspace();
  workspace.reload(root);
  return workspace;
};
