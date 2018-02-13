import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NavigationComponent } from './navigation.component';
import { Workspace } from '../../common/workspace';
import { WorkspaceElement } from '../../common/workspace-element';
import { ElementType } from '../../common/element-type';

import { mock, when, anyOfClass, instance, verify, resetCalls } from 'ts-mockito';

import { PersistenceService } from '../../service/persistence/persistence.service';
import { TestExecutionService } from '../../service/execution/test.execution.service';
import { Response, ResponseOptions } from '@angular/http';
import { ElementState } from '../../common/element-state';

export const HTTP_STATUS_OK = 200;
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

export const subfolder: WorkspaceElement = {
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

export const root: WorkspaceElement = {
  name: 'root',
  path: '',
  type: ElementType.Folder,
  children: [subfolder]
};

export const responseBeforeTermination = new Response(new ResponseOptions({
  status: HTTP_STATUS_OK,
  body: 'RUNNING'
}));
const responseAfterTermination = new Response(new ResponseOptions({
  status: HTTP_STATUS_OK,
  body: 'SUCCESS'
}));

export function mockedPersistenceService() {
  const persistenceService = mock(PersistenceService);
  when(persistenceService.listFiles()).thenReturn(Promise.resolve(tclFile));
  return persistenceService;
}

export function mockedTestExecutionService() {
  const executionService = mock(TestExecutionService);
  setTestExecutionServiceResponse(executionService, HTTP_STATUS_CREATED​​);
  mockTestStatusServiceWithRunningRunningSuccessSequence(executionService);
  when(executionService.statusAll()).thenReturn(Promise.resolve(new Map<string, ElementState>([])));
  return executionService;
}

export function setTestExecutionServiceResponse(service: TestExecutionService, statusCode: number) {
  const response = new Response(new ResponseOptions({status: statusCode}));
  when(service.execute(tclFile.path)).thenReturn(Promise.resolve(response));
}

export function mockTestStatusServiceWithRunningRunningSuccessSequence(service: TestExecutionService) {
  when(service.status(tclFile.path))
      .thenReturn(Promise.resolve(responseBeforeTermination))
      .thenReturn(Promise.resolve(responseBeforeTermination))
      .thenReturn(Promise.resolve(responseAfterTermination));
}

export function mockTestStatusServiceWithPromiseRunning(service: TestExecutionService, delayMillis: number) {
  when(service.status(tclFile.path))
      .thenCall(() => new Promise(resolve => setTimeout(() => resolve(responseBeforeTermination), delayMillis)));
}

export function setupWorkspace(component: NavigationComponent, mockedPersistenceService: PersistenceService, fixture: ComponentFixture<NavigationComponent>): Promise<Workspace> {

  when(mockedPersistenceService.listFiles()).thenReturn(Promise.resolve(root));
  return component.retrieveWorkspaceRoot().then(workspace => {
    fixture.detectChanges();
    return workspace;
  });
}
