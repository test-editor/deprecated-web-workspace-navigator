import { Field, MarkerState, ElementState, IndicatorFieldSetup } from '@testeditor/workspace-navigator';

export const testEditorIndicatorFieldSetup: IndicatorFieldSetup = {
  fields: [
    {
      condition: (element) => element && element.name.endsWith('.tcl'),
      states: [{
        condition: (marker) => marker.testStatus === ElementState.Running,
        cssClasses: 'fa fa-spinner fa-spin',
        label: (marker) => `Test "${marker.name}" is running`,
      }, {
        condition: (marker) => marker.testStatus === ElementState.LastRunSuccessful,
        cssClasses: 'fa fa-circle test-success',
        label: (marker) => `Last run of test "${marker.name}" was successful`,
      }, {
        condition: (marker) => marker.testStatus === ElementState.LastRunFailed,
        cssClasses: 'fa fa-circle test-failure',
        label: (marker) => `Last run of test "${marker.name}" has failed`,
      }]
    }, {
      condition: (element) => element && element.type === 'file',
      states: [{
        condition: (marker) => marker.validation.errors > 0,
        cssClasses: 'fa fa-exclamation-circle validation-errors',
        label: validationLabel
      }, {
        condition: (marker) => marker.validation.errors <= 0 && marker.validation.warnings > 0,
        cssClasses: 'fa fa-exclamation-triangle validation-warnings',
        label: validationLabel
      }, {
        condition: (marker) => marker.validation.errors <= 0 && marker.validation.warnings <= 0 && marker.validation.infos > 0,
        cssClasses: 'fa fa-info-circle validation-infos',
        label: validationLabel
      }]
    }
  ]
};

export function validationLabel(marker: any): string {
  let label = '';
  if (marker.validation.errors > 0) {
    label += `${marker.validation.errors} error(s)`;
  }
  if (marker.validation.warnings > 0) {
    if (label.length > 0) {
      label += ', ';
    }
    label += `${marker.validation.warnings} warning(s)`
  }
  if (marker.validation.infos > 0) {
    if (label.length > 0) {
      label += ', ';
    }
    label += `${marker.validation.infos} info(s)`
  }
  return label;
}
