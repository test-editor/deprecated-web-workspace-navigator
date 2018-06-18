import { Component, ChangeDetectorRef } from '@angular/core';
import { MessagingService } from '@testeditor/messaging-service';

import * as events from '@testeditor/workspace-navigator';
import { EDITOR_DIRTY_CHANGED, EDITOR_ACTIVE, EDITOR_CLOSE } from '../../lib/src/component/event-types';
import { validationLabel } from './indicator.field.setup';
import { WorkspaceElement, PersistenceService } from '@testeditor/workspace-navigator';

@Component({
  selector: 'demo-app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  lastSelected: any;
  lastOpened: any;
  paths: string[] = [];
  private readonly validationStatus: Map<string, { validation: { errors: number, warnings: number, infos: number } }> = new Map();

  constructor(private messagingService: MessagingService, private changeDetectorRef: ChangeDetectorRef, private persistenceService: PersistenceService) {
    this.subscribeToEvents();
  }

  private subscribeToEvents(): void {
    this.messagingService.subscribe(events.NAVIGATION_SELECT, element => {
      this.lastSelected = element;
    });
    this.messagingService.subscribe(events.NAVIGATION_OPEN, element => {
      this.lastOpened = element;
      if (element.path && this.paths.indexOf(element.path) < 0) {
        this.paths.push(element.path);
        this.changeDetectorRef.detectChanges();
      }
    });
    this.messagingService.subscribe(events.NAVIGATION_DELETED, element => {
      this.close(element.path);
    });
    this.messagingService.subscribe(events.WORKSPACE_RELOAD_REQUEST, () => {
      this.persistenceService.listFiles(((root: WorkspaceElement) => {
        this.messagingService.publish(events.WORKSPACE_RELOAD_RESPONSE, root);
      }));
    });
  }

  setDirty(path: string, dirty: boolean): void {
    this.messagingService.publish(events.EDITOR_DIRTY_CHANGED, {
      path: path,
      dirty: dirty
    });
  }

  setActive(path: string): void {
    this.messagingService.publish(events.EDITOR_ACTIVE, { path: path });
  }

  close(path: string): void {
    let index = this.paths.indexOf(path);
    if (index >= 0) {
      this.messagingService.publish(events.EDITOR_CLOSE, { path: path });
      this.paths.splice(index, 1);
    }
  }

  changeValidationStatus(path: string, type: string, increment: number): void {
    if (!this.validationStatus.has(path)) {
      this.validationStatus.set(path, {validation: { errors: 0, warnings: 0, infos: 0} });
    }
    const elementStatus = this.validationStatus.get(path);
    elementStatus.validation[type] += elementStatus.validation[type] + increment < 0 ? 0 : increment;
    this.messagingService.publish(events.WORKSPACE_MARKER_UPDATE, [{path: path, markers: elementStatus}]);
  }
}
