import { Component, OnInit, ChangeDetectorRef } from '@angular/core';

import { PersistenceService } from '../../service/persistence/persistence.service';
import { MessagingService } from '@testeditor/messaging-service';
import { ElementType } from '../../common/element-type';
import { WorkspaceElement, nameWithoutFileExtension } from '../../common/workspace-element';
import { Workspace } from '../../common/workspace';
import { UiState } from '../ui-state';
import * as events from '../event-types';
import { TestExecutionService } from '../../service/execution/test.execution.service';
import { ElementState } from '../../common/element-state';
import { KeyActions } from '../../common/key.actions';
import { WorkspaceNavigationHelper } from '../../common/util/workspace.navigation.helper';
import { Observable } from 'rxjs/Observable';
import { Subscriber } from 'rxjs/Subscriber';
import { Response } from '@angular/http';

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.css']
})

export class NavigationComponent implements OnInit {
  static readonly HTTP_STATUS_CREATED = 201;
  static readonly NOTIFICATION_TIMEOUT_MILLIS = 4000;

  private workspace: Workspace;
  uiState: UiState;
  workspaceNavigationHelper: WorkspaceNavigationHelper;
  errorMessage: string;
  notification: string;

  constructor(
    private messagingService: MessagingService,
    private changeDetectorRef: ChangeDetectorRef,
    private persistenceService: PersistenceService,
    private executionService: TestExecutionService
  ) {
    this.uiState = new UiState();
    this.workspaceNavigationHelper = new WorkspaceNavigationHelper(this.workspace, this.uiState);
  }

  ngOnInit(): void {
    this.retrieveWorkspaceRoot();
    this.subscribeToEvents();
  }

  retrieveWorkspaceRoot(): Promise<Workspace | undefined> {
    return this.persistenceService.listFiles().then(element => {
      this.setWorkspace(new Workspace(element));
      this.uiState.setExpanded(element.path, true);
      this.executionService.getStatusAll().then(testStates => {
        testStates.forEach(testStatus => {
          this.workspace.getElement(testStatus.path).state = this.getElementState(testStatus.status);
        });
      });
      return this.workspace;
    }).catch(() => {
      this.errorMessage = 'Could not retrieve workspace!';
      return undefined;
    });
  }

  private getElementState(status: string): ElementState {
    switch (status) {
      case 'RUNNING': return ElementState.Running;
      case 'SUCCESS': return ElementState.LastRunSuccessful;
      case 'FAILED': return ElementState.LastRunFailed;
    }
  }

  setWorkspace(workspace: Workspace) {
    this.workspace = workspace;
    this.workspaceNavigationHelper = new WorkspaceNavigationHelper(this.workspace, this.uiState);
  }

  getWorkspace() {
    return this.workspace;
  }

  subscribeToEvents(): void {
    this.messagingService.subscribe(events.EDITOR_ACTIVE, element => {
      this.uiState.activeEditorPath = element.path;
      this.uiState.selectedElement = null;
      this.changeDetectorRef.detectChanges();
    });
    this.messagingService.subscribe(events.EDITOR_CLOSE, element => {
      if (element.path === this.uiState.activeEditorPath) {
        this.uiState.activeEditorPath = null;
        this.changeDetectorRef.detectChanges();
      }
      if (this.uiState.isDirty(element.path)) {
        this.uiState.setDirty(element.path, false);
        this.changeDetectorRef.detectChanges();
      }
    });
    this.messagingService.subscribe(events.EDITOR_DIRTY_CHANGED, element => {
      this.uiState.setDirty(element.path, element.dirty);
      this.changeDetectorRef.detectChanges();
    });
    this.messagingService.subscribe(events.NAVIGATION_DELETED, element => {
      let isSelectedElement = this.uiState.selectedElement && this.uiState.selectedElement.path === element.path;
      if (isSelectedElement) {
        this.uiState.selectedElement = null;
      }
      this.uiState.setDirty(element.path, false);
      this.uiState.setExpanded(element.path, false);
      this.retrieveWorkspaceRoot();
      this.changeDetectorRef.detectChanges();
    });
    this.messagingService.subscribe(events.NAVIGATION_CREATED, payload => {
      this.handleNavigationCreated(payload);
    });
    this.messagingService.subscribe(events.NAVIGATION_SELECT, element => {
      this.uiState.selectedElement = element as WorkspaceElement;
      this.changeDetectorRef.detectChanges();
    });
  }

  handleNavigationCreated(payload: any): void {
    this.retrieveWorkspaceRoot().then(workspace => {
      if (workspace) {
        this.revealElement(payload.path);
        this.selectElement(payload.path);
      }
    });
  }

  newElement(type: string): void {
    let selectedElement = this.uiState.selectedElement;
    if (selectedElement) {
      if (selectedElement.type === ElementType.Folder) {
        this.uiState.setExpanded(selectedElement.path, true);
      }
    }
    this.uiState.newElementRequest = {
      selectedElement: selectedElement,
      type: type
    };
    this.changeDetectorRef.detectChanges();
  }

  refresh(): void {
    this.retrieveWorkspaceRoot();
  }

