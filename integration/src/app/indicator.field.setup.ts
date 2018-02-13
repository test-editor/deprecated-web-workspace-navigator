import { ElementState, IndicatorFieldSetup, WorkspaceElementInfo } from '@testeditor/workspace-navigator';

/**
 * Note: the Angular AOT compiler does not support function expressions in decorators,
 * see e.g. https://github.com/angular/angular/issues/10789. Since the indicator field
 * setup is included into the integration app's NgModule decorator, this is worked
 * around by defining and exporting dedicated functions here.
 */

export const testEditorIndicatorFieldSetup: IndicatorFieldSetup = {
  fields: [
    {
      condition: isTclFile,
      states: [{
        condition: testIsRunning,
        cssClasses: 'fa fa-spinner fa-spin',
        label: runningLabel,
      }, {
        condition: testHasSucceeded,
        cssClasses: 'fa fa-circle test-success',
        label: succeededLabel,
      }, {
        condition: testHasFailed,
        cssClasses: 'fa fa-circle test-failure',
        label: failedLabel,
      }]
    }
  ]
};

export function isTclFile(element: WorkspaceElementInfo): boolean {
  return element && element.name.endsWith('tcl');
}

export function testIsRunning(marker: any): boolean {
  return marker.testStatus === ElementState.Running;
}

export function testHasSucceeded(marker: any): boolean {
  return marker.testStatus === ElementState.LastRunSuccessful;
}

export function testHasFailed(marker: any): boolean {
  return marker.testStatus === ElementState.LastRunFailed;
}

export function runningLabel(marker: any): string {
  return `Test "${marker.name}" is running`;
}

export function succeededLabel(marker: any): string {
  return `Last run of test "${marker.name}" was successful`;
}

export function failedLabel(marker: any): string {
  return `Last run of test "${marker.name}" has failed`;
}
