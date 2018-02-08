import { ElementState } from '../element-state';
import { MarkerState } from './marker.state';

describe('MarkerState', () => {

  let sampleMarkerState: MarkerState;

  beforeEach(() => {
    sampleMarkerState = {
      condition: (marker) => marker.testStatus === ElementState.Running,
      cssClasses: 'fa-spinner fa-spin',
      label: (marker) => `Test ${marker.name} is running`,
    };
  });

  it('conditions can be invoked', () => {
    // given
    const marker = { testStatus: ElementState.Running };

    // when
    const actualResult = sampleMarkerState.condition(marker);

    // then
    expect(actualResult).toBeTruthy();
  });

  it('returns the correct label', () => {
    // given
    const markerState: MarkerState = {
      condition: (marker) => marker['testStatus'] === ElementState.Running,
      cssClasses: 'fa-spinner fa-spin',
      label: (marker) => `Test ${marker.name} is running`,
    };
    const marker = { name: 'sampleTest.tcl' };

    // when
    const actualLabel = markerState.label(marker);

    // then
    expect(actualLabel).toEqual('Test sampleTest.tcl is running');
  });
});
