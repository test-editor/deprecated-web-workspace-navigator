import { WorkspaceElement } from '../workspace-element';
import { MarkerState } from './marker.state';

export class Field {
  condition: (element: WorkspaceElement) => boolean;
  states: MarkerState[];
}
