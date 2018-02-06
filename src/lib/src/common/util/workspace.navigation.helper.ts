// import { UiState } from '../../component/ui-state';
// import { WorkspaceElement } from '../workspace-element';
// import { Workspace } from '../workspace';
// import { ElementType } from '../element-type';

// /**
//  * Helper class providing methods to navigate through the workspace tree, taking current UI state
//  * into account (e.g. not traversing folders which are collapsed in the tree view).
//  */
// export class WorkspaceNavigationHelper {

//   constructor(private readonly workspace: Workspace, private readonly uiState: UiState​​) {}

//   nextVisible(element: WorkspaceElement): WorkspaceElement {
//     if (element.children.length > 0 && this.uiState.isExpanded(element.path)) {
//       return element.children[0];
//     } else {
//       return this.nextSiblingOrAncestorSibling(this.workspace.getParent(element.path), element);
//     }
//   }

//   nextSiblingOrAncestorSibling(parent: WorkspaceElement, element: WorkspaceElement): WorkspaceElement {
//     let sibling = parent;
//     if (parent != null) {
//       let elementIndex = parent.children.indexOf(element);
//       if (elementIndex + 1 < parent.children.length) { // implicitly assuming elementIndex > -1
//         sibling = parent.children[elementIndex + 1];
//       } else {
//         sibling = this.nextSiblingOrAncestorSibling(this.workspace.getParent(parent.path), parent);
//       }
//     }
//     return sibling;
//   }

//   previousVisible(element: WorkspaceElement): WorkspaceElement {
//     let parent = this.workspace.getParent(element.path);
//     if (parent != null) {
//       let elementIndex = parent.children.indexOf(element);
//       if (elementIndex === 0) {
//         return parent;
//       } else {
//         return this.lastVisibleDescendant(parent.children[elementIndex - 1]);
//       }
//     }
//     return null;
//   }

//   lastVisibleDescendant(element: WorkspaceElement): WorkspaceElement {
//     if (element.type === ElementType.Folder && this.uiState.isExpanded(element.path)) {
//       return this.lastVisibleDescendant(element.children[element.children.length - 1]);
//     } else {
//       return element;
//     }
//   }

// }
