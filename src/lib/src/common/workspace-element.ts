import { ElementState } from "./element-state";

export class WorkspaceElement {
  name: string;
  path: string;
  state?: string = ElementState.Idle;
  type: string;
  children: WorkspaceElement[];
}

export function nameWithoutFileExtension(element: WorkspaceElement): string {
  let delimiterIndex = element.name.lastIndexOf('.');
  if (delimiterIndex >= 0) {
    return element.name.substring(0, delimiterIndex);
  } else {
    return element.name;
  }
};
