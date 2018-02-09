import { async, TestBed, ComponentFixture } from '@angular/core/testing';
import { IndicatorBoxComponent } from './indicator.box.component';
import { By } from '@angular/platform-browser';
import { MarkerState } from '../../common/markers/marker.state';
import { ElementState } from '../../common/element-state';
import { Workspace } from '../../common/workspace';

describe('IndicatorBoxComponent', () => {
  let component: IndicatorBoxComponent;
  let fixture: ComponentFixture<IndicatorBoxComponent>;

  const sampleMarkerStates: MarkerState[] = [{
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
  }];

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        IndicatorBoxComponent
      ],
      imports: [
      ],
      providers: [
        // { provide: PersistenceService, useValue: instance(persistenceService) },
        // { provide: TestExecutionService, useValue: instance(executionService) },
        // { provide: WindowService, useValue: null}
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(IndicatorBoxComponent);
    component = fixture.componentInstance;
  });

  it('Can be instantiated', () => {
    expect(component).toBeTruthy();
  });

  it('uses the active marker state`s label and css classes', () => {
    // given
    const samplePath = 'sample/path/to/test.tcl';
    const workspace = new Workspace();
    workspace.setMarkerValue(samplePath, 'testStatus', ElementState.Running);
    workspace.setMarkerValue(samplePath, 'name', 'test');

    component.workspace = workspace;
    component.path = samplePath;
    component.states = sampleMarkerStates;

    // when
    fixture.detectChanges();

    // then
    const indicatorBoxTag = fixture.debugElement.query(By.css('div'));
    expect(indicatorBoxTag.nativeElement.attributes['title'].value).toEqual('Test "test" is running');
    expect(indicatorBoxTag.classes['fa-spinner']).toBeTruthy();
    expect(indicatorBoxTag.classes['fa-spin']).toBeTruthy();
  });

  it('changes label and css classes in accordance with changing marker states', () => {
    // given
    const samplePath = 'sample/path/to/test.tcl';
    const workspace = new Workspace();
    workspace.setMarkerValue(samplePath, 'testStatus', ElementState.Running);
    workspace.setMarkerValue(samplePath, 'name', 'test');
    component.workspace = workspace;
    component.path = samplePath;
    component.states = sampleMarkerStates;
    fixture.detectChanges();

    // when
    workspace.setMarkerValue(samplePath, 'testStatus', ElementState.LastRunSuccessful);
    fixture.detectChanges();

    // then
    const indicatorBoxTag = fixture.debugElement.query(By.css('div'));
    expect(indicatorBoxTag.nativeElement.attributes['title'].value).toEqual('Last run of test "test" was successful');
    expect(indicatorBoxTag.classes['fa-circle']).toBeTruthy();
    expect(indicatorBoxTag.classes['test-success']).toBeTruthy();
  });
});
