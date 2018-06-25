import { async, ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HttpClient } from '@angular/common/http';
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
import { ElementState } from '../../common/element-state';
import { nonExecutableFile, tclFile, setupWorkspace, mockedPersistenceService,
  HTTP_STATUS_CREATED, HTTP_STATUS_ERROR, succeedingSiblingOfTclFile,
  lastElement, responseBeforeTermination,
  subfolder, root, testEditorIndicatorFieldSetup, mockWorkspaceReloadRequestOnce, renamedSubfolder }
  from './navigation.component.test.setup';
import { flush } from '@angular/core/testing';
import { KeyActions } from '../../common/key.actions';
import { WindowService } from '../../service/browserObjectModel/window.service';
import { discardPeriodicTasks } from '@angular/core/testing';
import { flushMicrotasks } from '@angular/core/testing';
import { PathValidator } from '../tree-viewer/path-validator';
import { IndicatorBoxComponent } from '../tree-viewer/indicator.box.component';
import { IndicatorFieldSetup } from '../../common/markers/field';
import { MarkerObserver } from '../../common/markers/marker.observer';
import { WorkspaceObserver } from '../../common/markers/workspace.observer';
import { RenameElementComponent } from '../tree-viewer/rename-element.component';

describe('NavigationComponent', () => {

  const examplePath = 'some/path.txt';

  let component: NavigationComponent;
  let fixture: ComponentFixture<NavigationComponent>;
  let persistenceService: PersistenceService;
  let messagingService: MessagingService;
  let sidenav: DebugElement;

  beforeEach(async(() => {
    persistenceService = mockedPersistenceService();

    TestBed.configureTestingModule({
      declarations: [
        NavigationComponent,
        TreeViewerComponent,
        RenameElementComponent,
        NewElementComponent,
        IndicatorBoxComponent
      ],
      imports: [
        FormsModule,
        HttpClientModule,
        MessagingModule.forRoot()
      ],
      providers: [
        { provide: PersistenceService, useValue: instance(persistenceService) },
        { provide: WindowService, useValue: null},
        { provide: IndicatorFieldSetup, useValue: testEditorIndicatorFieldSetup},
        PathValidator,
        HttpClient
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NavigationComponent);
    component = fixture.componentInstance;
    messagingService = TestBed.get(MessagingService);
    tclFile.state = ElementState.Idle;
    mockWorkspaceReloadRequestOnce(messagingService, tclFile);
    fixture.detectChanges();
    sidenav = fixture.debugElement.query(By.css('.sidenav'));
  });

  it('should be created', async(() => {
      expect(component).toBeTruthy();
  }));

  it('sets workspaceRoot initially', async(() => {
    fixture.whenStable().then(() => {
      expect(component.getWorkspace().getRootPath()).toEqual(tclFile.path);
    });
  }));

  it('expands workspaceRoot initially', async(() => {
    fixture.whenStable().then(() => {
      expect(component.getWorkspace().isExpanded(tclFile.path)).toBeTruthy();
    });
  }));

  it('displays an error when workspace could not be retrieved', async(() => {
    // given + when
    component.retrieveWorkspaceRoot();
    messagingService.publish(events.WORKSPACE_RELOAD_RESPONSE, 'something that is not a WorkspaceElement');

    // then
    fixture.whenStable().then(() => {
      fixture.detectChanges();
      expect(component.errorMessage).toBeTruthy();
      let alert = fixture.debugElement.query(By.css('#errorMessage'));
      expect(alert).toBeTruthy();
      expect(alert.nativeElement.innerText).toEqual(component.errorMessage);
    });
  }));

  it('updates the UI state when an "editor.active" event is received', async(() => {
    // given
    setupWorkspace(component, messagingService, fixture);
    expect(component.getWorkspace().getActive()).toBeFalsy();

    // when
    messagingService.publish(events.EDITOR_ACTIVE, { path: tclFile.path });

    // then
    expect(component.getWorkspace().getActive()).toEqual(tclFile.path);
    expect(component.getWorkspace().getSelected()).toBeFalsy();
  }));

  it('updates the UI state when an "editor.close" event is received', async(() => {
    fixture.whenStable().then(() => {
    // given
    component.getWorkspace().setDirty(examplePath, true);

    // when
    messagingService.publish(events.EDITOR_CLOSE, { path: examplePath });

    // then
    expect(component.getWorkspace().getActive()).toBeFalsy();
    expect(component.getWorkspace().isDirty(examplePath)).toBeFalsy();
    });
  }));

  it('updates the UI state when an "editor.dirtyStateChanged" event with dirty=true is received', async(() => {
    fixture.whenStable().then(() => {
    // when
    messagingService.publish(events.EDITOR_DIRTY_CHANGED, { path: examplePath, dirty: true });

    // then
    expect(component.getWorkspace().isDirty(examplePath)).toBeTruthy();
    });
  }));

  it('updates the UI state when an "editor.dirtyStateChanged" event with dirty=false is received', async(() => {
    fixture.whenStable().then(() => {
    // given
    messagingService.publish(events.EDITOR_DIRTY_CHANGED, { path: examplePath, dirty: true });
    expect(component.getWorkspace().isDirty(examplePath)).toBeTruthy();

    // when
    messagingService.publish(events.EDITOR_DIRTY_CHANGED, { path: examplePath, dirty: false });

    // then
    expect(component.getWorkspace().isDirty(examplePath)).toBeFalsy();
    });
  }));

  it('updates the UI state when an "navigation.renamed" event is received', fakeAsync(() => {
    // given
    mockWorkspaceReloadRequestOnce(messagingService, renamedSubfolder);
    component.getWorkspace().reload(subfolder);
    component.getWorkspace().setDirty(subfolder.path, true);
    component.getWorkspace().setExpanded(subfolder.path, true);
    component.getWorkspace().setSelected(subfolder.path);

    // when
    messagingService.publish(events.NAVIGATION_RENAMED, { oldPath: subfolder.path, newPath: renamedSubfolder.path });

    // then
    expect(component.getWorkspace().isDirty(subfolder.path)).toBeFalsy();
    expect(component.getWorkspace().isExpanded(subfolder.path)).toBeFalsy();
    expect(component.getWorkspace().isDirty(renamedSubfolder.path)).toBeFalsy();
    expect(component.getWorkspace().isExpanded(renamedSubfolder.path)).toBeTruthy();
    expect(component.getWorkspace().getSelected()).toEqual(renamedSubfolder.path);
  }));

  it('updates the UI state when an "navigation.deleted" event is received', async(() => {
    // given
    fixture.whenStable().then(() => {
    component.getWorkspace().setDirty(subfolder.path, true);
    component.getWorkspace().setExpanded(subfolder.path, true);
    component.getWorkspace().setSelected(subfolder.path);

    // when
    messagingService.publish(events.NAVIGATION_DELETED, { name: subfolder.name, path: subfolder.path });

    // then
    expect(component.getWorkspace().isDirty(subfolder.path)).toBeFalsy();
    expect(component.getWorkspace().isExpanded(subfolder.path)).toBeFalsy();
    expect(component.getWorkspace().getSelected()).toBeFalsy();
  });
  }));

  it('refreshes the workspace when "navigation.deleted" event is received', fakeAsync(() => {
    // given
    const subscription = messagingService.subscribe(events.WORKSPACE_RELOAD_REQUEST, () => {
      subscription.unsubscribe();
      Promise.resolve(subfolder).then((newRoot) => messagingService.publish(events.WORKSPACE_RELOAD_RESPONSE, newRoot));
    });

    // when
    messagingService.publish(events.NAVIGATION_DELETED, { name: tclFile.name, path: tclFile.path });

    // then
    tick();
    expect(component.workspace.getRootPath()).toEqual(subfolder.path);
  }));

  it('updates the UI state when an "navigation.select" event is received', async(() => {
    fixture.whenStable().then(() => {
    // when
    messagingService.publish(events.NAVIGATION_SELECT, tclFile);

    // then
    expect(component.getWorkspace().getSelected()).toEqual(tclFile.path);
    });
  }));

  it('updates the UI state for creating a new file', fakeAsync(() => {
    // given
    component.workspace.reload(tclFile);
    fixture.detectChanges();
    let newFileIcon = sidenav.query(By.css('#new-file'));

    // when
    newFileIcon.nativeElement.click();

    // then
    expect(component.workspace.hasNewElementRequest()).toBeTruthy();
    expect(component.workspace.getNewElementType()).toEqual('file');
  }));

  it('updates the UI state for creating a new folder', fakeAsync(() => {
    // given
    component.workspace.reload(tclFile);
    tick();
    fixture.detectChanges();
    let newFolder = sidenav.query(By.css('#new-folder'))

    // when
    newFolder.nativeElement.click();

    // then
    expect(component.workspace.hasNewElementRequest()).toBeTruthy();
    expect(component.workspace.getNewElementType()).toEqual('folder');
  }));

  it('expands selected element on creation of new element', async(() => {
    // given
    setupWorkspace(component, messagingService, fixture);
      const rootInfo = component.getWorkspace().getElementInfo(component.getWorkspace().getRootPath());
      const subfolderPath = rootInfo.childPaths[0];
      component.getWorkspace().setSelected(subfolderPath);
      fixture.detectChanges();
      expect(component.getWorkspace().isExpanded(subfolderPath)).toBeFalsy();

      // when
      component.newElement('file');

      // then
      expect(component.workspace.getNewElement().path).toBe(subfolderPath);
      expect(component.getWorkspace().isExpanded(subfolderPath)).toBeTruthy();
  }));

  it('collapses all when icon is clicked', () => {
    // given
    setupWorkspace(component, messagingService, fixture);
    const rootPath = component.getWorkspace().getElementInfo(component.getWorkspace().getRootPath());
    let subfolderPath = rootPath.childPaths[0];
    component.getWorkspace().setExpanded(subfolderPath, true);
    fixture.detectChanges();
    let collapseAllIcon = sidenav.query(By.css('#collapse-all'));

    // when
    collapseAllIcon.nativeElement.click();

    // then
    expect(component.getWorkspace().isExpanded(subfolderPath)).toBeFalsy();
    expect(component.getWorkspace().isExpanded(root.path)).toBeTruthy();
  });

  it('refreshes navigator when refresh button is clicked', fakeAsync(() => {
    // given
    setupWorkspace(component, messagingService, fixture);

    let refreshIcon = sidenav.query(By.css('#refresh'));
    let newFile: WorkspaceElement = {
      name: 'newFile.tcl',
      path: 'newFile.tcl',
      type: ElementType.File,
      children: []
    };
    const subscription = messagingService.subscribe(events.WORKSPACE_RELOAD_REQUEST, () => {
      subscription.unsubscribe();
      Promise.resolve(newFile).then((newRoot) => messagingService.publish(events.WORKSPACE_RELOAD_RESPONSE, newRoot));
    });

    // when
    refreshIcon.nativeElement.click();

    // then
    tick();
    expect(component.getWorkspace().getRootPath()).toEqual(newFile.path);
  }));

  it('can reveal new folder', () => {
    // given
    setupWorkspace(component, messagingService, fixture);
    const rootPath = component.getWorkspace().getElementInfo(component.getWorkspace().getRootPath());
    const subfolderPath = rootPath.childPaths[0];
    const newFolder = component.getWorkspace().getElementInfo(subfolderPath).childPaths[0];

    // when
    component.revealElement(newFolder);

    // then
    expect(component.getWorkspace().isExpanded(subfolderPath)).toBeTruthy();
    expect(component.getWorkspace().isExpanded(root.path)).toBeTruthy();
    expect(component.getWorkspace().isExpanded(newFolder)).toBeFalsy();
  });

  it('can select subfolder', () => {
    // given
    setupWorkspace(component, messagingService, fixture);
    const subfolderPath = component.getWorkspace().getElementInfo(component.getWorkspace().getRootPath()).childPaths[0];

    // when
    component.selectElement(subfolderPath + '/');

    // then
    expect(component.getWorkspace().getSelected()).toBe(subfolderPath);
  });

  it('reveals and selects element when an "navigation.created" event is received', () => {
    // given
    setupWorkspace(component, messagingService, fixture);
    const newFolder = subfolder.children[0];

    // when
    messagingService.publish(events.NAVIGATION_CREATED, { path: newFolder.path });
    messagingService.publish(events.WORKSPACE_RELOAD_RESPONSE, root);

    // then
    expect(component.getWorkspace().isExpanded(subfolder.path)).toBeTruthy();
    expect(component.getWorkspace().isExpanded(component.getWorkspace().getRootPath())).toBeTruthy();
    expect(component.getWorkspace().isExpanded(newFolder.path)).toBeFalsy();
    expect(component.getWorkspace().getSelected()).toBe(newFolder.path);
  });

  it('element is not expanded when retrieving the workspace fails', async(() => {
    // given
    let path = 'example.txt';

    // when
    messagingService.publish(events.NAVIGATION_CREATED, { path: 'some/path' });
    messagingService.publish(events.WORKSPACE_RELOAD_RESPONSE, null);

    // then
    fixture.whenStable().then(() => {
      expect(component.getWorkspace().isExpanded(path)).toBeUndefined();
    });
  }));

  it('publishes test execution request for currently selected test file when "run" button is clicked', fakeAsync(() => {
    // given
    setupWorkspace(component, messagingService, fixture);
    component.getWorkspace().setSelected(tclFile.path);
    fixture.detectChanges();
    let runIcon = sidenav.query(By.css('#run'));
    let testExecCallback = jasmine.createSpy('testExecCallback');
    messagingService.subscribe('test.execute.request', testExecCallback);

    // when
    runIcon.nativeElement.click();
    tick();

    // then
    expect(testExecCallback).toHaveBeenCalledTimes(1);
    expect(testExecCallback).toHaveBeenCalledWith(tclFile.path);
  }));

  it('publishes test execution request for currently active test file when "run" button is clicked and no file is selected',
     fakeAsync(() => {
    // given
    setupWorkspace(component, messagingService, fixture);
    component.getWorkspace().setSelected(null);
    component.getWorkspace().setActive(tclFile.path);
    fixture.detectChanges();
    let runIcon = sidenav.query(By.css('#run'));
    let testExecCallback = jasmine.createSpy('testExecCallback');
    messagingService.subscribe('test.execute.request', testExecCallback);

    // when
    runIcon.nativeElement.click();
    tick(NavigationComponent.NOTIFICATION_TIMEOUT_MILLIS);

    // then
    expect(testExecCallback).toHaveBeenCalledTimes(1);
    expect(testExecCallback).toHaveBeenCalledWith(tclFile.path);
  }));

  it('disables the run button when selecting a non-executable file', async(() => {
    // given
    setupWorkspace(component, messagingService, fixture);
    let runIcon = sidenav.query(By.css('#run'));

    // when
    component.selectElement(nonExecutableFile.path);

    // then
    fixture.whenStable().then(() => {
      expect(runIcon.properties['disabled']).toBeTruthy();
    });
  }));

  it('disables the run button when selecting a non-executable file while an executable file remains active', async(() => {
    // given
    setupWorkspace(component, messagingService, fixture);
    let runIcon = sidenav.query(By.css('#run'));
    component.getWorkspace().setSelected(null);
    component.getWorkspace().setActive(tclFile.path);
    fixture.detectChanges();
    expect(runIcon.properties['disabled']).toBeFalsy();

    // when
    component.selectElement(nonExecutableFile.path);

    // then
    fixture.detectChanges();
    fixture.whenStable().then(() => {
      expect(runIcon.properties['disabled']).toBeTruthy();
    });
  }));

  it('disables the run button when selecting an already running test file', async(() => {
    // given
    setupWorkspace(component, messagingService, fixture);
    let runIcon = sidenav.query(By.css('#run'));
    component.workspace.setMarkerValue(tclFile.path, 'testStatus', { status: ElementState.Running });

    // when
    component.selectElement(tclFile.path);

    // then
    fixture.detectChanges();
    fixture.whenStable().then(() => {
      expect(runIcon.properties['disabled']).toBeTruthy();
    });
  }));

  it('enables the run button when selecting an executable file', async(() => {
    // given
    setupWorkspace(component, messagingService, fixture);

    fixture.detectChanges();
    let runIcon = sidenav.query(By.css('#run'));

    // when
    component.selectElement(tclFile.path);

    // then
    fixture.detectChanges();
    fixture.whenStable().then(() => {
      expect(runIcon.properties['disabled']).toBeFalsy();
    });
  }));

  it('initially disables the run button', async(() => {
    // given
    setupWorkspace(component, messagingService, fixture);
    let runIcon = sidenav.query(By.css('#run'));

    // when

    // then
    expect(runIcon.properties['disabled']).toBeTruthy();
  }));

  it('keeps run button enabled when navigation pane looses focus', async(() => {
    // given
    setupWorkspace(component, messagingService, fixture);
    let runIcon = sidenav.query(By.css('#run'));
    component.getWorkspace().setSelected(tclFile.path);

    // when
    messagingService.publish(events.EDITOR_ACTIVE, { path: tclFile.path });

    // then
    expect(runIcon.properties['disabled']).toBeFalsy();
  }));

  it('disables run button when non-executable file becomes active', async(() => {
    // given
    setupWorkspace(component, messagingService, fixture);
    let runIcon = sidenav.query(By.css('#run'));
    component.getWorkspace().setSelected(tclFile.path);

    // when
    messagingService.publish(events.EDITOR_ACTIVE, { path: nonExecutableFile.path });

    // then
    expect(runIcon.properties['disabled']).toBeTruthy();
  }));

  it('displays notification when receiving the test execution started event', fakeAsync(() => {
    // given
    setupWorkspace(component, messagingService, fixture);
    fixture.detectChanges();

    // when
    messagingService.publish(events.TEST_EXECUTION_STARTED, { message: 'Execution of "\${}" has been started.', path: tclFile.path });
    tick();

    // then
    fixture.detectChanges();
    let notify = fixture.debugElement.query(By.css('#notification'));
    expect(notify).toBeTruthy();
    expect(component.notification).toEqual(`Execution of "file" has been started.`);
    expect(notify.nativeElement.innerText).toEqual(component.notification);

    flush();
  }));

  it('removes notification sometime after test execution has been started', fakeAsync(() => {
    // given
    setupWorkspace(component, messagingService, fixture);
    fixture.detectChanges();

    // when
    messagingService.publish(events.TEST_EXECUTION_STARTED, { message: 'some message', path: tclFile.path });
    tick(NavigationComponent.NOTIFICATION_TIMEOUT_MILLIS);

    // then
    let notify = fixture.debugElement.query(By.css('#notification'));
    expect(notify).toBeFalsy();
    expect(component.notification).toBeFalsy();
  }));

  it('displays error message when test execution could not be started', fakeAsync(() => {
    // given
    setupWorkspace(component, messagingService, fixture);
    fixture.detectChanges();

    // when
    messagingService.publish(events.TEST_EXECUTION_START_FAILED, { message: 'The test "\${}" could not be started.', path: tclFile.path });
    tick();

    // then
    fixture.detectChanges();
    let notify = fixture.debugElement.query(By.css('#notification'));
    expect(notify).toBeFalsy();

    expect(component.errorMessage).toBeTruthy();
    let alert = fixture.debugElement.query(By.css('#errorMessage'));
    expect(alert).toBeTruthy();
    expect(component.errorMessage).toEqual(`The test "file" could not be started.`);
    expect(alert.nativeElement.innerText).toEqual(component.errorMessage);

    flush();
  }));


  it('sets expanded state when right arrow key is pressed', () => {
    // given
    setupWorkspace(component, messagingService, fixture);
    let element = component.getWorkspace().getElementInfo('subfolder');
    component.getWorkspace().setSelected(element.path);
    component.getWorkspace().setExpanded(element.path, false);
    fixture.detectChanges();

    // when
    sidenav.query(By.css('nav-tree-viewer')).triggerEventHandler('keyup', { key: KeyActions.EXPAND_NODE});

    // then
    let expandedState = component.getWorkspace().isExpanded(element.path);
    expect(expandedState).toBeTruthy();
  });

  it('keeps expanded state when right arrow key is pressed', () => {
    // given
    setupWorkspace(component, messagingService, fixture);
    let element = component.getWorkspace().getElementInfo('subfolder');
    component.getWorkspace().setSelected(element.path);
    component.getWorkspace().setExpanded(element.path, true);
    fixture.detectChanges();

    // when
    sidenav.query(By.css('nav-tree-viewer')).triggerEventHandler('keyup', { key: KeyActions.EXPAND_NODE});

    // then
    let expandedState = component.getWorkspace().isExpanded(element.path);
    expect(expandedState).toBeTruthy();
  });

  it('sets collapsed state when left arrow key is pressed', () => {
    // given
    setupWorkspace(component, messagingService, fixture);
    let element = component.getWorkspace().getElementInfo('subfolder');
    component.getWorkspace().setSelected(element.path);
    component.getWorkspace().setExpanded(element.path, true);
    fixture.detectChanges();

    // when
    sidenav.query(By.css('nav-tree-viewer')).triggerEventHandler('keyup', { key: KeyActions.COLLAPSE_NODE});

    // then
    let expandedState = component.getWorkspace().isExpanded(element.path);
    expect(expandedState).toBeFalsy();
  });

  it('keeps collapsed state when left arrow key is pressed', () => {
    // given
    setupWorkspace(component, messagingService, fixture);
    let element = component.getWorkspace().getElementInfo('subfolder');
    component.getWorkspace().setSelected(element.path);
    component.getWorkspace().setExpanded(element.path, false);
    fixture.detectChanges();

    // when
    sidenav.query(By.css('nav-tree-viewer')).triggerEventHandler('keyup', { key: KeyActions.COLLAPSE_NODE});

    // then
    let expandedState = component.getWorkspace().isExpanded(element.path);
    expect(expandedState).toBeFalsy();
  });

  it('selects the next sibling element when the down arrow key is pressed', async(() => {
    // given
    setupWorkspace(component, messagingService, fixture);
    component.getWorkspace().setSelected(tclFile.path);
    fixture.detectChanges();

    // when
    sidenav.query(By.css('nav-tree-viewer')).triggerEventHandler('keyup', { key: KeyActions.NAVIGATE_NEXT});

    // then
    expect(component.getWorkspace().getSelected()).toEqual(succeedingSiblingOfTclFile.path);
  }));

  it('selects the first child element when the down arrow key is pressed', async(() => {
    // given
    setupWorkspace(component, messagingService, fixture);
    component.getWorkspace().setSelected('subfolder');
    component.getWorkspace().setExpanded('subfolder', true);
    fixture.detectChanges();

    // when
    sidenav.query(By.css('nav-tree-viewer')).triggerEventHandler('keyup', { key: KeyActions.NAVIGATE_NEXT});

    // then
    expect(component.getWorkspace().getElementInfo(component.getWorkspace().getSelected()).name).toEqual('newFolder');
  }));

  it('selects the parent`s next sibling element when the down arrow key is pressed', async(() => {
    // given
    setupWorkspace(component, messagingService, fixture);
    component.getWorkspace().setSelected('subfolder/newFolder');
    fixture.detectChanges();

    // when
    sidenav.query(By.css('nav-tree-viewer')).triggerEventHandler('keyup', { key: KeyActions.NAVIGATE_NEXT});

    // then
    expect(component.getWorkspace().getSelected()).toEqual(nonExecutableFile.path);
  }));

  it('leaves the selection unchanged when the down arrow key is pressed on the last element', async(() => {
    // given
    setupWorkspace(component, messagingService, fixture);
    component.getWorkspace().setSelected(lastElement.path);
    component.getWorkspace().setExpanded(lastElement.path, true);
    fixture.detectChanges();

    // when
    sidenav.query(By.css('nav-tree-viewer')).triggerEventHandler('keyup', { key: KeyActions.NAVIGATE_NEXT});

    // then
    expect(component.getWorkspace().getSelected()).toEqual(lastElement.path);
  }));

  it('selects the preceding sibling element when the up arrow key is pressed', async(() => {
    // given
    setupWorkspace(component, messagingService, fixture);
    component.getWorkspace().setSelected(tclFile.path);
    fixture.detectChanges();

    // when
    sidenav.query(By.css('nav-tree-viewer')).triggerEventHandler('keyup', { key: KeyActions.NAVIGATE_PREVIOUS});

    // then
    expect(component.getWorkspace().getSelected()).toEqual(nonExecutableFile.path);
  }));

  it('selects the parent element when the up arrow key is pressed on the first child', async(() => {
    // given
    setupWorkspace(component, messagingService, fixture);
    component.getWorkspace().setSelected('subfolder/newFolder');
    component.getWorkspace().setExpanded(component.getWorkspace().getSelected(), true);
    fixture.detectChanges();

    // when
    sidenav.query(By.css('nav-tree-viewer')).triggerEventHandler('keyup', { key: KeyActions.NAVIGATE_PREVIOUS});

    // then
    expect(component.getWorkspace().getElementInfo(component.getWorkspace().getSelected()).name).toEqual('subfolder');
  }));

  it('selects the preceding sibling`s last child element when the up arrow key is pressed', async(() => {
    // given
    setupWorkspace(component, messagingService, fixture);
    component.getWorkspace().setSelected(nonExecutableFile.path);
    component.getWorkspace().setExpanded(component.getWorkspace().getSelected(), true);
    fixture.detectChanges();

    // when
    sidenav.query(By.css('nav-tree-viewer')).triggerEventHandler('keyup', { key: KeyActions.NAVIGATE_PREVIOUS});

    // then
    expect(component.getWorkspace().getSelected()).toEqual('subfolder/newFolder');
  }));

  it('leaves the selection unchanged when the up arrow key is pressed on the first element', async(() => {
    // given
    setupWorkspace(component, messagingService, fixture);
    let firstElement = component.getWorkspace().getRootPath();
    component.getWorkspace().setSelected(firstElement);
    component.getWorkspace().setExpanded(firstElement, true);
    fixture.detectChanges();

    // when
    sidenav.query(By.css('nav-tree-viewer')).triggerEventHandler('keyup', { key: KeyActions.NAVIGATE_PREVIOUS});

    // then
    expect(component.getWorkspace().getSelected()).toEqual(firstElement);
  }));

  it('emits "navigation.open" message when the enter key is pressed', () => {
    // given
    setupWorkspace(component, messagingService, fixture);
    component.getWorkspace().setExpanded(component.getWorkspace().getElementInfo('subfolder').path, true);
    component.getWorkspace().setSelected(tclFile.path);
    fixture.detectChanges();
    let callback = jasmine.createSpy('callback');
    messagingService.subscribe(events.NAVIGATION_OPEN, callback);

    // when
    sidenav.query(By.css('nav-tree-viewer')).triggerEventHandler('keyup', { key: KeyActions.OPEN_FILE})

    // then
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(jasmine.objectContaining({
      name: tclFile.name,
      path: tclFile.path
    }));
  });

  it('updates workspace markers when WORKSPACE_MARKER_UPDATE message is received', async(() => {
    // given
    setupWorkspace(component, messagingService, fixture);

    // when
    messagingService.publish(events.WORKSPACE_MARKER_UPDATE, [{
      path: tclFile.path, markers: {
        testStatus: ElementState.Running,
        validation: { errors: 3, warnings: 2, infos: 1}
      }}, {
      path: lastElement.path, markers: {
        validation: { errors: 0, warnings: 1, infos: 0}
      }}]);

    // then
    const tclFileMarker = component.workspace.getMarkers(tclFile.path);
    const lastElementMarker = component.workspace.getMarkers(lastElement.path);
    expect(tclFileMarker.testStatus).toEqual(ElementState.Running);
    expect(tclFileMarker.validation.errors).toEqual(3);
    expect(tclFileMarker.validation.warnings).toEqual(2);
    expect(tclFileMarker.validation.infos).toEqual(1);
    expect(lastElementMarker.validation.errors).toEqual(0);
    expect(lastElementMarker.validation.warnings).toEqual(1);
    expect(lastElementMarker.validation.infos).toEqual(0);
  }));

  it('shows indicator on tree item when WORKSPACE_MARKER_UPDATE message is received', async(() => {
    // given
    setupWorkspace(component, messagingService, fixture);
      component.workspace.setExpanded(subfolder.path, true);

    // when
    messagingService.publish(events.WORKSPACE_MARKER_UPDATE, [{
      path: tclFile.path, markers: {
        testStatus: ElementState.Running
      }}]);

    // then
    fixture.whenStable().then(() => {
      expect(sidenav.query(By.css('.fa-spinner'))).toBeTruthy();
    })
  }));

  it('observes workspace markers when WORKSPACE_MARKER_OBSERVE message is received', async(() => {
    // given
    setupWorkspace(component, messagingService, fixture);
    const observer: MarkerObserver<ElementState> = {
      path: tclFile.path,
      field: 'testStatus',
      observe: () => Promise.resolve(ElementState.LastRunFailed),
      stopOn: (value) => value !== ElementState.Running
    }

    // when
    messagingService.publish(events.WORKSPACE_MARKER_OBSERVE, observer);

    // then
    fixture.whenStable().then(() => {
      expect(component.workspace.getMarkerValue(observer.path, observer.field)).toEqual(ElementState.LastRunFailed);
    });
  }));

  it('observes the workspace as a whole when WORKSPACE_OBSERVE message is received', async(() => {
    // given
    setupWorkspace(component, messagingService, fixture);
    const subfolderMarkers = { greeting: 'Hello, Subfolder!', anotherField: 42 };
    const rootMarkers = { greeting: 'Hello, Root!' };
    const observer: WorkspaceObserver = {
      observe: () => Promise.resolve([{path: subfolder.path, markers: subfolderMarkers},
          {path: root.path, markers: rootMarkers}]),
      stopOn: () => true
    }

    // when
    messagingService.publish(events.WORKSPACE_OBSERVE, observer);

    // then
    fixture.whenStable().then(() => {
      expect(component.workspace.getMarkers(subfolder.path)).toEqual(subfolderMarkers);
      expect(component.workspace.getMarkers(root.path)).toEqual(rootMarkers);
    });
  }));

  it('will remove notification and stop spinning refresh icon if workspace reload finished', fakeAsync(() => {
    // given
    component.refreshClassValue = 'fa-spin';
    component.notification = 'some message';

    // when
    messagingService.publish(events.WORKSPACE_RELOAD_RESPONSE, null);
    tick();

    // then
    expect(component.refreshClassValue).toEqual('');
    expect(component.notification).toBeNull();
    expect(component.refreshRunning()).toBeFalsy();
  }));

  it('will notify refresh and spin refresh icon if workspace refresh is called', fakeAsync(() => {
    // given
    let workspaceReloadRequestReceived = false;
    component.refreshClassValue = '';
    component.notification = null;
    messagingService.subscribe(events.WORKSPACE_RELOAD_REQUEST, () => {
      workspaceReloadRequestReceived = true;
    });

    // when
    component.refresh();
    tick();

    // then
    expect(workspaceReloadRequestReceived).toBeTruthy();
    expect(component.refreshRunning()).toBeTruthy();
    expect(component.refreshClassValue).toEqual('fa-spin');
    expect(component.notification).not.toBeNull();
  }));

  it('will not refresh, if refresh is running', fakeAsync(() => {
    // given
    component.refreshClassValue = 'some'; // will result in component.refreshRunning() to be true
    messagingService.subscribe(events.WORKSPACE_RELOAD_REQUEST, () => {
      fail('workspace reload request should never be put onto the message bus!');
    });

    // when
    component.refresh();
    tick();

    // then
    expect(component.refreshRunning()).toBeTruthy();
    expect(component.refreshClassValue).toEqual('some');
  }));


});
