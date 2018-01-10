import { WorkspaceElement } from './workspace-element';

export class Workspace {

  root: WorkspaceElement;
  private pathToElement = new Map<string, WorkspaceElement>();

  constructor(root: WorkspaceElement) {
    this.root = root;
    this.addToMap(root);
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
}
