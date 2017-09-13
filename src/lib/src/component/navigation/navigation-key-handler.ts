import { UiState } from '../ui-state';
import { ElementType } from '../../common/element-type';
import { Workspace } from '../../common/workspace';
import { WorkspaceElement } from '../../common/workspace-element';

export class NavigationKeyHandler {

  constructor(public uiState: UiState, public workspace: Workspace) {
  }

  handleKeyboardEvent(event: KeyboardEvent): void {
    let key = event.key;
    let selectedElement = this.uiState.selectedElement;
    if (selectedElement) {
      let expanded = this.uiState.isExpanded(selectedElement.path);
      if (key === 'ArrowRight') {
        this.handleArrowRight(selectedElement, expanded);
      } else if (key === 'ArrowLeft') {
        this.handleArrowLeft(selectedElement, expanded);
      }
    } // else: do nothing if no element is selected
  }

  handleArrowRight(element: WorkspaceElement, expanded: boolean): void {
    if (element.type === ElementType.Folder) {
      if (expanded) {
        let firstChild = element.children[0];
        if (firstChild) {
          this.uiState.selectedElement = firstChild;
        }
      } else {
        this.uiState.setExpanded(element.path, true);
      }
    } // else: do nothing for files
  }

  handleArrowLeft(element: WorkspaceElement, expanded: boolean): void {
    if (expanded && element.type === ElementType.Folder) {
      this.uiState.setExpanded(element.path, false);
    } else {
      // get the parent and select it
    }
  }

}
