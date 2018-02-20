import { WorkspaceElement, LinkedWorkspaceElement } from './workspace-element';
import { Injectable } from '@angular/core';
import { PersistenceService } from '../service/persistence/persistence.service';
import { TestExecutionService } from '../service/execution/test.execution.service';
import { ElementType } from './element-type';
import { UiState } from '../component/ui-state';
import { ElementState } from './element-state';

@Injectable()
export class Workspace {

  private root: WorkspaceElement = null;
  private uiState: UiState;
  private pathToElement = new Map<string, WorkspaceElement>();
  private readonly markers: any[] = [];

  constructor() {
    this.uiState = new UiState();
  }

  public reload(newRoot: WorkspaceElement): void {
    this.root = newRoot;
    if (this.root !== null) {
      this.uiState.setExpanded(this.root.path, true);
      this.addToMap(this.root);
    }
  }
  public get initialized(): boolean {
    return this.root != null;
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

  getMarkerValue(path: string, field: string): any {
    return this.performIfNotNullOrUndefined('path', path, () => {
      const marker = this.markers[path];
      if (marker) {
        if (marker[field] !== undefined) {
          return marker[field];
        } else {
          throw new Error(`The marker field "${field}" does not exist for path "${path}".`);
        }
      } else {
        throw new Error(`There are no marker fields for path "${path}".`);
      }
    });
  }

  getMarkers(path: string): any {
    return this.performIfNotNullOrUndefined('path', path, () => {
      return this.markers[path] ? this.markers[path] : {};
    });
  }

  setMarkerValue(path: string, field: string, value: any): void {
    if (field && field !== '') {
      this.performIfNotNullOrUndefined('path', path, () => {
        if (!this.markers[path]) {
          this.markers[path] = {};
        }
        this.markers[path][field] = value;
      });
    } else {
      throw new Error('empty field names are not allowed');
    }
  }

  private performIfNotNullOrUndefined(parameterName: string, parameterValue: any, action: () => any) {
    if (parameterValue != null) {
      return action();
    } else {
      throw new Error(`${parameterName} must not be ${parameterValue}`);
    }
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

  getElementInfo(path: string): LinkedWorkspaceElement {
    if (path != null) {
      const element = this.getWorkspaceElement(path);
      return { name: element.name, path: element.path, type: element.type, childPaths: element.children.map(child => child.path) };
    } else {
      return undefined;
    }
  }

  private getWorkspaceElement(path: string): WorkspaceElement | undefined {
    let normalized = this.normalizePath(path);
    return this.pathToElement.get(normalized);
  }


  private getParent(path: string): WorkspaceElement {
    let normalized = this.normalizePath(path);
    if (normalized !== '') {
      let lastSeparatorIndex = normalized.lastIndexOf('/');
      if (lastSeparatorIndex >= 0) {
        let parentPath = normalized.substring(0, lastSeparatorIndex);
        return this.getWorkspaceElement(parentPath);
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
    if (this.contains(path)) {
    this.uiState.activeEditorPath = path;
  }
    // TODO error on else?
  }

  contains(path: string): boolean {
    return path != null && this.pathToElement.has(this.normalizePath(path));
  }

  hasSubElements(path: string): boolean {
    return this.getWorkspaceElement(path).children.length > 0;
  }

  setTestStatus(path: string, status: ElementState) {
    this.getWorkspaceElement(path).state = status;
  }

  getTestStatus(path: string): ElementState {
    return this.getWorkspaceElement(path).state;
  }

  nameWithoutFileExtension(path: string): string {
    const name = this.getWorkspaceElement(path).name;
    let delimiterIndex = name.lastIndexOf('.');
    if (delimiterIndex >= 0) {
      return name.substring(0, delimiterIndex);
    } else {
      return name;
    }
  }

  getSelected(): string {
    return this.uiState.selectedElement ? this.uiState.selectedElement.path : null;
  }

  isSelected(path: string): boolean {
    const selected = this.getSelected();
    return selected === path;
  }

  setSelected(path: string) {
    this.uiState.selectedElement = (path == null ? null : this.getWorkspaceElement(path));
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
    if (this.contains(path) && this.getWorkspaceElement(path).type === ElementType.Folder) {
      this.uiState.setExpanded(path, expanded);
    }
  }

  toggleExpanded(path: string): void {
    this.uiState.toggleExpanded(path);
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

  hasNewElementRequest(): boolean {
    return this.uiState.newElementRequest != null;
  }

  getNewElement() {
    if (this.hasNewElementRequest()) {
      return this.uiState.newElementRequest.selectedElement;
    } else {
      return null;
    }
  }

  getNewElementType(): string {
    if (this.hasNewElementRequest()) {
      return this.uiState.newElementRequest.type;
    } else {
      return null;
    }
  }

  removeNewElementRequest(): void {
    this.uiState.newElementRequest = null;
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

  selectPredecessor(): void {
    const predecessor = this.previousVisible(this.getSelected());
    if (predecessor != null) {
      this.setSelected(predecessor);
    }
  }

  selectSuccessor(): void {
    const successor = this.nextVisible(this.getSelected());
    if (successor != null) {
      this.setSelected(successor);
    }
  }

  private nextVisible(elementPath: string): string {
    const element = this.getWorkspaceElement(elementPath);
    if (element.children.length > 0 && this.uiState.isExpanded(element.path)) {
      return element.children[0].path;
    } else {
      return this.nextSiblingOrAncestorSibling(this.getParent(elementPath), element);
    }
  }

  private nextSiblingOrAncestorSibling(parent: WorkspaceElement, element: WorkspaceElement): string {
    let sibling: string = null;
    if (parent != null) {
      sibling = parent.path;
      const elementIndex = parent.children.indexOf(element);
      if (elementIndex + 1 < parent.children.length) { // implicitly assuming elementIndex > -1
        sibling = parent.children[elementIndex + 1].path;
      } else {
        sibling = this.nextSiblingOrAncestorSibling(this.getParent(parent.path), parent);
      }
    }
    return sibling;
  }

  private previousVisible(elementPath: string): string {
    let parent = this.getParent(elementPath);
    const element = this.getWorkspaceElement(elementPath);
    if (parent != null) {
      let elementIndex = parent.children.indexOf(element);
      if (elementIndex === 0) {
        return parent.path;
      } else {
        return this.lastVisibleDescendant(parent.children[elementIndex - 1]);
      }
    }
    return null;
  }

  private lastVisibleDescendant(element: WorkspaceElement): string {
    if (element.type === ElementType.Folder && this.uiState.isExpanded(element.path)) {
      return this.lastVisibleDescendant(element.children[element.children.length - 1]);
    } else {
      return element.path;
    }
  }

}
