import { Field } from './field.setup';
import { ElementState } from '../element-state';


describe('Field', () => {
  it('can be initialized', () => {
    const testField: Field = {
      condition: (element) => element && element.name.endsWith('tcl'),
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
    };
  });
});

// exports['     <-- triggers SystemJS regex to trick it into applying CommonJS module wrapper