  run(): void {
    let elementToBeExecuted = this.uiState.selectedElement;
    if (elementToBeExecuted == null) {
      elementToBeExecuted = this.workspace.getElement(this.uiState.activeEditorPath);
    }

    this.executionService.execute(elementToBeExecuted.path).then(response => {
      if (response.status === NavigationComponent.HTTP_STATUS_CREATED) {
        elementToBeExecuted.state = ElementState.Running;
        this.notification = `Execution of "${nameWithoutFileExtension(elementToBeExecuted)}" has been started.`;
        setTimeout(() => {
          this.notification = null;
        }, NavigationComponent.NOTIFICATION_TIMEOUT_MILLIS);
        this.monitorTestStatus(elementToBeExecuted);
      } else {
        this.errorMessage = `The test "${nameWithoutFileExtension(elementToBeExecuted)}" could not be started.`;
        setTimeout(() => {
          this.errorMessage = null;
        }, NavigationComponent.NOTIFICATION_TIMEOUT_MILLIS);
      }
    });
  }

  collapseAll(): void {
    this.uiState.clearExpanded();
    this.uiState.setExpanded(this.workspace.root.path, true);
  }

  revealElement(path: string): void {
    let subpaths = this.workspace.getSubpaths(path);
    subpaths.forEach(subpath => this.uiState.setExpanded(subpath, true));
    this.uiState.setExpanded(this.workspace.root.path, true);
  }

  selectElement(path: string): void {
    let element = this.workspace.getElement(path);
    this.uiState.selectedElement = element;
  }

  selectionIsExecutable(): boolean {
    let contextElement = this.getContextElement();

    return contextElement !== null && contextElement.path.endsWith('.tcl') && contextElement.state !== ElementState.Running;
  }

  private getContextElement(): WorkspaceElement {
    if (this.uiState.selectedElement !== null) {
      return this.uiState.selectedElement;
    } else if (this.uiState.activeEditorPath != null) {
      return this.workspace.getElement(this.uiState.activeEditorPath);
    } else {
      return null;
    }
  }

  onKeyUp(event: KeyboardEvent) {
    console.log('KeyUp event received:\n' + event);
    let element = this.uiState.selectedElement;
    switch (event.key) {
      case KeyActions.EXPAND_NODE: return this.expandNode(element);
      case KeyActions.COLLAPSE_NODE: return this.collapseNode(element);
      case KeyActions.NAVIGATE_NEXT: return this.selectSuccessor(element);
      case KeyActions.NAVIGATE_PREVIOUS: return this.selectPredecessor(element);
      case KeyActions.OPEN_FILE: return this.openFile(element);
    }
  }

  private monitorTestStatus(element: WorkspaceElement): void {
    let self = this;
    let observableTestStatus = new Observable<string>(observer => {
      self.executionService.status(element.path).then(response => {
        self.evaluateGetStatusResponseAndRepeat(element.path, response, observer, self);
      });
    });

    observableTestStatus.subscribe(status => { this.setTestStatus(element, status); });
  }

  private evaluateGetStatusResponseAndRepeat(testPath: string, lastResponse: Response, observer: Subscriber<string>, self: NavigationComponent): void {
    let status = lastResponse.text();
    if (!lastResponse.ok) {
      observer.complete();
    } else if (status !== 'RUNNING') {
      observer.next(status);
      observer.complete();
    } else {
      observer.next(status);
      self.executionService.status(testPath).then(response => {
        self.evaluateGetStatusResponseAndRepeat(testPath, response, observer, self);
      });
    }
  }

  private setTestStatus(element: WorkspaceElement, status: string): void {
    switch (status) {
      case 'RUNNING': element.state = ElementState.Running; break;
      case 'SUCCESS': element.state = ElementState.LastRunSuccessful; break;
      case 'FAILED': element.state = ElementState.LastRunFailed; break;
      case 'IDLE': default: element.state = ElementState.Idle;
    }
  }

  private expandNode(element: WorkspaceElement): void {
    if (element !== null && element.type === ElementType.Folder) {
      this.uiState.setExpanded(element.path, true);
    }
  }

  private collapseNode(element: WorkspaceElement): void {
    if (element !== null && element.type === ElementType.Folder) {
      this.uiState.setExpanded(element.path, false);
    }
  }

  private selectPredecessor(element: WorkspaceElement): void {
    let predecessor = this.workspaceNavigationHelper.previousVisible(element);
    if (predecessor != null) {
      this.uiState.selectedElement = predecessor;
      this.changeDetectorRef.detectChanges();
    }
  }

  private selectSuccessor(element: WorkspaceElement): void {
    let successor = this.workspaceNavigationHelper.nextVisible(element);
    if (successor != null) {
      this.uiState.selectedElement = successor;
      this.changeDetectorRef.detectChanges();
    }
  }

  private openFile(element: WorkspaceElement): void {
    if (element !== null && element.type === ElementType.File) {
      this.messagingService.publish(events.NAVIGATION_OPEN, {
        name: element.name,
        path: element.path
      });
    }
  }

}
