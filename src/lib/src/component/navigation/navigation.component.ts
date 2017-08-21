import { Component, OnInit, ChangeDetectorRef } from '@angular/core';

import { WorkspaceElement } from '../../service/persistence/workspace-element';
import { PersistenceService } from '../../service/persistence/persistence.service';
import { MessagingService } from '@testeditor/messaging-service';
import { UiState } from '../ui-state';
import * as events from '../event-types';

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.css']
})

export class NavigationComponent implements OnInit {

  workspaceRoot: WorkspaceElement;
  uiState: UiState;

  constructor(
    private messagingService: MessagingService,
    private changeDetectorRef: ChangeDetectorRef,
    private persistenceService: PersistenceService
  ) {
    this.uiState = new UiState();
  }

  ngOnInit(): void {
    this.retrieveWorkspaceRoot();
    this.subscribeToEvents();
  }

  retrieveWorkspaceRoot(): void {
    this.persistenceService.listFiles().then(element => {
      this.workspaceRoot = element;
    });
  }

  subscribeToEvents(): void {
    this.messagingService.subscribe(events.EDITOR_ACTIVE, element => {
      this.uiState.activeEditorPath = element.path;
      this.uiState.selectedPath = null;
      this.changeDetectorRef.detectChanges();
    });
    this.messagingService.subscribe(events.EDITOR_CLOSE, element => {
      if (element.path == this.uiState.activeEditorPath) {
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
    this.messagingService.subscribe(events.NAVIGATION_SELECT, element => {
      this.uiState.selectedPath = element.path;
      this.changeDetectorRef.detectChanges();
    });
  }

}
