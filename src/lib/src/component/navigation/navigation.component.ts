import { ChangeDetectorRef, Component, HostListener, OnInit } from '@angular/core';

import { PersistenceService } from '../../service/persistence/persistence.service';
import { MessagingService } from '@testeditor/messaging-service';
import { ElementType } from '../../common/element-type';
import { WorkspaceElement } from '../../common/workspace-element';
import { Workspace } from '../../common/workspace';
import { NavigationKeyHandler } from './navigation-key-handler';
import { UiState } from '../ui-state';
import * as events from '../event-types';

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.css']
})
export class NavigationComponent implements OnInit {

  workspace: Workspace;
  uiState: UiState;
  keyHandler: NavigationKeyHandler;
  errorMessage: string;

  constructor(
    private messagingService: MessagingService,
    private changeDetectorRef: ChangeDetectorRef,
    private persistenceService: PersistenceService
  ) {
    this.uiState = new UiState();
    this.keyHandler = new NavigationKeyHandler(this.uiState, undefined);
  }

  ngOnInit(): void {
    this.retrieveWorkspaceRoot();
    this.subscribeToEvents();
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvents(event: KeyboardEvent): void {
    this.keyHandler.handleKeyboardEvent(event);
  }

  retrieveWorkspaceRoot(): Promise<Workspace | undefined> {
    return this.persistenceService.listFiles().then(element => {
      this.workspace = new Workspace(element);
      this.keyHandler.workspace = this.workspace;
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
    this.retrieveWorkspaceRoot().then(() => {
      this.revealElement(payload.path);
      this.selectElement(payload.path);
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

  collapseAll(): void {
    this.uiState.clearExpanded();
    this.uiState.setExpanded(this.workspace.root.path, true);
  }

  revealElement(path: string): void {
    let subpaths = this.workspace.getSubpaths(path);
    subpaths.forEach(subpath => this.uiState.setExpanded(subpath, true));
  }

  selectElement(path: string): void {
    let element = this.workspace.getElement(path);
    this.uiState.selectedElement = element;
  }

}
