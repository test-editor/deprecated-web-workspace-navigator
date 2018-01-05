import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NavigationComponent } from './navigation.component';
import { Workspace } from '../../common/workspace';
import { WorkspaceElement } from '../../common/workspace-element';
import { ElementType } from '../../common/element-type';

import { mock, when, anyOfClass, instance, verify, resetCalls } from 'ts-mockito';

import { PersistenceService } from '../../service/persistence/persistence.service';
import { TestExecutionService } from '../../service/execution/test.execution.service';
import { Response, ResponseOptions } from '@angular/http';

export const HTTP_STATUS_CREATED = 201;
export const HTTP_STATUS_ERROR = 500;

export const tclFile: WorkspaceElement = {
  name: 'file.tcl',
  path: 'subfolder/file.tcl',
  type: ElementType.File,
  children: []
};

export const nonExecutableFile: WorkspaceElement = {
  name: 'nonExecutable.txt',
  path: 'subfolder/nonExecutable.txt',
  type: ElementType.File,
  children: []
};

export const succeedingSiblingOfTclFile: WorkspaceElement = {
  name: 'siblingOf.file.tcl',
  path: 'subfolder/siblingOf.file.tcl',
  type: ElementType.File,
  children: []
};

export const lastElement: WorkspaceElement = {
  name: 'last.element',
  path: 'subfolder/last.element',
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
  setTestExecutionServiceResponse(executionService, HTTP_STATUS_CREATED​​);
  return executionService;
}

export function setTestExecutionServiceResponse(service: TestExecutionService, statusCode: number) {
  const response = new Response(new ResponseOptions({status: statusCode}));
  when(service.execute(tclFile.path)).thenReturn(Promise.resolve(response));
}

export function setupWorkspace(component: NavigationComponent, fixture: ComponentFixture<NavigationComponent>) {
  const subfolder: WorkspaceElement = {
    name: 'subfolder',
    path: 'subfolder',
    type: ElementType.Folder,
    children: [
      {
        name: 'newFolder',
        path: 'subfolder/newFolder',
        type: ElementType.Folder,
        children: []
      },
      nonExecutableFile,
      tclFile,
      succeedingSiblingOfTclFile,
      lastElement
    ]
  };
  const root: WorkspaceElement = {
    name: 'root',
    path: '',
    type: ElementType.Folder,
    children: [subfolder]
  };
  component.setWorkspace(new Workspace(root));
  fixture.detectChanges();
}
