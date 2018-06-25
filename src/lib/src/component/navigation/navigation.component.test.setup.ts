import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NavigationComponent } from './navigation.component';
import { Workspace } from '../../common/workspace';
import { WorkspaceElement } from '../../common/workspace-element';
import { ElementType } from '../../common/element-type';

import { mock, when, anyOfClass, instance, verify, resetCalls } from 'ts-mockito';

import { PersistenceService } from '../../service/persistence/persistence.service';
import { ElementState } from '../../common/element-state';
import { IndicatorFieldSetup } from '../../common/markers/field';
import { MessagingService } from '@testeditor/messaging-service';
import * as events from '../event-types';

export const HTTP_STATUS_OK = 200;
export const HTTP_STATUS_CREATED = 201;
export const HTTP_STATUS_ERROR = 500;

export const testEditorIndicatorFieldSetup: IndicatorFieldSetup = {
  fields: [
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
  ]
};


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

export const renamedSubfolder: WorkspaceElement = {
  name: 'renamedSubfolder',
  path: 'renamedSubfolder',
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
}

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

/**
export enum TestExecutionState {
  Idle = 0,
  LastRunSuccessful = 1,
  LastRunFailed = 2,
  Running = 3
} */
export const responseBeforeTermination = { path: tclFile.path, status: 3 };
const responseAfterTermination = { path: tclFile.path, status: 1 };

export function mockedPersistenceService() {
  const persistenceService = mock(PersistenceService);
  return persistenceService;
}

export function mockWorkspaceReloadRequestOnce(messagingService: MessagingService, response: WorkspaceElement): void {
  const subscription = messagingService.subscribe(events.WORKSPACE_RELOAD_REQUEST, () => {
    subscription.unsubscribe();
    messagingService.publish(events.WORKSPACE_RELOAD_RESPONSE, response);
});
}

export function setupWorkspace(component: NavigationComponent, messagingService: MessagingService,
  fixture: ComponentFixture<NavigationComponent>): void {

  component.retrieveWorkspaceRoot()
  messagingService.publish(events.WORKSPACE_RELOAD_RESPONSE, root);
  fixture.detectChanges();
}
