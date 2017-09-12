import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { By } from '@angular/platform-browser';
import { MessagingModule, MessagingService } from '@testeditor/messaging-service';
import { mock, when, anyOfClass, instance, verify, resetCalls } from 'ts-mockito';

import { PersistenceService } from '../../service/persistence/persistence.service';
import { PersistenceServiceConfig } from '../../service/persistence/persistence.service.config';
import { NewElementComponent } from '../tree-viewer/new-element.component';
import { TreeViewerComponent } from '../tree-viewer/tree-viewer.component';
import { NavigationComponent } from './navigation.component';
import { Workspace } from '../../common/workspace';
import { WorkspaceElement } from '../../common/workspace-element';
import { ElementType } from '../../common/element-type';
import { testBedSetup } from '../tree-viewer/tree-viewer.component.spec';
import { UiState } from '../ui-state';

import * as events from '../event-types';

describe('NavigationComponent', () => {

  const examplePath = "some/path.txt";

  let component: NavigationComponent;
  let fixture: ComponentFixture<NavigationComponent>;
  let persistenceService: PersistenceService;
  let messagingService: MessagingService;
  let spy: jasmine.Spy;
  let sidenav: DebugElement;

  let listedFile: WorkspaceElement = {
    name: "file.tcl",
    path: "path/to/file.tcl",
    type: ElementType.File,
    children: []
  };

  function createRootWithSubfolder() {
    let subfolder: WorkspaceElement = {
      name: "subfolder",
      path: "root/subfolder",
      type: ElementType.Folder,
      children: []
    };
    let root: WorkspaceElement = {
      name: "root",
      path: "root",
      type: ElementType.Folder,
      children: [subfolder]
    };
    component.workspace = new Workspace(root);
  }

  beforeEach(async(() => {
    // Mock PersistenceService
    persistenceService = mock(PersistenceService);
    when(persistenceService.listFiles()).thenReturn(Promise.resolve(listedFile));

    TestBed.configureTestingModule({
      declarations: [
        NavigationComponent,
        TreeViewerComponent,
        NewElementComponent
      ],
      imports: [
        FormsModule,
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

  it('sets workspaceRoot initially', async(() => {
    fixture.whenStable().then(() => {
      expect(component.workspace.root.name).toEqual(listedFile.name);
    });
  }));

  it('expands workspaceRoot initially', async(() => {
    fixture.whenStable().then(() => {
      expect(component.uiState.isExpanded(listedFile.path)).toBeTruthy();
    });
  }));

  it('displays an error when workspace could not be retrieved', async(() => {
    // given
    when(persistenceService.listFiles()).thenReturn(Promise.reject("failed"));

    // when
    component.retrieveWorkspaceRoot();

    // then
    fixture.whenStable().then(() => {
      fixture.detectChanges();
      expect(component.errorMessage).toBeTruthy();
      let alert = fixture.debugElement.query(By.css(".alert"));
      expect(alert).toBeTruthy();
      expect(alert.nativeElement.innerText).toEqual(component.errorMessage);
    });
  }));

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

  it('updates the UI state when an "navigation.deleted" event is received', () => {
    // given
    component.uiState.setDirty(listedFile.path, true);
    component.uiState.setExpanded(listedFile.path, true);
    component.uiState.selectedElement = listedFile;

    // when
    messagingService.publish(events.NAVIGATION_DELETED, { name: listedFile.name, path: listedFile.path });

    // then
    expect(component.uiState.isDirty(listedFile.path)).toBeFalsy();
    expect(component.uiState.isExpanded(listedFile.path)).toBeFalsy();
    expect(component.uiState.selectedElement).toBeFalsy();
  });

  it('refreshes the workspace when "navigation.deleted" event is received', () => {
    // given
    resetCalls(persistenceService);

    // when
    messagingService.publish(events.NAVIGATION_DELETED, { name: listedFile.name, path: listedFile.path });

    // then
    verify(persistenceService.listFiles()).once();
  });

  it('updates the UI state when an "navigation.select" event is received', () => {
    // when
    messagingService.publish(events.NAVIGATION_SELECT, listedFile);

    // then
    expect(component.uiState.selectedElement).toEqual(listedFile);
  });

  it('updates the UI state for creating a new file', () => {
    // given
    component.workspace = new Workspace(listedFile);
    fixture.detectChanges();
    let newFileIcon = sidenav.query(By.css('#new-file'))

    // when
    newFileIcon.nativeElement.click();

    // then
    let newElementRequest = component.uiState.newElementRequest;
    expect(newElementRequest).toBeTruthy();
    expect(newElementRequest.type).toEqual('file');
  });

  it('updates the UI state for creating a new folder', () => {
    // given
    component.workspace = new Workspace(listedFile);
    fixture.detectChanges();
    let newFolder = sidenav.query(By.css('#new-folder'))

    // when
    newFolder.nativeElement.click();

    // then
    let newElementRequest = component.uiState.newElementRequest;
    expect(newElementRequest).toBeTruthy();
    expect(newElementRequest.type).toEqual('folder');
  })

  it('expands selected element on creation of new element', () => {
    // given
    createRootWithSubfolder();
    let subfolder = component.workspace.root.children[0];
    component.uiState.selectedElement = subfolder;
    fixture.detectChanges();
    expect(component.uiState.isExpanded(subfolder.path)).toBeFalsy();

    // when
    component.newElement('file')

    // then
    expect(component.uiState.newElementRequest.selectedElement).toBe(subfolder);
    expect(component.uiState.isExpanded(subfolder.path)).toBeTruthy();
  });

  it('collapses all when icon is clicked', () => {
    // given
    createRootWithSubfolder();
    let subfolder = component.workspace.root.children[0];
    component.uiState.setExpanded(subfolder.path, true);
    fixture.detectChanges();
    let collapseAllIcon = sidenav.query(By.css('#collapse-all'))

    // when
    collapseAllIcon.nativeElement.click();

    // then
    expect(component.uiState.isExpanded(subfolder.path)).toBeFalsy();
    expect(component.uiState.isExpanded(component.workspace.root.path)).toBeTruthy();
  });

  it('can reveal subfolder', () => {
    // given
    createRootWithSubfolder();
    let subfolder = component.workspace.root.children[0];

    // when
    component.revealElement(subfolder.path + '/');

    // then
    expect(component.uiState.isExpanded(subfolder.path)).toBeTruthy();
    expect(component.uiState.isExpanded(component.workspace.root.path)).toBeTruthy();
  });

  it('can select subfolder', () => {
    // given
    createRootWithSubfolder();
    let subfolder = component.workspace.root.children[0];

    // when
    component.selectElement(subfolder.path + '/');

    // then
    expect(component.uiState.selectedElement).toBe(subfolder);
  });

  it('reveals and selects element when an "navigation.created" event is received', async(() => {
    // given
    createRootWithSubfolder();
    let subfolder = component.workspace.root.children[0];
    when(persistenceService.listFiles()).thenReturn(Promise.resolve(component.workspace.root));
    resetCalls(persistenceService);

    // when
    messagingService.publish(events.NAVIGATION_CREATED, { path: subfolder.path });

    // then
    verify(persistenceService.listFiles()).once();
    fixture.whenStable().then(() => {
      expect(component.uiState.isExpanded(subfolder.path)).toBeTruthy();
      expect(component.uiState.isExpanded(component.workspace.root.path)).toBeTruthy();
      expect(component.uiState.selectedElement).toBe(subfolder);
    });
  }));

});
