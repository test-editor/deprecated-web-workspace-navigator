import { async, ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule, Response, ResponseOptions } from '@angular/http';
import { By } from '@angular/platform-browser';
import { MessagingModule, MessagingService } from '@testeditor/messaging-service';
import { mock, when, anyOfClass, instance, verify, resetCalls } from 'ts-mockito';

import { PersistenceService } from '../../service/persistence/persistence.service';
import { PersistenceServiceConfig } from '../../service/persistence/persistence.service.config';
import { TestExecutionService } from '../../service/execution/test.execution.service';
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
import { nonExecutableFile, tclFile, setupWorkspace, mockedPersistenceService, mockedTestExecutionService, setTestExecutionServiceResponse, HTTP_STATUS_CREATED, HTTP_STATUS_ERROR, succeedingSiblingOfTclFile, lastElement }
    from './navigation.component.test.setup';
import { flush } from '@angular/core/testing';
import { KeyActions } from '../../common/key.actions';
import { WindowService } from '../../service/browserObjectModel/window.service';
import { discardPeriodicTasks } from '@angular/core/testing';
import { flushMicrotasks } from '@angular/core/testing';

describe('NavigationComponent', () => {

  const examplePath = "some/path.txt";

  let component: NavigationComponent;
  let fixture: ComponentFixture<NavigationComponent>;
  let persistenceService: PersistenceService;
  let messagingService: MessagingService;
  let executionService: TestExecutionService;
  let spy: jasmine.Spy;
  let sidenav: DebugElement;

  beforeEach(async(() => {
    persistenceService = mockedPersistenceService();
    executionService = mockedTestExecutionService();

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
        { provide: PersistenceService, useValue: instance(persistenceService) },
        { provide: TestExecutionService, useValue: instance(executionService) },
        { provide: WindowService, useValue: null}
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
    setTestExecutionServiceResponse(executionService, HTTP_STATUS_CREATED);
    tclFile.state = ElementState.Idle;
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('sets workspaceRoot initially', async(() => {
    fixture.whenStable().then(() => {
      expect(component.getWorkspace().root.name).toEqual(tclFile.name);
    });
  }));

  it('expands workspaceRoot initially', async(() => {
    fixture.whenStable().then(() => {
      expect(component.uiState.isExpanded(tclFile.path)).toBeTruthy();
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
      let alert = fixture.debugElement.query(By.css("#errorMessage"));
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
    component.uiState.setDirty(tclFile.path, true);
    component.uiState.setExpanded(tclFile.path, true);
    component.uiState.selectedElement = tclFile;

    // when
    messagingService.publish(events.NAVIGATION_DELETED, { name: tclFile.name, path: tclFile.path });

    // then
    expect(component.uiState.isDirty(tclFile.path)).toBeFalsy();
    expect(component.uiState.isExpanded(tclFile.path)).toBeFalsy();
    expect(component.uiState.selectedElement).toBeFalsy();
  });

  it('refreshes the workspace when "navigation.deleted" event is received', () => {
    // given
    resetCalls(persistenceService);

    // when
    messagingService.publish(events.NAVIGATION_DELETED, { name: tclFile.name, path: tclFile.path });

    // then
    verify(persistenceService.listFiles()).once();
  });

  it('updates the UI state when an "navigation.select" event is received', () => {
    // when
    messagingService.publish(events.NAVIGATION_SELECT, tclFile);

    // then
    expect(component.uiState.selectedElement).toEqual(tclFile);
  });

  it('updates the UI state for creating a new file', () => {
    // given
    component.setWorkspace(new Workspace(tclFile));
    fixture.detectChanges();
    let newFileIcon = sidenav.query(By.css('#new-file'));

    // when
    newFileIcon.nativeElement.click();

    // then
    let newElementRequest = component.uiState.newElementRequest;
    expect(newElementRequest).toBeTruthy();
    expect(newElementRequest.type).toEqual('file');
  });

  it('updates the UI state for creating a new folder', () => {
    // given
    component.setWorkspace(new Workspace(tclFile));
    fixture.detectChanges();
    let newFolder = sidenav.query(By.css('#new-folder'))

    // when
    newFolder.nativeElement.click();

    // then
    let newElementRequest = component.uiState.newElementRequest;
    expect(newElementRequest).toBeTruthy();
    expect(newElementRequest.type).toEqual('folder');
  });

  it('expands selected element on creation of new element', () => {
    // given
    setupWorkspace(component, fixture);
    let subfolder = component.getWorkspace().root.children[0];
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
    setupWorkspace(component, fixture);
    let subfolder = component.getWorkspace().root.children[0];
    component.uiState.setExpanded(subfolder.path, true);
    fixture.detectChanges();
    let collapseAllIcon = sidenav.query(By.css('#collapse-all'))

    // when
    collapseAllIcon.nativeElement.click();

    // then
    expect(component.uiState.isExpanded(subfolder.path)).toBeFalsy();
    expect(component.uiState.isExpanded(component.getWorkspace().root.path)).toBeTruthy();
  });

  it('refreshes navigator when refresh button is clicked', async(() => {
    // given
    setupWorkspace(component, fixture);

    let refreshIcon = sidenav.query(By.css('#refresh'));
    let newFile: WorkspaceElement = {
      name: "newFile.tcl",
      path: "newFile.tcl",
      type: ElementType.File,
      children: []
    };
    when(persistenceService.listFiles()).thenReturn(Promise.resolve(newFile));
    resetCalls(persistenceService);

    // when
    refreshIcon.nativeElement.click();

    // then
    verify(persistenceService.listFiles()).once();
    fixture.whenStable().then(() => {
      expect(component.getWorkspace().root).toEqual(newFile);
    });
  }));

  it('can reveal new folder', () => {
    // given
    setupWorkspace(component, fixture);
    let subfolder = component.getWorkspace().root.children[0];
    let newFolder = subfolder.children[0];

    // when
    component.revealElement(newFolder.path);

    // then
    expect(component.uiState.isExpanded(subfolder.path)).toBeTruthy();
    expect(component.uiState.isExpanded(component.getWorkspace().root.path)).toBeTruthy();
    expect(component.uiState.isExpanded(newFolder.path)).toBeFalsy();
  });

  it('can select subfolder', () => {
    // given
    setupWorkspace(component, fixture);
    let subfolder = component.getWorkspace().root.children[0];

    // when
    component.selectElement(subfolder.path + '/');

    // then
    expect(component.uiState.selectedElement).toBe(subfolder);
  });

  it('reveals and selects element when an "navigation.created" event is received', async(() => {
    // given
    setupWorkspace(component, fixture);
    let subfolder = component.getWorkspace().root.children[0];
    let newFolder = subfolder.children[0];
    when(persistenceService.listFiles()).thenReturn(Promise.resolve(component.getWorkspace().root));
    when(executionService.statusAll()).thenReturn(Promise.resolve(new Map<string, ElementState>()));
    resetCalls(persistenceService);

    // when
    messagingService.publish(events.NAVIGATION_CREATED, { path: newFolder.path });

    // then
    verify(persistenceService.listFiles()).once();
    fixture.whenStable().then(() => {
      expect(component.uiState.isExpanded(subfolder.path)).toBeTruthy();
      expect(component.uiState.isExpanded(component.getWorkspace().root.path)).toBeTruthy();
      expect(component.uiState.isExpanded(newFolder.path)).toBeFalsy();
      expect(component.uiState.selectedElement).toBe(newFolder);
    });
  }));

  it('element is not expanded when retrieving the workspace fails', async(() => {
    // given
    let path = 'example.txt';
    when(persistenceService.listFiles()).thenReturn(Promise.reject('failed'));

    // when
    messagingService.publish(events.NAVIGATION_CREATED, { path: 'some/path' });

    // then
    fixture.whenStable().then(() => {
      expect(component.uiState.isExpanded(path)).toBeUndefined();
    });
  }));

  it('invokes test execution for currently selected test file when "run" button is clicked', fakeAsync(() => {
    // given
    setupWorkspace(component, fixture);
    component.uiState.selectedElement = tclFile;
    fixture.detectChanges();
    let runIcon = sidenav.query(By.css('#run'));
    resetCalls(executionService);

    // when
    runIcon.nativeElement.click();
    tick(NavigationComponent.NOTIFICATION_TIMEOUT_MILLIS);

    // then
    verify(executionService.execute(tclFile.path)).once();
    expect(tclFile.state).toEqual(ElementState.LastRunSuccessful);
  }));

  it('invokes test execution for currently active test file when "run" button is clicked and no file is selected', fakeAsync(() => {
    // given
    setupWorkspace(component, fixture);
    component.uiState.selectedElement = null;
    component.uiState.activeEditorPath = tclFile.path;
    fixture.detectChanges();
    let runIcon = sidenav.query(By.css('#run'));
    resetCalls(executionService);

    // when
    runIcon.nativeElement.click();
    tick(NavigationComponent.NOTIFICATION_TIMEOUT_MILLIS);

    // then
    verify(executionService.execute(tclFile.path)).once();
    expect(tclFile.state).toEqual(ElementState.LastRunSuccessful);
  }));

  it('monitors test status when execution is started', fakeAsync(() => {
    // given
    setupWorkspace(component, fixture);
    component.uiState.selectedElement = tclFile;
    fixture.detectChanges();
    let runIcon = sidenav.query(By.css('#run'));
    resetCalls(executionService);

    // when
    runIcon.nativeElement.click();
    flush();

    // then
    verify(executionService.status(tclFile.path)).thrice(); // mock returns 'RUNNING' twice, then 'SUCCESS'
    expect(tclFile.state).toEqual(ElementState.LastRunSuccessful);
  }));

  it('disables the run button when selecting a non-executable file', async(() => {
    // given
    setupWorkspace(component, fixture);
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
    setupWorkspace(component, fixture);
    let runIcon = sidenav.query(By.css('#run'));
    component.uiState.selectedElement = null;
    component.uiState.activeEditorPath = tclFile.path;
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
    setupWorkspace(component, fixture);
    let runIcon = sidenav.query(By.css('#run'));
    tclFile.state = ElementState.Running;

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
    setupWorkspace(component, fixture);

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
    setupWorkspace(component, fixture);
    let runIcon = sidenav.query(By.css('#run'));

    // when

    // then
    expect(runIcon.properties['disabled']).toBeTruthy();
  }));

  it('keeps run button enabled when navigation pane looses focus', async(() => {
    // given
    setupWorkspace(component, fixture);
    let runIcon = sidenav.query(By.css('#run'));
    component.uiState.selectedElement = tclFile;

    // when
    messagingService.publish(events.EDITOR_ACTIVE, { path: tclFile.path });

    // then
    expect(runIcon.properties['disabled']).toBeFalsy();
  }));

  it('disables run button when non-executable file becomes active', async(() => {
    // given
    setupWorkspace(component, fixture);
    let runIcon = sidenav.query(By.css('#run'));
    component.uiState.selectedElement = tclFile;

    // when
    messagingService.publish(events.EDITOR_ACTIVE, { path: nonExecutableFile.path });

    // then
    expect(runIcon.properties['disabled']).toBeTruthy();
  }));

  it('displays notification when test execution has been started', fakeAsync(() => {
    // given
    setupWorkspace(component, fixture);
    component.uiState.selectedElement = tclFile;
    fixture.detectChanges();
    let runIcon = sidenav.query(By.css('#run'));

    // when
    runIcon.nativeElement.click();
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
    setupWorkspace(component, fixture);
    component.uiState.selectedElement = tclFile;
    fixture.detectChanges();
    let runIcon = sidenav.query(By.css('#run'));

    // when
    runIcon.nativeElement.click();
    tick(NavigationComponent.NOTIFICATION_TIMEOUT_MILLIS);

    // then
    let notify = fixture.debugElement.query(By.css('#notification'));
    expect(notify).toBeFalsy();
    expect(component.notification).toBeFalsy();

  }));

  it('displays error message when test execution could not be started', fakeAsync(() => {
    // given
    setupWorkspace(component, fixture);
    component.uiState.selectedElement = tclFile;
    fixture.detectChanges();
    let runIcon = sidenav.query(By.css('#run'));
    setTestExecutionServiceResponse(executionService, HTTP_STATUS_ERROR);

    // when
    runIcon.nativeElement.click();
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
    setupWorkspace(component, fixture);
    let element = component.getWorkspace().getElement('subfolder');
    component.uiState.selectedElement = element;
    component.uiState.setExpanded(element.path, false);
    fixture.detectChanges();

    // when
    sidenav.query(By.css('nav-tree-viewer')).triggerEventHandler('keyup', { key: KeyActions.EXPAND_NODE});

    // then
    let expandedState = component.uiState.isExpanded(element.path);
    expect(expandedState).toBeTruthy();
  });

  it('keeps expanded state when right arrow key is pressed', () => {
    // given
    setupWorkspace(component, fixture);
    let element = component.getWorkspace().getElement('subfolder');
    component.uiState.selectedElement = element;
    component.uiState.setExpanded(element.path, true);
    fixture.detectChanges();

    // when
    sidenav.query(By.css('nav-tree-viewer')).triggerEventHandler('keyup', { key: KeyActions.EXPAND_NODE});

    // then
    let expandedState = component.uiState.isExpanded(element.path);
    expect(expandedState).toBeTruthy();
  });

  it('sets collapsed state when left arrow key is pressed', () => {
    // given
    setupWorkspace(component, fixture);
    let element = component.getWorkspace().getElement('subfolder');
    component.uiState.selectedElement = element;
    component.uiState.setExpanded(element.path, true);
    fixture.detectChanges();

    // when
    sidenav.query(By.css('nav-tree-viewer')).triggerEventHandler('keyup', { key: KeyActions.COLLAPSE_NODE});

    // then
    let expandedState = component.uiState.isExpanded(element.path);
    expect(expandedState).toBeFalsy();
  });

  it('keeps collapsed state when left arrow key is pressed', () => {
    // given
    setupWorkspace(component, fixture);
    let element = component.getWorkspace().getElement('subfolder');
    component.uiState.selectedElement = element;
    component.uiState.setExpanded(element.path, false);
    fixture.detectChanges();

    // when
    sidenav.query(By.css('nav-tree-viewer')).triggerEventHandler('keyup', { key: KeyActions.COLLAPSE_NODE});

    // then
    let expandedState = component.uiState.isExpanded(element.path);
    expect(expandedState).toBeFalsy();
  });

  it('selects the next sibling element when the down arrow key is pressed', async(() => {
    // given
    setupWorkspace(component, fixture);
    component.uiState.selectedElement = tclFile;
    fixture.detectChanges();

    // when
    sidenav.query(By.css('nav-tree-viewer')).triggerEventHandler('keyup', { key: KeyActions.NAVIGATE_NEXT});

    // then
    expect(component.uiState.selectedElement).toEqual(succeedingSiblingOfTclFile);

  }));

  it('selects the first child element when the down arrow key is pressed', async(() => {
    // given
    setupWorkspace(component, fixture);
    component.uiState.selectedElement = component.getWorkspace().getElement('subfolder');
    component.uiState.setExpanded(component.uiState.selectedElement.path, true);
    fixture.detectChanges();

    // when
    sidenav.query(By.css('nav-tree-viewer')).triggerEventHandler('keyup', { key: KeyActions.NAVIGATE_NEXT});

    // then
    expect(component.uiState.selectedElement.name).toEqual('newFolder');

  }));

  it('selects the parent`s next sibling element when the down arrow key is pressed', async(() => {
    // given
    setupWorkspace(component, fixture);
    component.uiState.selectedElement = component.getWorkspace().getElement('subfolder/newFolder');
    fixture.detectChanges();

    // when
    sidenav.query(By.css('nav-tree-viewer')).triggerEventHandler('keyup', { key: KeyActions.NAVIGATE_NEXT});

    // then
    expect(component.uiState.selectedElement).toEqual(nonExecutableFile);

  }));

  it('leaves the selection unchanged when the down arrow key is pressed on the last element', async(() => {
    // given
    setupWorkspace(component, fixture);
    component.uiState.selectedElement = lastElement;
    component.uiState.setExpanded(lastElement.path, true);
    fixture.detectChanges();

    // when
    sidenav.query(By.css('nav-tree-viewer')).triggerEventHandler('keyup', { key: KeyActions.NAVIGATE_NEXT});

    // then
    expect(component.uiState.selectedElement).toEqual(lastElement);

  }));


it('selects the preceding sibling element when the up arrow key is pressed', async(() => {
  // given
  setupWorkspace(component, fixture);
  component.uiState.selectedElement = tclFile;
  fixture.detectChanges();

  // when
  sidenav.query(By.css('nav-tree-viewer')).triggerEventHandler('keyup', { key: KeyActions.NAVIGATE_PREVIOUS});

  // then
  expect(component.uiState.selectedElement).toEqual(nonExecutableFile);

}));

it('selects the parent element when the up arrow key is pressed on the first child', async(() => {
  // given
  setupWorkspace(component, fixture);
  component.uiState.selectedElement = component.getWorkspace().getElement('subfolder/newFolder');
  component.uiState.setExpanded(component.uiState.selectedElement.path, true);
  fixture.detectChanges();

  // when
  sidenav.query(By.css('nav-tree-viewer')).triggerEventHandler('keyup', { key: KeyActions.NAVIGATE_PREVIOUS});

  // then
  expect(component.uiState.selectedElement.name).toEqual('subfolder');

}));

it('selects the preceding sibling`s last child element when the up arrow key is pressed', async(() => {
  // given
  setupWorkspace(component, fixture);
  component.uiState.selectedElement = nonExecutableFile;
  component.uiState.setExpanded(component.uiState.selectedElement.path, true);
  fixture.detectChanges();

  // when
  sidenav.query(By.css('nav-tree-viewer')).triggerEventHandler('keyup', { key: KeyActions.NAVIGATE_PREVIOUS});

  // then
  expect(component.uiState.selectedElement).toEqual(component.getWorkspace().getElement('subfolder/newFolder'));

}));

it('leaves the selection unchanged when the up arrow key is pressed on the first element', async(() => {
  // given
  setupWorkspace(component, fixture);
  let firstElement = component.getWorkspace().root;
  component.uiState.selectedElement = firstElement;
  component.uiState.setExpanded(firstElement.path, true);
  fixture.detectChanges();

  // when
  sidenav.query(By.css('nav-tree-viewer')).triggerEventHandler('keyup', { key: KeyActions.NAVIGATE_PREVIOUS});

  // then
  expect(component.uiState.selectedElement).toEqual(firstElement);

}));

it('emits "navigation.open" message when the enter key is pressed', () => {
  // given
  setupWorkspace(component, fixture);
  component.uiState.setExpanded(component.getWorkspace().getElement('subfolder').path, true);
  component.uiState.selectedElement = tclFile;
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

it('restores test status when refresh button is clicked', async(() => {
  // given
  setupWorkspace(component, fixture);

  let refreshIcon = sidenav.query(By.css('#refresh'));
  let newFile: WorkspaceElement = {
    name: 'newFile.tcl', path: 'newFile.tcl', type: ElementType.File, state: ElementState.Running, children: []
  };

  when(persistenceService.listFiles()).thenReturn(Promise.resolve({
    name: 'newFile.tcl', path: 'newFile.tcl', type: ElementType.File, children: []
  }));
  when(executionService.statusAll()).thenReturn(Promise.resolve(new Map<string, ElementState>([['newFile.tcl', ElementState.Running]])));
  when(executionService.status('newFile.tcl')).thenReturn(Promise.resolve(new Response(new ResponseOptions({body: 'SUCCESS'}))));

  // when
  refreshIcon.nativeElement.click();

  // then
  fixture.whenStable().then(() => {
    expect(component.getWorkspace().getElement('newFile.tcl').state).toEqual(ElementState.Running);
  });
}));

});
