import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';

import { PersistenceService } from '../../service/persistence/persistence.service';
import { MessagingService } from '@testeditor/messaging-service';
import { ElementType } from '../../common/element-type';
import { Workspace } from '../../common/workspace';
import { UiState } from '../ui-state';
import * as events from '../event-types';
import { ElementState } from '../../common/element-state';
import { KeyActions } from '../../common/key.actions';
import { Subject } from 'rxjs/Subject';
import { MarkerObserver } from '../../common/markers/marker.observer';
import { WorkspaceElement } from '../../common/workspace-element';
import { WorkspaceObserver } from '../../common/markers/workspace.observer';
import { ISubscription } from 'rxjs/Subscription';

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.css']
})

export class NavigationComponent implements OnInit, OnDestroy {
  static readonly HTTP_STATUS_CREATED = 201;
  static readonly NOTIFICATION_TIMEOUT_MILLIS = 4000;

  private stopPollingTestStatus: Subject<void> = new Subject<void>();
  private subscriptions: ISubscription[] = [];

  workspace: Workspace;
  errorMessage: string;
  notification: string;
  public refreshClassValue  = '';

  private workspaceReloadResponse = (root: WorkspaceElement) => this.defaultWorkspaceReloadResponse(root);

  constructor(
    private messagingService: MessagingService,
    private changeDetectorRef: ChangeDetectorRef,
    private persistenceService: PersistenceService,
  ) {
    this.workspace = new Workspace();
  }

  ngOnInit(): void {
    this.subscribeToEvents();
    this.retrieveWorkspaceRoot();
  }

