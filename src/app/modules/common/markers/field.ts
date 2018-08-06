import { WorkspaceElementInfo } from '../workspace-element';
import { MarkerState } from './marker.state';

export class Field {
  condition: (element: WorkspaceElementInfo) => boolean;
  states: MarkerState[];
}

export class IndicatorFieldSetup {
  fields: Field[];
}
