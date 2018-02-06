import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';

import { PersistenceService } from '../../service/persistence/persistence.service';
import { MessagingService } from '@testeditor/messaging-service';
import { ElementType } from '../../common/element-type';
import { WorkspaceElement } from '../../common/workspace-element';
import { Workspace } from '../../common/workspace';
import { UiState } from '../ui-state';
import * as events from '../event-types';
import { TestExecutionService } from '../../service/execution/test.execution.service';
import { ElementState } from '../../common/element-state';
import { KeyActions } from '../../common/key.actions';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/takeUntil';
import { Subscriber } from 'rxjs/Subscriber';
import { Response } from '@angular/http';
import { Subject } from 'rxjs/Subject';

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.css']
})

export class NavigationComponent implements OnInit, OnDestroy {
  static readonly HTTP_STATUS_CREATED = 201;
  static readonly NOTIFICATION_TIMEOUT_MILLIS = 4000;

  private workspace: Workspace;
  private stopPollingTestStatus: Subject<void> = new Subject<void>();
  errorMessage: string;
  notification: string;

  constructor(
    private messagingService: MessagingService,
    private changeDetectorRef: ChangeDetectorRef,
    private persistenceService: PersistenceService,
    private executionService: TestExecutionService
  ) {
  }

  ngOnInit(): void {
    this.retrieveWorkspaceRoot();
    this.subscribeToEvents();
  }

  ngOnDestroy(): void {
    this.stopPollingTestStatus.next();
    this.stopPollingTestStatus.complete();
  }

  retrieveWorkspaceRoot(): Promise<Workspace | undefined> {
    const workspaceFiles = this.persistenceService.listFiles();
    return workspaceFiles.then(element => {
      this.workspace = new Workspace(element);
      this.updateTestStates();
      return this.workspace;
    }).catch(() => {
      this.errorMessage = 'Could not retrieve workspace!';
      return undefined;
    });
  }

  private updateTestStates(): void {
    this.stopPollingTestStatus.next(); // remaining polling tasks refer to elements potentially invalidated by a workspace refresh
    this.executionService.statusAll().then(testStates => {
      testStates.forEach((status, path) => {
        let workspaceElement = this.workspace.getElement(path);
        workspaceElement.state = status;
        if (status === ElementState.Running) {
          this.monitorTestStatus(workspaceElement);
        }
      });
    });
  }

  getWorkspace() {
    return this.workspace;
  }

  subscribeToEvents(): void {
    this.messagingService.subscribe(events.EDITOR_ACTIVE, element => {
      this.workspace.setActive(element.path);
      this.workspace.setSelected(null);
      this.changeDetectorRef.detectChanges();
    });
    this.messagingService.subscribe(events.EDITOR_CLOSE, element => {
      if (element.path === this.workspace.getActive()) {
        this.workspace.setActive(null);
        this.changeDetectorRef.detectChanges();
      }
      if (this.workspace.isDirty(element.path)) {
        this.workspace.setDirty(element.path, false);
        this.changeDetectorRef.detectChanges();
      }
    });
    this.messagingService.subscribe(events.EDITOR_DIRTY_CHANGED, element => {
      this.workspace.setDirty(element.path, element.dirty);
      this.changeDetectorRef.detectChanges();
    });
    this.messagingService.subscribe(events.NAVIGATION_DELETED, element => {
      let isSelectedElement = this.workspace.getSelected() && this.workspace.getSelected() === element.path;
      if (isSelectedElement) {
        this.workspace.setSelected(null);
      }
      this.workspace.setDirty(element.path, false);
      this.workspace.setExpanded(element.path, false);
      this.retrieveWorkspaceRoot();
      this.changeDetectorRef.detectChanges();
    });
    this.messagingService.subscribe(events.NAVIGATION_CREATED, payload => {
      this.handleNavigationCreated(payload);
    });
    this.messagingService.subscribe(events.NAVIGATION_SELECT, element => {
      this.workspace.setSelected = element.path;
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
    this.workspace.newElement(type);
    this.changeDetectorRef.detectChanges();
  }

  refresh(): void {
    this.retrieveWorkspaceRoot();
  }

  run(): void {
    let elementPathToBeExecuted = this.workspace.getSelected();
    if (elementPathToBeExecuted == null) {
      elementPathToBeExecuted = this.workspace.getActive();
    }

    this.executionService.execute(elementPathToBeExecuted).then(response => {
      const elementToBeExecuted = this.workspace.getElement(elementPathToBeExecuted)
      if (response.status === NavigationComponent.HTTP_STATUS_CREATED) {
        elementToBeExecuted.state = ElementState.Running;
        this.notification = `Execution of "${WorkspaceElement.nameWithoutFileExtension(elementToBeExecuted)}" has been started.`;
        setTimeout(() => {
          this.notification = null;
        }, NavigationComponent.NOTIFICATION_TIMEOUT_MILLIS);
        this.monitorTestStatus(elementToBeExecuted);
      } else {
        this.errorMessage = `The test "${WorkspaceElement.nameWithoutFileExtension(elementToBeExecuted)}" could not be started.`;
        setTimeout(() => {
          this.errorMessage = null;
        }, NavigationComponent.NOTIFICATION_TIMEOUT_MILLIS);
      }
    });
  }

  collapseAll(): void {
    this.workspace.collapseAll();
  }

  revealElement(path: string): void {
    this.workspace.revealElement(path);
  }

  selectElement(path: string): void {
    this.workspace.setSelected(path);
  }

  selectionIsExecutable(): boolean {
    let contextElement = this.workspace.getElement(this.getContextElement());

    return contextElement !== null && contextElement.path.endsWith('.tcl') && contextElement.state !== ElementState.Running;
  }

  private getContextElement(): string {
    if (this.workspace.getSelected() !== null) {
      return this.workspace.getSelected();
    } else if (this.workspace.getActive() != null) {
      return this.workspace.getActive();
    } else {
      return null;
    }
  }

  onKeyUp(event: KeyboardEvent) {
    console.log('KeyUp event received:\n' + event);
    let element = this.workspace.getElement(this.workspace.getSelected());
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
    observableTestStatus.takeUntil(this.stopPollingTestStatus).subscribe( status => this.setTestStatus(element, status) );
  }

  private evaluateGetStatusResponseAndRepeat(testPath: string, lastResponse: Response, observer: Subscriber<string>, self: NavigationComponent): void {
    let status = lastResponse.text();
    if (!lastResponse.ok) {
      observer.complete();
    } else if (status !== 'RUNNING') {
      observer.next(status);
      observer.complete();
    } else if (!observer.closed) {
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
      this.workspace.setExpanded(element.path, true);
    }
  }

  private collapseNode(element: WorkspaceElement): void {
    if (element !== null && element.type === ElementType.Folder) {
      this.workspace.setExpanded(element.path, false);
    }
  }

  private selectPredecessor(element: WorkspaceElement): void {
    let predecessor = this.workspace.previousVisible(element);
    if (predecessor != null) {
      this.workspace.setSelected(predecessor.path);
      this.changeDetectorRef.detectChanges();
    }
  }

  private selectSuccessor(element: WorkspaceElement): void {
    let successor = this.workspace.nextVisible(element);
    if (successor != null) {
      this.workspace.setSelected(successor.path);
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
