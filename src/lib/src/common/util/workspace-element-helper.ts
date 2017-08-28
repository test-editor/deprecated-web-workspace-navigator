import { ElementType } from '../element-type';
import { WorkspaceElement } from '../workspace-element';

function endWithSlash(path: string) {
  return path.endsWith('/') ? path : path + '/';
}

export function getDirectory(element: WorkspaceElement): string {
  if (!element) {
    return "";
  }
  if (element.type === ElementType.Folder) {
    return endWithSlash(element.path);
  } else if (element.type === ElementType.File) {
    let split = element.path.split('/');
    split.pop();
    let parentPath = split.join('/');
    return endWithSlash(parentPath);
  }
  throw new Error("Invalid element type: " + element.type);
}
