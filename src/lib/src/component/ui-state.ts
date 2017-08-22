import { WorkspaceElement } from '../common/workspace-element';

export class UiState {

  activeEditorPath: string;
  selectedElement: WorkspaceElement;

  private dirtyElements: boolean[] = [];

  isDirty(path: string): boolean {
    return this.dirtyElements[path];
  }

  setDirty(path: string, dirty: boolean): void {
    this.dirtyElements[path] = dirty;
  }

}
