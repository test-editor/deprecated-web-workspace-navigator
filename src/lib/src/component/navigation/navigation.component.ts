import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';

import { PersistenceService } from '../../service/persistence/persistence.service';
import { MessagingService } from '@testeditor/messaging-service';
import { ElementType } from '../../common/element-type';
import { Workspace } from '../../common/workspace';
import { UiState } from '../ui-state';
import * as events from '../event-types';
import { ElementState } from '../../common/element-state';
import { KeyActions } from '../../common/key.actions';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/takeUntil';
import { Subscriber } from 'rxjs/Subscriber';
import { Response } from '@angular/http';
import { Subject } from 'rxjs/Subject';
import { MarkerObserver } from '../../common/markers/marker.observer';
import { WorkspaceElement } from '../../common/workspace-element';
import { WorkspaceObserver } from '../../common/markers/workspace.observer';

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.css']
})

export class NavigationComponent implements OnInit, OnDestroy {
  static readonly HTTP_STATUS_CREATED = 201;
  static readonly NOTIFICATION_TIMEOUT_MILLIS = 4000;

  workspace: Workspace;
  private stopPollingTestStatus: Subject<void> = new Subject<void>();
  errorMessage: string;
  notification: string;

  constructor(
    private messagingService: MessagingService,
    private changeDetectorRef: ChangeDetectorRef,
    private persistenceService: PersistenceService,
  ) {
    this.workspace = new Workspace();
  }

  ngOnInit(): void {
    this.retrieveWorkspaceRoot();
    this.subscribeToEvents();
  }

  ngOnDestroy(): void {
    this.stopPollingTestStatus.next();
    this.stopPollingTestStatus.complete();
  }

  retrieveWorkspaceRoot(onResponse?: (root: WorkspaceElement) => void): void {
    const responseSubscription = this.messagingService.subscribe(events.WORKSPACE_RELOAD_RESPONSE, (root) => {
      responseSubscription.unsubscribe();
      if (onResponse != null) {
        onResponse(root);
      } else {
        this.onWorkspaceReloadResponse(root);
      }

    });
    this.messagingService.publish(events.WORKSPACE_RELOAD_REQUEST, null);
  }

  private onWorkspaceReloadResponse(root: WorkspaceElement) {
    if (this.isWorkspaceElement(root)) {
      this.workspace.reload(root);
    } else {
      this.errorMessage = 'Could not retrieve workspace!';
    }
  }

  private isWorkspaceElement(element: WorkspaceElement): boolean {
    return element != null && element.children !== undefined && element.name && element.path !== undefined && element.type !== undefined;
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
      this.retrieveWorkspaceRoot((root) => {
        this.onWorkspaceReloadResponse(root);
        this.changeDetectorRef.detectChanges();
      });
    });
    this.messagingService.subscribe(events.NAVIGATION_CREATED, payload => {
      this.handleNavigationCreated(payload);
    });
    this.messagingService.subscribe(events.NAVIGATION_SELECT, element => {
      this.workspace.setSelected(element.path);
      this.changeDetectorRef.detectChanges();
    });
    this.messagingService.subscribe(events.WORKSPACE_MARKER_UPDATE, updates => {
      this.workspace.updateMarkers(updates);
      this.changeDetectorRef.detectChanges();
    });
    this.messagingService.subscribe(events.WORKSPACE_MARKER_OBSERVE, (observer: MarkerObserver<any>) => {
      this.workspace.observeMarker(observer);
    });
    this.messagingService.subscribe(events.WORKSPACE_OBSERVE, (observer: WorkspaceObserver) => {
      this.workspace.observe(observer);
    });
    this.messagingService.subscribe(events.TEST_EXECUTION_STARTED, payload => {
      this.handleTestExecutionStarted(payload);
    });
    this.messagingService.subscribe(events.TEST_EXECUTION_START_FAILED, payload => {
      this.handleTestExecutionStartFailed(payload);
    });
  }

  handleNavigationCreated(payload: any): void {
    this.retrieveWorkspaceRoot((root: WorkspaceElement) => {
      this.onWorkspaceReloadResponse(root);
      if (root) {
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
    const elementPathToBeExecuted = this.workspace.getSelected() || this.workspace.getActive();
    this.messagingService.publish(events.TEST_EXECUTE_REQUEST, elementPathToBeExecuted);
  }

  handleTestExecutionStarted(payload: any): void {
    this.showNotification(payload.message, payload.path);
  }

  handleTestExecutionStartFailed(payload: any): void {
    this.showErrorMessage(payload.message, payload.path);
  }

  showNotification(notification: string, path: string): void {
    this.notification = notification.replace("\${}", this.workspace.nameWithoutFileExtension(path));
        setTimeout(() => {
          this.notification = null;
        }, NavigationComponent.NOTIFICATION_TIMEOUT_MILLIS);
  }

  showErrorMessage(errorMessage: string, path: string) : void {
    this.errorMessage = errorMessage.replace("\${}", this.workspace.nameWithoutFileExtension(path));
        setTimeout(() => {
          this.errorMessage = null;
        }, NavigationComponent.NOTIFICATION_TIMEOUT_MILLIS);
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
    let contextElementPath = this.getContextElement();

    return contextElementPath != null && contextElementPath.endsWith('.tcl') &&
        (!this.workspace.hasMarker(contextElementPath, 'testStatus') ||
         this.workspace.getMarkerValue(contextElementPath, 'testStatus') !== ElementState.Running);
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
    let elementPath = this.workspace.getSelected();
    switch (event.key) {
      case KeyActions.EXPAND_NODE: this.workspace.setExpanded(elementPath, true); break;
      case KeyActions.COLLAPSE_NODE: this.workspace.setExpanded(elementPath, false); break;
      case KeyActions.NAVIGATE_NEXT: {
        this.workspace.selectSuccessor();
        this.changeDetectorRef.detectChanges();
        break;
      }
      case KeyActions.NAVIGATE_PREVIOUS: {
        this.workspace.selectPredecessor();
        this.changeDetectorRef.detectChanges();
        break;
      }
      case KeyActions.OPEN_FILE: this.openFile(elementPath); break;
    }
  }

  private openFile(elementPath: string): void {
    const elementInfo = this.getWorkspace().getElementInfo(elementPath);
    if (elementInfo !== null && elementInfo.type === ElementType.File) {
      this.messagingService.publish(events.NAVIGATION_OPEN, {
        name: elementInfo.name,
        path: elementInfo.path
      });
    }
  }

}
