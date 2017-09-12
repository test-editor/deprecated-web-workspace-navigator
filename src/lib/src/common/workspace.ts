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

  getSubpaths(path: string): string[] {
    let normalized = this.normalizePath(path);
    let [first, ...rest] = normalized.split('/');
    let result = [first];
    let lastPath = first;
    for (let segment of rest) {
      lastPath = lastPath + '/' + segment;
      result.push(lastPath);
    }
    return result;
  }

  getElement(path: string): WorkspaceElement | undefined {
    let normalized = this.normalizePath(path);
    return this.pathToElement.get(normalized);
  }

}
