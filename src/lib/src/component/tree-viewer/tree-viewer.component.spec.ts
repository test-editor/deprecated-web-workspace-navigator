import { async, ComponentFixture, TestBed, inject } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

import { MessagingModule, MessagingService } from '@testeditor/messaging-service';

import { TreeViewerComponent } from './tree-viewer.component';
import { PersistenceService } from '../../service/persistence/persistence.service';
import { WorkspaceElement } from '../../common/workspace-element';

import { UiState } from '../ui-state';
import * as events from '../event-types';

export function testBedSetup(): void {
  TestBed.configureTestingModule({
    imports: [
      MessagingModule.forRoot()
    ],
    declarations: [TreeViewerComponent]
  }).compileComponents();
}

describe('TreeViewerComponent', () => {

  let component: TreeViewerComponent;
  let fixture: ComponentFixture<TreeViewerComponent>;
  let messagingService: MessagingService;

  let singleEmptyFolder: WorkspaceElement = {
    name: 'folder', path: '', type: 'folder',
    children: []
  };

  let foldedFolderWithSubfolders: WorkspaceElement = {
    name: 'top-folder', path: '', type: 'folder',
    children: [
      { name: 'sub-folder-1', path: 'top-folder', type: 'folder', children: [] },
      { name: 'sub-folder-2', path: 'top-folder', type: 'folder', children: [] },
      { name: 'sub-file-1', path: 'top-folder', type: 'file', children: [] }
    ]
  };

  let singleFile: WorkspaceElement = { name: 'file', path: '', type: 'file', children: [] }

  beforeEach(async(() => {
    testBedSetup();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TreeViewerComponent);
    component = fixture.componentInstance;
    component.uiState = new UiState();
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
    component.model = foldedFolderWithSubfolders;
    expect(component.isEmptyFolder()).toBeFalsy();
  });

  it('empty folder is reported as empty', () => {
    component.model = singleEmptyFolder;
    expect(component.isEmptyFolder()).toBeTruthy();
  });

  it('folded folder does not display sub elements', () => {
    // given
    component.model = foldedFolderWithSubfolders;

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
  });

  it('folded folder is exanded when double-clicked', () => {
    // given
    component.model = foldedFolderWithSubfolders;

    // when
    component.onDoubleClick();

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
  });

  it('folders are not identified as file', () => {
    // given
    component.model = foldedFolderWithSubfolders;

    // when + then
    expect(component.isFile()).toBeFalsy();
    expect(component.isFolder()).toBeTruthy();
  });

  it('files are not identified as folders', () => {
    // given
    component.model = singleFile;

    // when + then
    expect(component.isFile()).toBeTruthy();
    expect(component.isFolder()).toBeFalsy();
  });

  it('onClick() emits "navigation.select" message', () => {
    // given
    component.model = singleFile;
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
    component.model = singleFile;
    let callback = jasmine.createSpy('callback');
    messagingService.subscribe(events.NAVIGATION_OPEN, callback);

    // when
    component.onDoubleClick();

    // then
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(jasmine.objectContaining({ path: singleFile.path }));
  });

  it('has css class "active" if given by the UI state', () => {
    // given
    component.model = singleFile;
    fixture.detectChanges();
    expect(getItemKey().classes.active).toBeFalsy();

    // when
    component.uiState.activeEditorPath = singleFile.path;
    fixture.detectChanges();

    // then
    expect(getItemKey().classes.active).toBeTruthy();
  });

  it('has css class "dirty" if given by the UI state', () => {
    // given
    component.model = singleFile;
    fixture.detectChanges();
    expect(getItemKey().classes.dirty).toBeFalsy();

    // when
    component.uiState.setDirty(singleFile.path, true);
    fixture.detectChanges();

    // then
    expect(getItemKey().classes.dirty).toBeTruthy();
  });

  it('has css class "selected" if given by the UI state', () => {
    // given
    component.model = singleFile;
    fixture.detectChanges();
    expect(getItemKey().classes.selected).toBeFalsy();

    // when
    component.uiState.selectedElement = singleFile;
    fixture.detectChanges();

    // then
    expect(getItemKey().classes.selected).toBeTruthy();
  });

});
