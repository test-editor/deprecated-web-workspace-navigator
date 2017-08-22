import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { HttpModule } from '@angular/http';
import { By } from '@angular/platform-browser';
import { MessagingModule, MessagingService } from '@testeditor/messaging-service';
import { mock, when, anyOfClass, instance } from 'ts-mockito';

import { PersistenceService } from '../../service/persistence/persistence.service';
import { PersistenceServiceConfig } from '../../service/persistence/persistence.service.config';
import { TreeViewerComponent } from '../tree-viewer/tree-viewer.component';
import { NavigationComponent } from './navigation.component';
import { WorkspaceElement} from '../../common/workspace-element';
import { ElementType } from '../../common/element-type';
import { testBedSetup } from '../tree-viewer/tree-viewer.component.spec';
import { UiState } from '../ui-state';

import * as events from '../event-types';

describe('NavigationComponent', () => {

  const examplePath = "some/path.txt";

  let component: NavigationComponent;
  let fixture: ComponentFixture<NavigationComponent>;
  let persistenceService : PersistenceService;
  let messagingService: MessagingService;
  let spy : jasmine.Spy;
  let sidenav : DebugElement;

  beforeEach(async(() => {
    // Mock PersistenceService
    let listedFiles: WorkspaceElement = {
      name: "file.tcl",
      path: "path/to/file.tcl",
      type: ElementType.File,
      children: []
    };
    persistenceService = mock(PersistenceService);
    when(persistenceService.listFiles()).thenReturn(Promise.resolve(listedFiles));

    TestBed.configureTestingModule({
      declarations: [
        NavigationComponent,
        TreeViewerComponent
      ],
      imports: [
        HttpModule,
        MessagingModule.forRoot()
      ],
      providers: [
        { provide: PersistenceService, useValue: instance(persistenceService) }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NavigationComponent);
    component = fixture.componentInstance;
    component.uiState = new UiState();
    messagingService = TestBed.get(MessagingService);
    fixture.detectChanges();
    sidenav = fixture.debugElement.query(By.css('.sidenav'));
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('sets workspaceRoot initially', () => {
    fixture.whenStable().then(() => {
      expect(component.workspaceRoot.name).toEqual("file.tcl");
    });
  });

  it('updates the UI state when an "editor.active" event is received', () => {
    // given
    expect(component.uiState.activeEditorPath).toBeFalsy();

    // when
    messagingService.publish(events.EDITOR_ACTIVE, { path: examplePath });

    // then
    expect(component.uiState.activeEditorPath).toEqual(examplePath);
    expect(component.uiState.selectedElement).toBeFalsy();
  });

  it('updates the UI state when an "editor.close" event is received', () => {
    // given
    component.uiState.setDirty(examplePath, true);

    // when
    messagingService.publish(events.EDITOR_CLOSE, { path: examplePath });

    // then
    expect(component.uiState.activeEditorPath).toBeFalsy();
    expect(component.uiState.isDirty(examplePath)).toBeFalsy();
  });

  it('updates the UI state when an "editor.dirtyStateChanged" event with dirty=true is received', () => {
    // when
    messagingService.publish(events.EDITOR_DIRTY_CHANGED, { path: examplePath, dirty: true });

    // then
    expect(component.uiState.isDirty(examplePath)).toBeTruthy();
  });

  it('updates the UI state when an "editor.dirtyStateChanged" event with dirty=false is received', () => {
    // given
    messagingService.publish(events.EDITOR_DIRTY_CHANGED, { path: examplePath, dirty: true });
    expect(component.uiState.isDirty(examplePath)).toBeTruthy();

    // when
    messagingService.publish(events.EDITOR_DIRTY_CHANGED, { path: examplePath, dirty: false });

    // then
    expect(component.uiState.isDirty(examplePath)).toBeFalsy();
  });

  it('updates the UI state when an "navigation.select" event is received', () => {
    // given
    let element: WorkspaceElement = {
      name: "file.tcl",
      path: "path/to/file.tcl",
      type: ElementType.File,
      children: []
    };

    // when
    messagingService.publish(events.NAVIGATION_SELECT, element);

    // then
    expect(component.uiState.selectedElement).toEqual(element);
  });

});