  ngOnDestroy(): void {
    this.stopPollingTestStatus.next();
    this.stopPollingTestStatus.complete();
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  retrieveWorkspaceRoot(onResponse?: (root: WorkspaceElement) => void): void {
    this.retrieveWorkspaceRootVia(null, onResponse);
  }

  private retrieveWorkspaceRootVia(payload: any, onResponse?: (root: WorkspaceElement) => void): void {
    if (onResponse != null) {
      this.workspaceReloadResponse = onResponse;
    }
    if (payload) {
      // this notification will be hidden as soon as workspace reload response was received (see subscription)
      this.notification = 'Rebuilding and reloading index ...';
      this.refreshClassValue = 'fa-spin'
    }
    this.messagingService.publish(events.WORKSPACE_RELOAD_REQUEST, payload);
  }

  private defaultWorkspaceReloadResponse(root: WorkspaceElement) {
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
    this.subscriptions.push(this.messagingService.subscribe(events.NAVIGATION_RENAMED, (paths) => {
      const wasSelectedElement = this.workspace.getSelected() && this.workspace.getSelected() === paths.oldPath;
      const wasExpanded = this.workspace.isExpanded(paths.oldPath);
      this.workspace.setDirty(paths.oldPath, false); // TODO: should not work on dirty files! UI needs to make sure that this won't happen
      this.workspace.setExpanded(paths.oldPath, false);
      this.retrieveWorkspaceRoot((root) => {
        this.defaultWorkspaceReloadResponse(root);
        if (wasSelectedElement) {
          this.workspace.setSelected(paths.newPath);
        }
        this.workspace.setExpanded(paths.newPath, wasExpanded);
        this.changeDetectorRef.detectChanges();
      });
    }));
    this.subscriptions.push(this.messagingService.subscribe(events.WORKSPACE_RELOAD_RESPONSE, (root) => {
      this.workspaceReloadResponse(root);
      this.workspaceReloadResponse = (root_) => this.defaultWorkspaceReloadResponse(root_);
      this.refreshClassValue = '';
      this.hideNotification();
    }));
    this.subscriptions.push(this.messagingService.subscribe(events.EDITOR_ACTIVE, element => {
      this.workspace.setActive(element.path);
      this.workspace.setSelected(null);
      this.changeDetectorRef.detectChanges();
    }));
    this.subscriptions.push(this.messagingService.subscribe(events.EDITOR_CLOSE, element => {
      if (element.path === this.workspace.getActive()) {
        this.workspace.setActive(null);
        this.changeDetectorRef.detectChanges();
      }
      if (this.workspace.isDirty(element.path)) {
        this.workspace.setDirty(element.path, false);
        this.changeDetectorRef.detectChanges();
      }
    }));
    this.subscriptions.push(this.messagingService.subscribe(events.EDITOR_DIRTY_CHANGED, element => {
      this.workspace.setDirty(element.path, element.dirty);
      this.changeDetectorRef.detectChanges();
    }));
    this.subscriptions.push(this.messagingService.subscribe(events.NAVIGATION_DELETED, element => {
      let isSelectedElement = this.workspace.getSelected() && this.workspace.getSelected() === element.path;
      if (isSelectedElement) {
        this.workspace.setSelected(null);
      }
      this.workspace.setDirty(element.path, false);
      this.workspace.setExpanded(element.path, false);
      this.retrieveWorkspaceRoot((root) => {
        this.defaultWorkspaceReloadResponse(root);
        this.changeDetectorRef.detectChanges();
      });
    }));
    this.subscriptions.push(this.messagingService.subscribe(events.NAVIGATION_CREATED, payload => {
      this.handleNavigationCreated(payload);
    }));
    this.subscriptions.push(this.messagingService.subscribe(events.NAVIGATION_SELECT, element => {
      this.workspace.setSelected(element.path);
      this.changeDetectorRef.detectChanges();
    }));
    this.subscriptions.push(this.messagingService.subscribe(events.WORKSPACE_MARKER_UPDATE, updates => {
      this.workspace.updateMarkers(updates);
      this.changeDetectorRef.detectChanges();
    }));
    this.subscriptions.push(this.messagingService.subscribe(events.WORKSPACE_MARKER_OBSERVE, (observer: MarkerObserver<any>) => {
      this.workspace.observeMarker(observer);
    }));
    this.subscriptions.push(this.messagingService.subscribe(events.WORKSPACE_OBSERVE, (observer: WorkspaceObserver) => {
      this.workspace.observe(observer);
    }));
    this.subscriptions.push(this.messagingService.subscribe(events.TEST_EXECUTION_STARTED, payload => {
      this.handleTestExecutionStarted(payload);
    }));
    this.subscriptions.push(this.messagingService.subscribe(events.TEST_EXECUTION_START_FAILED, payload => {
      this.handleTestExecutionStartFailed(payload);
    }));
  }

  handleNavigationCreated(payload: any): void {
    this.retrieveWorkspaceRoot((root: WorkspaceElement) => {
      this.defaultWorkspaceReloadResponse(root);
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
    if (!this.refreshRunning()) {
      this.retrieveWorkspaceRootVia({ rebuild: true });
    }
  }

  run(): void {
    const elementPathToBeExecuted = this.workspace.getSelected() || this.workspace.getActive();
    this.messagingService.publish(events.TEST_EXECUTE_REQUEST, elementPathToBeExecuted);
  }

  handleTestExecutionStarted(payload: any): void {
    this.workspace.setMarkerValue(payload.path, 'testStatus', { path: payload.path, status: ElementState.Running });
    this.changeDetectorRef.markForCheck();
    this.showNotification(payload.message, payload.path);
  }

  handleTestExecutionStartFailed(payload: any): void {
    this.workspace.setMarkerValue(payload.path, 'testStatus', { path: payload.path, status: ElementState.LastRunFailed });
    this.changeDetectorRef.markForCheck();
    this.showErrorMessage(payload.message, payload.path);
  }

  hideNotification(): void {
    this.notification = null;
  }

  showNotification(notification: string, path: string): void {
    this.notification = notification.replace('\${}', this.workspace.nameWithoutFileExtension(path));
    setTimeout(() => { this.hideNotification(); }, NavigationComponent.NOTIFICATION_TIMEOUT_MILLIS);
  }

  showErrorMessage(errorMessage: string, path: string): void {
    this.errorMessage = errorMessage.replace('\${}', this.workspace.nameWithoutFileExtension(path));
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
         this.workspace.getMarkerValue(contextElementPath, 'testStatus').status !== ElementState.Running);
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

  onKeyDown(event: KeyboardEvent) {
    switch (event.key) {
      case KeyActions.NAVIGATE_PREVIOUS:
      case KeyActions.NAVIGATE_NEXT:
        event.preventDefault(); // TODO: make sure to not scroll out of visible range
        break;
      default: // do nothing
    }
  }

  onKeyUp(event: KeyboardEvent) {
    console.log('KeyUp event received:\n' + event);
    let elementPath = this.workspace.getSelected();
    switch (event.key) {
      case KeyActions.EXPAND_NODE:
        event.stopPropagation();
        this.workspace.setExpanded(elementPath, true);
        break;
      case KeyActions.COLLAPSE_NODE:
        event.stopPropagation();
        this.workspace.setExpanded(elementPath, false);
        break;
      case KeyActions.NAVIGATE_NEXT:
        event.stopPropagation();
        event.preventDefault();
        this.workspace.selectSuccessor();
        this.changeDetectorRef.detectChanges();
        break;
      case KeyActions.NAVIGATE_PREVIOUS:
        event.stopPropagation();
        event.preventDefault();
        this.workspace.selectPredecessor();
        this.changeDetectorRef.detectChanges();
        break;
      case KeyActions.OPEN_FILE:
        if (!this.workspace.hasRenameElementRequest()) {
          event.stopPropagation();
          this.openFile(elementPath);
        }
        break;
      case KeyActions.RENAME_FILE:
        event.stopPropagation();
        this.renameSelectedFile();
        break;
      default: // ignore other keyevents
    }
  }

  private renameSelectedFile(): void {
    const elementPath = this.getWorkspace().getSelected();
    if (elementPath !== null) {
      this.workspace.renameSelectedElement();
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

  refreshRunning(): boolean {
    return this.refreshClassValue !== '';
  }

}
