import { WorkspaceMarkerUpdate } from './workspace.marker.update';

export class WorkspaceObserver {
  observe: () => Promise<WorkspaceMarkerUpdate[]>
  stopOn: (value: WorkspaceMarkerUpdate[]) => boolean
}
