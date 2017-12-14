import { ElementState } from "./element-state";

export class WorkspaceElement {
  name: string;
  path: string;
  state?: string = ElementState.Idle;
  type: string;
  children: WorkspaceElement[];
}
