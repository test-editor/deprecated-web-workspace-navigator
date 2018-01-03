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

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.css']
})

export class NavigationComponent implements OnInit {
  static readonly HTTP_STATUS_CREATED = 201;
  static readonly NOTIFICATION_TIMEOUT_MILLIS = 4000;

  /**
   * See https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values
   */
  readonly KEY_RIGHT = 'ArrowRight';
  readonly KEY_LEFT = 'ArrowLeft';
  readonly KEY_UP = 'ArrowUp';
  readonly KEY_DOWN = 'ArrowDown';

  workspace: Workspace;
  uiState: UiState;
  errorMessage: string;
  notification: string;

  constructor(
    private messagingService: MessagingService,
    private changeDetectorRef: ChangeDetectorRef,
    private persistenceService: PersistenceService,
    private executionService: TestExecutionService
  ) {
    this.uiState = new UiState();
  }

  ngOnInit(): void {
    this.retrieveWorkspaceRoot();
    this.subscribeToEvents();
  }

  retrieveWorkspaceRoot(): Promise<Workspace | undefined> {
    return this.persistenceService.listFiles().then(element => {
      this.workspace = new Workspace(element);
      this.uiState.setExpanded(element.path, true);
      return this.workspace;
    }).catch(() => {
      this.errorMessage = 'Could not retrieve workspace!';
      return undefined;
    });
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
    return (this.uiState.selectedElement === null && this.uiState.activeEditorPath !== null && this.uiState.activeEditorPath.endsWith('.tcl'))
        || (this.uiState.selectedElement !== null && this.uiState.selectedElement.path.endsWith('.tcl'));
  }

  onKeyUp(event: KeyboardEvent) {
    console.log('KeyUp event received:\n' + event);
    let element = this.uiState.selectedElement;
    switch (event.key) {
      case this.KEY_RIGHT: {
        if (element.type === ElementType.Folder) {
          this.uiState.setExpanded(element.path, true);
        }
        break;
      }
      case this.KEY_LEFT: {
        if (element.type === ElementType.Folder) {
          this.uiState.setExpanded(element.path, false);
        }
        break;
      }
      case this.KEY_DOWN: {
        let successor = this.next(this.uiState.selectedElement);
        if (successor != null) {
          this.uiState.selectedElement = successor;
          this.changeDetectorRef.detectChanges();
        }
        break;
      }
      case this.KEY_UP: {
        let predecessor = this.previous(this.uiState.selectedElement);
        if (predecessor != null) {
          this.uiState.selectedElement = predecessor;
          this.changeDetectorRef.detectChanges();
        }
      }
    }
  }

  private next(element: WorkspaceElement): WorkspaceElement {
    if (element.children.length > 0 && this.uiState.isExpanded(element.path)) {
      return element.children[0];
    }

    let parent = this.workspace.getParent(element.path);
    while (parent != null) {
      let elementIndex = parent.children.indexOf(element);
      if (elementIndex + 1 < parent.children.length) { // implicitly assuming elementIndex > -1
        return parent.children[elementIndex + 1];
      }
      // last element on this level: get parent's next sibling instead
      element = parent;
      parent = this.workspace.getParent(parent.path);
    }

    // element is last one overall / has no successor
    return null;
  }

  private previous(element: WorkspaceElement): WorkspaceElement {
    let parent = this.workspace.getParent(element.path);
    if (parent != null) {
      let elementIndex = parent.children.indexOf(element);
      if (elementIndex === 0) {
        return parent;
      } else {
        let predecessor = parent.children[elementIndex - 1];
        while (predecessor.type === ElementType.Folder && this.uiState.isExpanded(predecessor.path)) {
          predecessor = predecessor.children[predecessor.children.length - 1];
        }
        return predecessor;
      }
    }
    return null;
  }

}
