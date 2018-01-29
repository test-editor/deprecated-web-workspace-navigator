import { ElementState } from "./element-state";

export class WorkspaceElement {
  name: string;
  path: string;
  state?: ElementState = ElementState.Idle;
  type: string;
  children: WorkspaceElement[];
}

export namespace WorkspaceElement {

  export function nameWithoutFileExtension(element: WorkspaceElement): string {
    let delimiterIndex = element.name.lastIndexOf('.');
    if (delimiterIndex >= 0) {
      return element.name.substring(0, delimiterIndex);
    } else {
      return element.name;
    }
  }

  export function copyOf(original: WorkspaceElement): WorkspaceElement {
    let copy = new WorkspaceElement();
    copy.name = original.name;
    copy.path = original.path;
    copy.type = original.type;
    if (original.state) {
      copy.state = original.state;
    }
    copy.children = original.children.map(copyOf);
    return copy;
  }
}
