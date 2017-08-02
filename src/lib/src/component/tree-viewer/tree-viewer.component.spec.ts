import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

import { TreeViewerComponent } from './tree-viewer.component';
import { WorkspaceElement } from '../../service/workspace/workspace-element';

describe('TreeViewerComponent', () => {
  let component: TreeViewerComponent;
  let fixture: ComponentFixture<TreeViewerComponent>;
  let treeview : DebugElement

  let singleEmptyFolder: WorkspaceElement = {
    name: 'folder', path: '', expanded: false, type: 'folder',
    children: [ ]
  };

  let foldedFolderWithSubfolders: WorkspaceElement = {
    name: 'top-folder', path: '', expanded: false, type: 'folder',
    children: [
      { name: 'sub-folder-1', path: 'top-folder', expanded: false, type: 'folder', children: [] },
      { name: 'sub-folder-2', path: 'top-folder', expanded: false, type: 'folder', children: [] },
      { name: 'sub-file-1', path: 'top-folder', expanded: false, type: 'file', children: [] }
    ]
  };

  let singleFile: WorkspaceElement = { name: 'file', path: '', expanded: false, type: 'file', children: [] }

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TreeViewerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TreeViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

  });

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
    component.model = foldedFolderWithSubfolders;
    fixture.detectChanges();

    fixture.whenStable().then(() => { // wait for async actions
      treeview = fixture.debugElement.query(By.css('.tree-view'));
      let treeitems = treeview.queryAll(By.css('.tree-view-item-key'));
      expect(treeitems.length).toEqual(1);
      expect(treeitems[0].nativeElement.innerText).toContain('top-folder');

      expect(component.isFolderExpanded()).toBeFalsy(); // make sure it is folded beforehand
      expect(component.isFolderFolded()).toBeTruthy(); // make sure it is folded beforehand
    });
  });

  it('folded folder is exanded when clicked', () => {
    component.model = foldedFolderWithSubfolders;
    component.onClick();
    fixture.detectChanges();

    fixture.whenStable().then(() => { // wait for async actions
      treeview = fixture.debugElement.query(By.css('.tree-view'));
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
    component.model = foldedFolderWithSubfolders;
    expect(component.isFile()).toBeFalsy();
  });

  it('files are not identified as folders', () => {
    component.model = singleFile;
    expect(component.isFile()).toBeTruthy();
  });

});