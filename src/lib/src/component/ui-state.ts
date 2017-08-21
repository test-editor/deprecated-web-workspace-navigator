export class UiState {

  activeEditorPath: String;
  selectedPath: String;

  private dirtyElements: boolean[] = [];

  isDirty(path: string): boolean {
    return this.dirtyElements[path];
  }

  setDirty(path: string, dirty: boolean): void {
    this.dirtyElements[path] = dirty;
  }

}
