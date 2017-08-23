import { WorkspaceElement } from '../common/workspace-element';

export class UiState {

  activeEditorPath: string;
  selectedElement: WorkspaceElement;

  private expandedElements: boolean[] = [];
  private dirtyElements: boolean[] = [];

  isExpanded(path: string): boolean {
    return this.expandedElements[path];
  }

  setExpanded(path: string, expanded: boolean): void {
    this.expandedElements[path] = expanded;
  }

  toggleExpanded(path: string): void {
    this.expandedElements[path] = !this.expandedElements[path];
  }

  isDirty(path: string): boolean {
    return this.dirtyElements[path];
  }

  setDirty(path: string, dirty: boolean): void {
    this.dirtyElements[path] = dirty;
  }

}
