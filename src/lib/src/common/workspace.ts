import { WorkspaceElement } from './workspace-element';
import { Injectable } from '@angular/core';
import { PersistenceService } from '../service/persistence/persistence.service';
import { TestExecutionService } from '../service/execution/test.execution.service';
import { ElementType } from './element-type';
import { UiState } from '../component/ui-state';

@Injectable()
export class Workspace {

  private root: WorkspaceElement = null;
  private uiState: UiState;
  private pathToElement = new Map<string, WorkspaceElement>();

  constructor(root: WorkspaceElement) {
    this.uiState = new UiState();
    this.reload(root);
  }

  public reload(newRoot: WorkspaceElement): void {
    this.root = newRoot;
    if (this.root !== null) {
      this.uiState.setExpanded(this.root.path, true);
      this.addToMap(this.root);
    }
  }

  private addToMap(element: WorkspaceElement): void {
    let path = this.normalizePath(element.path);
    this.pathToElement.set(path, element);
    element.children.forEach(child => this.addToMap(child));
  }

  private normalizePath(path: string): string {
    const leadingSlashes = /^\/+/;
    const trailingSlashes = /\/+$/;
    let normalized = path.replace(leadingSlashes, '').replace(trailingSlashes, '');
    return normalized;
  }

  /**
   * Calculates all the subpaths of a given path.
   * The full path is not included in the output.
   */
  getSubpaths(path: string): string[] {
    let normalized = this.normalizePath(path);
    let [first, ...rest] = normalized.split('/');
    let hasSubpaths = rest.length > 0;
    if (hasSubpaths) {
      let result = [first];
      let lastPath = first;
      for (let i = 0; i < rest.length - 1; i++) {
        let segment = rest[i];
        lastPath = lastPath + '/' + segment;
        result.push(lastPath);
      }
      return result;
    } else {
      return [];
    }
  }

  getElement(path: string): WorkspaceElement | undefined {
    let normalized = this.normalizePath(path);
    return this.pathToElement.get(normalized);
  }

  getParent(path: string): WorkspaceElement {
    let normalized = this.normalizePath(path);
    if (normalized !== '') {
      let lastSeparatorIndex = normalized.lastIndexOf('/');
      if (lastSeparatorIndex >= 0) {
        let parentPath = normalized.substring(0, lastSeparatorIndex);
        return this.getElement(parentPath);
      } else if (this.normalizePath(this.root.path) === '') {
        return this.root;
      }
    }
    return null;
  }

  getRootPath(): string {
    return this.root.path;
  }

  getActive(): string {
    return this.uiState.activeEditorPath;
  }

  setActive(path: string) {
    this.uiState.activeEditorPath = path;
  }

  getSelected(): string {
    return this.uiState.selectedElement.path;
  }

  setSelected(path: string) {
    this.uiState.selectedElement = this.getElement(path);
  }

  isDirty(path: string): boolean {
    return this.uiState.isDirty(path);
  }

  setDirty(path: string, dirty: boolean): void {
    this.uiState.setDirty(path, dirty);
  }

  isExpanded(path: string): boolean {
    return this.uiState.isExpanded(path);
  }

  setExpanded(path: string, expanded: boolean): void {
    this.uiState.setExpanded(path, expanded);
  }

  collapseAll(): void {
    this.uiState.clearExpanded();
    this.uiState.setExpanded(this.root.path, true);
  }

  revealElement(path: string): void {
    const subpaths = this.getSubpaths(path);
    subpaths.forEach(subpath => this.uiState.setExpanded(subpath, true));
    this.uiState.setExpanded(this.root.path, true);
  }

  newElement(type: string) {
    let selectedElement = this.uiState.selectedElement;
    if (selectedElement) {
      if (selectedElement.type === ElementType.Folder) {
        this.uiState.setExpanded(selectedElement.path, true);
      }
    }
    this.uiState.newElementRequest = {
      selectedElement: selectedElement,
      type: type
    };
  }


  nextVisible(element: WorkspaceElement): WorkspaceElement {
    if (element.children.length > 0 && this.uiState.isExpanded(element.path)) {
      return element.children[0];
    } else {
      return this.nextSiblingOrAncestorSibling(this.getParent(element.path), element);
    }
  }

  nextSiblingOrAncestorSibling(parent: WorkspaceElement, element: WorkspaceElement): WorkspaceElement {
    let sibling = parent;
    if (parent != null) {
      let elementIndex = parent.children.indexOf(element);
      if (elementIndex + 1 < parent.children.length) { // implicitly assuming elementIndex > -1
        sibling = parent.children[elementIndex + 1];
      } else {
        sibling = this.nextSiblingOrAncestorSibling(this.getParent(parent.path), parent);
      }
    }
    return sibling;
  }

  previousVisible(element: WorkspaceElement): WorkspaceElement {
    let parent = this.getParent(element.path);
    if (parent != null) {
      let elementIndex = parent.children.indexOf(element);
      if (elementIndex === 0) {
        return parent;
      } else {
        return this.lastVisibleDescendant(parent.children[elementIndex - 1]);
      }
    }
    return null;
  }

  lastVisibleDescendant(element: WorkspaceElement): WorkspaceElement {
    if (element.type === ElementType.Folder && this.uiState.isExpanded(element.path)) {
      return this.lastVisibleDescendant(element.children[element.children.length - 1]);
    } else {
      return element;
    }
  }
}
