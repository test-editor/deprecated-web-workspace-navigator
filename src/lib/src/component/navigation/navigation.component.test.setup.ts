import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NavigationComponent } from './navigation.component';
import { Workspace } from '../../common/workspace';
import { WorkspaceElement } from '../../common/workspace-element';
import { ElementType } from '../../common/element-type';

import { mock, when, anyOfClass, instance, verify, resetCalls } from 'ts-mockito';

import { PersistenceService } from '../../service/persistence/persistence.service';
import { TestExecutionService } from '../../service/execution/test.execution.service';
import { Response, ResponseOptions } from '@angular/http';

export const tclFile: WorkspaceElement = {
  name: "file.tcl",
  path: "path/to/file.tcl",
  type: ElementType.File,
  children: []
};

export const nonExecutableFile: WorkspaceElement = {
  name: 'nonExecutable.txt',
  path: 'path/to/nonExecutable.txt',
  type: ElementType.File,
  children: []
};

export function mockedPersistenceService() {
  const persistenceService = mock(PersistenceService);
  when(persistenceService.listFiles()).thenReturn(Promise.resolve(tclFile));
  return persistenceService;
}

export function mockedTestExecutionService() {
  const executionService = mock(TestExecutionService)
  const response = new Response(new ResponseOptions({status: 200}));
  when(executionService.execute(tclFile.path)).thenReturn(Promise.resolve(response));
  return executionService;
}

export function setupWorkspace(component: NavigationComponent, fixture: ComponentFixture<NavigationComponent>) {
  const subfolder: WorkspaceElement = {
    name: "subfolder",
    path: "subfolder",
    type: ElementType.Folder,
    children: [
      {
        name: 'newFolder',
        path: 'subfolder/newFolder',
        type: ElementType.Folder,
        children: []
      },
      nonExecutableFile,
      tclFile
    ]
  };
  const root: WorkspaceElement = {
    name: "root",
    path: "",
    type: ElementType.Folder,
    children: [subfolder]
  };
  component.workspace = new Workspace(root);
  fixture.detectChanges();
}
