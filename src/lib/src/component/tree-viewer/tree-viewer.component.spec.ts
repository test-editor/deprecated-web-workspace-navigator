import { async, ComponentFixture, TestBed, inject, fakeAsync } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { anyFunction, mock, instance, verify, when, anyString, anything, deepEqual, strictEqual, capture } from 'ts-mockito';

import { MessagingModule, MessagingService } from '@testeditor/messaging-service';

import { TreeViewerComponent } from './tree-viewer.component';
import { NewElementComponent } from './new-element.component';
import { PersistenceService } from '../../service/persistence/persistence.service';
import { WorkspaceElement } from '../../common/workspace-element';

import { UiState } from '../ui-state';
import * as events from '../event-types';
import { WindowService } from '../../service/browserObjectModel/window.service';
import { DefaultWindowService } from '../../service/browserObjectModel/default.window.service';
import { ElementState } from '../../common/element-state';
import { Workspace } from '../../common/workspace';
import { Field, IndicatorFieldSetup } from '../../common/markers/field';
import { IndicatorBoxComponent } from './indicator.box.component';

export function testBedSetup(providers?: any[]): void {
  TestBed.configureTestingModule({
    imports: [
      MessagingModule.forRoot(),
      FormsModule
    ],
    declarations: [
      TreeViewerComponent,
      NewElementComponent,
      IndicatorBoxComponent
    ],
    providers: providers
  }).compileComponents();
}

export function initWorkspaceWithElement(component: TreeViewerComponent, root: WorkspaceElement) {
  component.workspace = new Workspace();
  component.workspace.reload(root);
  component.elementPath = root.path;
}

export function initWorkspaceWithNestedElement(component: TreeViewerComponent, child: WorkspaceElement) {
  component.workspace = new Workspace();
  component.workspace.reload({
    name: 'root', path: 'root', type: 'folder', children: [ child ]
  });
  component.elementPath = child.path;
}

