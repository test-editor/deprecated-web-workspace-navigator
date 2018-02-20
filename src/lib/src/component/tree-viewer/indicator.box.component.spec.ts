import { async, TestBed, ComponentFixture } from '@angular/core/testing';
import { IndicatorBoxComponent } from './indicator.box.component';
import { By } from '@angular/platform-browser';
import { MarkerState } from '../../common/markers/marker.state';
import { ElementState } from '../../common/element-state';
import { Workspace } from '../../common/workspace';
import { Component, ViewChild } from '@angular/core';

describe('IndicatorBoxComponent', () => {
  let component: IndicatorBoxComponent;
  let hostComponent: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;

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

  @Component({
    selector: `host-component`,
    template: `<indicator-box [model]="{'workspace': workspace,'path': path, 'possibleStates': states}"></indicator-box>`
  })
  class TestHostComponent {
    @ViewChild(IndicatorBoxComponent)
    public indicatorBoxComponentUnderTest: IndicatorBoxComponent;

    workspace: Workspace;
    path: string;
    states: MarkerState[];
  }

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        IndicatorBoxComponent, TestHostComponent
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
    component = hostComponent.indicatorBoxComponentUnderTest;
  });

  it('Can be instantiated', () => {
    expect(component).toBeTruthy();
  });

  it('cssClasses returns a map of css class strings to boolean expressions', () => {
    // given
    hostComponent.path = 'sample/path/to/test.tcl';
    hostComponent.workspace = new Workspace();
    hostComponent.workspace.setMarkerValue(hostComponent.path, 'testStatus', ElementState.Running);
    hostComponent.workspace.setMarkerValue(hostComponent.path, 'name', 'test');
    hostComponent.states = sampleMarkerStates;
    fixture.detectChanges();

    // when
    const actualCssClasses = hostComponent.indicatorBoxComponentUnderTest.cssClasses;

    // then
    expect(actualCssClasses).toEqual('fa fa-spinner fa-spin');
  })

  it('uses the active marker state`s label and css classes', () => {
    // given
    hostComponent.path = 'sample/path/to/test.tcl';
    hostComponent.workspace = new Workspace();
    hostComponent.workspace.setMarkerValue(hostComponent.path, 'testStatus', ElementState.Running);
    hostComponent.workspace.setMarkerValue(hostComponent.path, 'name', 'test');
    hostComponent.states = sampleMarkerStates;

    // when
    fixture.detectChanges();

    // then
    const indicatorBoxTag = fixture.debugElement.query(By.css('div'));
    expect(indicatorBoxTag.nativeElement.attributes['title'].value).toEqual('Test "test" is running');
    expect(indicatorBoxTag.nativeElement.className).toEqual('fa fa-spinner fa-spin');
  });

  it('changes label and css classes in accordance with changing marker states', () => {
    // given
    hostComponent.path = 'sample/path/to/test.tcl';
    hostComponent.workspace = new Workspace();
    hostComponent.workspace.setMarkerValue(hostComponent.path, 'testStatus', ElementState.Running);
    hostComponent.workspace.setMarkerValue(hostComponent.path, 'name', 'test');
    hostComponent.states = sampleMarkerStates;
    fixture.detectChanges();
    const indicatorBoxTag = fixture.debugElement.query(By.css('div'));
    expect(indicatorBoxTag.nativeElement.attributes['title'].value).toEqual('Test "test" is running');
    expect(indicatorBoxTag.nativeElement.className).toEqual('fa fa-spinner fa-spin');

    // when
    hostComponent.workspace.setMarkerValue(hostComponent.path, 'testStatus', ElementState.LastRunSuccessful);
    fixture.detectChanges();

    // then
    expect(indicatorBoxTag.nativeElement.attributes['title'].value).toEqual('Last run of test "test" was successful');
    expect(indicatorBoxTag.nativeElement.className).toEqual('fa fa-circle test-success');
  });
});
