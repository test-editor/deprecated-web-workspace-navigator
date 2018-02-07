import { ElementState } from "./element-state";

export class WorkspaceElementInfo
{
  name: string;
  path: string;
  state?: ElementState = ElementState.Idle;
  type: string;
}

export class LinkedWorkspaceElement extends WorkspaceElementInfo
{
  childPaths: string[]
}

export class WorkspaceElement extends WorkspaceElementInfo {
  children: WorkspaceElement[];
}

export namespace WorkspaceElement {

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