describe('TreeViewerComponent', () => {

  let component: TreeViewerComponent;
  let fixture: ComponentFixture<TreeViewerComponent>;
  let messagingService: MessagingService;
  let persistenceService: PersistenceService;
  let windowService: WindowService;

  let singleEmptyFolder: WorkspaceElement = {
    name: 'folder', path: '', type: 'folder',
    children: []
  };

  let foldedFolderWithSubfolders: WorkspaceElement = {
    name: 'top-folder', path: '', type: 'folder',
    children: [
      { name: 'sub-folder-1', path: 'sub-folder-1', type: 'folder', children: [] },
      { name: 'sub-folder-2', path: 'sub-folder-2', type: 'folder', children: [] },
      { name: 'sub-file-1', path: 'sub-file-1', type: 'file', children: [] }
    ]
  };

  let singleFile: WorkspaceElement = { name: 'file', path: '', type: 'file', children: [] };
  let imageFile: WorkspaceElement = { name: 'image.jpg', path: 'image.jpg', type: 'file', children: [] };

  const sampleFieldSetup: Field[] = [
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
    }
  ];

  beforeEach(async(() => {
    persistenceService = mock(PersistenceService);
    windowService = mock(DefaultWindowService);
    testBedSetup([
      { provide: PersistenceService, useValue: instance(persistenceService) },
      { provide: WindowService, useValue: instance(windowService) },
      { provide: IndicatorFieldSetup, useValue: { fields: sampleFieldSetup} }
    ]);
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TreeViewerComponent);
    component = fixture.componentInstance;
    component.workspace = new Workspace();
    component.workspace.reload(singleEmptyFolder);
    component.elementPath = singleEmptyFolder.path;
    messagingService = TestBed.get(MessagingService);
    fixture.detectChanges();
  });

  function getItemKey(): DebugElement {
    return fixture.debugElement.query(By.css('.tree-view .tree-view-item-key'));
  }

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('non empty folder is reported as non empty', () => {
    initWorkspaceWithElement(component, foldedFolderWithSubfolders);
    expect(component.isEmptyFolder()).toBeFalsy();
  });

  it('empty folder is reported as empty', () => {
    initWorkspaceWithElement(component, singleEmptyFolder);
    expect(component.isEmptyFolder()).toBeTruthy();
  });

  it('folded folder does not display sub elements', async(() => {
    // given
    initWorkspaceWithNestedElement(component, foldedFolderWithSubfolders);

    // when
    fixture.detectChanges();

    // then
    fixture.whenStable().then(() => { // wait for async actions
      let treeview = fixture.debugElement.query(By.css('.tree-view'));
      let treeitems = treeview.queryAll(By.css('.tree-view-item-key'));
      expect(treeitems.length).toEqual(1);
      expect(treeitems[0].nativeElement.innerText).toContain('top-folder');

      expect(component.isFolderExpanded()).toBeFalsy(); // make sure it is folded beforehand
      expect(component.isFolderFolded()).toBeTruthy(); // make sure it is folded beforehand
    });
  }));

  it('expands folder when UI state is set', async(() => {
    // given
    initWorkspaceWithNestedElement(component, foldedFolderWithSubfolders);

    // when
    component.workspace.setExpanded(component.elementPath, true);
    fixture.detectChanges();

    // then
    fixture.detectChanges();
    fixture.whenStable().then(() => { // wait for async actions
      let treeview = fixture.debugElement.query(By.css('.tree-view'));
      let treeitems = treeview.queryAll(By.css('.tree-view-item-key'));
      expect(treeitems.length).toEqual(4);
      expect(treeitems[0].nativeElement.innerText).toContain('top-folder');
      expect(treeitems[1].nativeElement.innerText).toContain('sub-folder-1');
      expect(treeitems[2].nativeElement.innerText).toContain('sub-folder-2');
      expect(treeitems[3].nativeElement.innerText).toContain('sub-file');

      expect(component.isFolderExpanded()).toBeTruthy();
      expect(component.isFolderFolded()).toBeFalsy();
    });
  }));

  it('sets expanded state when double-clicked', () => {
    // given
    initWorkspaceWithNestedElement(component, foldedFolderWithSubfolders);
    fixture.detectChanges();

    // when
    getItemKey().triggerEventHandler('dblclick', null);

    // then
    let expandedState = component.workspace.isExpanded(component.elementPath);
    expect(expandedState).toBeTruthy();
  });

  it('has chevron-right icon for unexpanded folders', () => {
    // when
    initWorkspaceWithNestedElement(component, foldedFolderWithSubfolders);
    fixture.detectChanges();
    let icon = getItemKey().query(By.css('.icon-type'));

    // then
    expect(icon.classes['fa-chevron-right']).toBeTruthy();
  });

  it('has chevron-down icon for expanded folders', () => {
    // when
    component.workspace.setExpanded(foldedFolderWithSubfolders.path, true);
    initWorkspaceWithElement(component, foldedFolderWithSubfolders);
    fixture.detectChanges();
    let icon = getItemKey().query(By.css('.icon-type'));

    // then
    expect(icon.classes['fa-chevron-down']).toBeTruthy();
  });

  it('sets expanded state when clicked on chevron icon', () => {
    // given
    initWorkspaceWithNestedElement(component, foldedFolderWithSubfolders);
    fixture.detectChanges();
    let icon = getItemKey().query(By.css('.icon-type'));

    // when
    icon.triggerEventHandler('click', null);

    // then
    let expandedState = component.workspace.isExpanded(component.elementPath);
    expect(expandedState).toBeTruthy();
  })

  it('folders are not identified as file', () => {
    // given
    initWorkspaceWithElement(component, foldedFolderWithSubfolders);

    // when + then
    expect(component.isFile()).toBeFalsy();
    expect(component.isFolder()).toBeTruthy();
  });

  it('files are not identified as folders', () => {
    // given
    initWorkspaceWithElement(component, singleFile);

    // when + then
    expect(component.isFile()).toBeTruthy();
    expect(component.isFolder()).toBeFalsy();
  });

  it('onClick() emits "navigation.select" message', () => {
    // given
    initWorkspaceWithElement(component, singleFile);
    let callback = jasmine.createSpy('callback');
    messagingService.subscribe(events.NAVIGATION_SELECT, callback);

    // when
    component.onClick();

    // then
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(jasmine.objectContaining({ path: singleFile.path }));
  });

  it('onDoubleClick() emits "navigation.open" message', () => {
    // given
    initWorkspaceWithElement(component, singleFile);
    let callback = jasmine.createSpy('callback');
    messagingService.subscribe(events.NAVIGATION_OPEN, callback);

    // when
    component.onDoubleClick();

    // then
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(jasmine.objectContaining({
      name: singleFile.name,
      path: singleFile.path
    }));
  });

  it('onDoubleClick() on image file opens it in a new tab/window', async(() => {
    // given
    initWorkspaceWithElement(component, imageFile);
    let triedToOpenBinary = false;
    when(persistenceService.getBinaryResource(component.elementPath, anyFunction())).thenCall(() => { triedToOpenBinary = true; });

    // when
    component.onDoubleClick();

    // then
    fixture.whenStable().then(() => {
      expect(triedToOpenBinary).toBeTruthy();
    });
  }));

  it('has css class "active" if given by the UI state', () => {
    // given
    initWorkspaceWithElement(component, singleFile);

    fixture.detectChanges();
    expect(getItemKey().classes.active).toBeFalsy();

    // when
    component.workspace.setActive(singleFile.path);
    fixture.detectChanges();

    // then
    expect(getItemKey().classes.active).toBeTruthy();
  });

  it('has css class "dirty" if given by the UI state', () => {
    // given
    initWorkspaceWithElement(component, singleFile);
    fixture.detectChanges();
    expect(getItemKey().classes.dirty).toBeFalsy();

    // when
    component.workspace.setDirty(singleFile.path, true);
    fixture.detectChanges();

    // then
    expect(getItemKey().classes.dirty).toBeTruthy();
  });

  it('has css class "selected" if given by the UI state', () => {
    // given
    initWorkspaceWithElement(component, singleFile);
    fixture.detectChanges();
    expect(getItemKey().classes.selected).toBeFalsy();

    // when
    component.workspace.setSelected(singleFile.path);
    fixture.detectChanges();

    // then
    expect(getItemKey().classes.selected).toBeTruthy();
  });

  it('requires confirmation before deletion', () => {
    // given
    initWorkspaceWithElement(component, singleFile);
    component.level = 1;
    fixture.detectChanges();
    let deleteIcon = getItemKey().query(By.css('.icon-delete'));

    // when
    deleteIcon.nativeElement.click();

    // then
    expect(component.confirmDelete).toBeTruthy();
    fixture.detectChanges();
    let confirm = fixture.debugElement.query(By.css('.tree-view .confirm-delete'));
    expect(confirm).toBeTruthy();
    verify(persistenceService.deleteResource(anyString(), anyFunction())).never();
  });

  it('deletes element if confirmed', () => {
    // given
    let deleteSingleFileCalled = false;
    when(persistenceService.deleteResource(singleFile.path, anyFunction(), anyFunction())).thenCall(
      () => { deleteSingleFileCalled = true; });
    initWorkspaceWithElement(component, singleFile);
    component.confirmDelete = true;
    fixture.detectChanges();
    let confirmButton = fixture.debugElement.query(By.css('.tree-view .confirm-delete .delete-confirm'));

    // when
    confirmButton.nativeElement.click();

    // then
    expect(component.confirmDelete).toBeFalsy();
    expect(deleteSingleFileCalled).toBeTruthy();
  });

  it('does not delete element when cancelled', () => {
    // given
    initWorkspaceWithElement(component, singleFile);
    component.confirmDelete = true;
    fixture.detectChanges();
    let cancelButton = fixture.debugElement.query(By.css('.tree-view .confirm-delete .delete-cancel'));

    // when
    cancelButton.nativeElement.click();

    // then
    expect(component.confirmDelete).toBeFalsy();
    verify(persistenceService.deleteResource(anyString(), anyFunction())).never();
  });

  it('displays error when deletion failed', (done: () => void) => {
    // given
    initWorkspaceWithElement(component, singleFile);

    // when
    component.onDeleteConfirm();

    // and given that
    const [pathString, onSuccess, onError] = capture(persistenceService.deleteResource).last();
    onError('failed');

    // then
    fixture.whenStable().then(() => {
      fixture.whenStable().then(() => {
        fixture.detectChanges();
        expect(component.errorMessage).toBeTruthy();
        let errorMessage = fixture.debugElement.query(By.css('.tree-view-item .alert'));
        expect(errorMessage).toBeTruthy();
        done();
      });
    });
  });

  it('removes confirmation and emits navigation.deleted event when deletion succeeds', async(() => {
    // given
    initWorkspaceWithElement(component, singleFile);
    let callback = jasmine.createSpy('callback');
    messagingService.subscribe(events.NAVIGATION_DELETED, callback);

    // when
    component.onDeleteConfirm();

    // and given that
    const [path, onSuccess, onError] = capture(persistenceService.deleteResource).last();
    onSuccess('');

    // then
    fixture.whenStable().then(() => {
      expect(component.confirmDelete).toBeFalsy();
      expect(component.errorMessage).toBeFalsy();
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(jasmine.objectContaining({
        name: singleFile.name,
        path: singleFile.path,
        type: singleFile.type
      }));
    });
  }));

  ['bmp', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'BMP', 'Png', 'jPeG'].forEach((extension) => {
    it(`recognizes '${extension}' as image file name extension`, () => {
      // given
      let imageFilename = `image.${extension}`;
      initWorkspaceWithElement(component, { name: imageFilename, path: imageFilename, type: 'file', children: [] });

      // when
      let actual = component.isImage();

      // then
      expect(actual).toBeTruthy();
    });
  });

  ['fileWithoutExtension', 'test.tcl', 'image.png.bak', 'i-am-no-jpeg'].forEach((filename) => {
    it(`does not recognize '${filename}' as image`, () => {
      // given
      initWorkspaceWithElement(component, { name: filename, path: filename, type: 'file', children: [] });

      // when
      let actual = component.isImage();

      // then
      expect(actual).toBeFalsy();
    });
  });

  it('has picture icon for image files', () => {
    // given
    let imageFilename = 'image.jpg';
    initWorkspaceWithElement(component, { name: imageFilename, path: imageFilename, type: 'file', children: [] });
    expect(component.isImage()).toBeTruthy();

    // when
    fixture.detectChanges();
    let icon = getItemKey().query(By.css('.icon-type'));

    // then
    expect(icon.classes['fa-image']).toBeTruthy();
  });

  it('shows spinning icon for running tests', async(() => {
    // given
    initWorkspaceWithNestedElement(component, { name: 'test.tcl', path: 'test.tcl', type: 'file', children: [] });
    component.workspace.setMarkerValue('test.tcl', 'testStatus', ElementState.Running);
    component.fields = sampleFieldSetup;

    // when
    fixture.detectChanges();

    // then
    fixture.whenStable().then(() => {
      expect(getItemKey().query(By.css('.fa-spinner'))).toBeTruthy();
    });
  }));

  it('shows appropriate indicator icon for failed tests', () => {
    // given
    initWorkspaceWithNestedElement(component, { name: 'test.tcl', path: 'test.tcl', type: 'file', children: [] });
    component.workspace.setMarkerValue('test.tcl', 'testStatus', ElementState.LastRunFailed);
    component.fields = sampleFieldSetup;

    // when
    fixture.detectChanges();

    // then
    expect(getItemKey().query(By.css('.fa-circle.test-failure'))).toBeTruthy();
  });

  it('shows appropriate indicator icon for successful tests', () => {
    // given
    initWorkspaceWithNestedElement(component, { name: 'test.tcl', path: 'test.tcl', type: 'file', children: [] });
    component.workspace.setMarkerValue('test.tcl', 'testStatus', ElementState.LastRunSuccessful);
    component.fields = sampleFieldSetup;

    // when
    fixture.detectChanges();

    // then
    let icon = getItemKey().query(By.css('.fa-circle.test-success'));
    expect(icon).toBeTruthy();
  });

  it('does not show any icon for idle tests without success/failure info', () => {
    // given
    initWorkspaceWithNestedElement(component, { name: 'test.tcl', path: 'test.tcl', type: 'file', children: [] });
    component.workspace.setMarkerValue('test.tcl', 'testStatus', ElementState.Idle);
    component.fields = sampleFieldSetup;

    // when
    fixture.detectChanges();

    // then
    expect(getItemKey().query(By.css('.fa-spinner'))).toBeFalsy();
    expect(getItemKey().query(By.css('.fa-cirlce'))).toBeFalsy();
    expect(getItemKey().query(By.css('.test-success'))).toBeFalsy();
    expect(getItemKey().query(By.css('.test-failure'))).toBeFalsy();
  });

  it('does not show any icon for non-executable files', () => {
    // given
    initWorkspaceWithNestedElement(component, { name: 'file.txt', path: 'file.txt', type: 'file', children: [] });
    component.fields = sampleFieldSetup;

    // when
    fixture.detectChanges();

    // then
    expect(getItemKey().query(By.css('.fa-spinner'))).toBeFalsy();
    expect(getItemKey().query(By.css('.fa-cirlce'))).toBeFalsy();
    expect(getItemKey().query(By.css('.test-success'))).toBeFalsy();
    expect(getItemKey().query(By.css('.test-failure'))).toBeFalsy();
  });

  it('shows delete box when not representing root element', async(() => {
    // given
    initWorkspaceWithNestedElement(component, singleFile);
    component.level = 1;
    component.fields = sampleFieldSetup;

    // when
    fixture.detectChanges();

    // then
    fixture.whenStable().then(() => {
      expect(fixture.debugElement.query(By.css('.icon-delete.fa.fa-times'))).toBeTruthy();
    });
  }));

  it('shows test status box for executable files', async(() => {
    // given
    initWorkspaceWithNestedElement(component, { name: 'test.tcl', path: 'test.tcl', type: 'file', children: [] });
    component.workspace.setMarkerValue('test.tcl', 'testStatus', ElementState.Running);
    component.level = 1;
    component.fields = sampleFieldSetup;

    // when
    fixture.detectChanges();

    // then
    fixture.whenStable().then(() => {
      expect(fixture.debugElement.query(By.css('.icon-delete.fa.fa-times'))).toBeTruthy();
      expect(fixture.debugElement.query(By.css('.fa.fa-spinner.fa-spin'))).toBeTruthy();
    });
  }));

});
