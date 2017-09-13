import { ElementType } from './element-type';
import { WorkspaceElement } from './workspace-element';

export class Workspace {

  root: WorkspaceElement;
  private pathToElement = new Map<string, WorkspaceElement>();

  static getDirectory(element: WorkspaceElement): string {
    if (element) {
      if (element.type === ElementType.Folder) {
        return Workspace.normalizePath(element.path);
      } else {
        const lastPathSegment = /\/[^\/]*$/;
        let parent = element.path.replace(lastPathSegment, '');
        return Workspace.normalizePath(parent);
      }
    } else {
      return '';
    }
  }

  static normalizePath(path: string): string {
    const leadingSlashes = /^\/+/;
    const trailingSlashes = /\/+$/;
    let normalized = path.replace(leadingSlashes, '').replace(trailingSlashes, '');
    return normalized;
  }

  constructor(root: WorkspaceElement) {
    this.root = root;
    this.addToMap(root);
  }

  private addToMap(element: WorkspaceElement): void {
    let path = Workspace.normalizePath(element.path);
    this.pathToElement.set(path, element);
    element.children.forEach(child => this.addToMap(child));
  }



  getSubpaths(path: string): string[] {
    let normalized = Workspace.normalizePath(path);
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
    let normalized = Workspace.normalizePath(path);
    return this.pathToElement.get(normalized);
  }

}
