export class WorkspaceMarkerUpdate {
  path: string;
  /**
   * Arbitrary Javascript object, whose attributes will be stored as marker fields associated with this update's path.
   * For example, if the object is
   * ```
   * {
   *   "status": "RUNNING",
   *   "name": "test.tcl"
   * }
   * ```
   * then markers named 'status' and 'name' will be created, and assigned the values 'RUNNING' and 'test.tcl', respectively.
   */
  markers: any;
}
