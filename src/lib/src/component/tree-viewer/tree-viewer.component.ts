import { Component, Input, ChangeDetectorRef } from '@angular/core';
import { MessagingService } from '@testeditor/messaging-service';
import { WorkspaceElement } from '../../service/persistence/workspace-element';
import { PersistenceService } from '../../service/persistence/persistence.service';
import * as events from './event-types';

@Component({
  selector: 'nav-tree-viewer',
  templateUrl: './tree-viewer.component.html',
  styleUrls: ['./tree-viewer.component.css']
})
export class TreeViewerComponent {

  // workspace element types
  static readonly FOLDER = "folder";
  static readonly FILE = "file";

  @Input() model: WorkspaceElement;
  @Input() level: number = 0;
  active: boolean = false;
  dirty: boolean = false;
  selected: boolean = false;

  constructor(
    private messagingService: MessagingService,
    private persistenceService: PersistenceService,
    private changeDetectorRef: ChangeDetectorRef
  ) {
    this.subscribeToEvents(messagingService);
  }

  private subscribeToEvents(messagingService: MessagingService): void {
    messagingService.subscribe(events.EDITOR_ACTIVE, element => {
      let shouldBeActive = element.path === this.model.path;
      // don't want to trigger update for all unrelated elements
      if (this.active !== shouldBeActive) {
        this.active = shouldBeActive;
        this.changeDetectorRef.detectChanges();
      }
    });
    messagingService.subscribe(events.EDITOR_CLOSE, element => {
      let isOwnElement = element.path === this.model.path;
      if (isOwnElement) {
        this.active = false;
        this.dirty = false;
        this.changeDetectorRef.detectChanges();
      }
    });
    messagingService.subscribe(events.EDITOR_DIRTY_CHANGED, element => {
      let isOwnElement = element.path === this.model.path;
      if (isOwnElement) {
        this.dirty = element.dirty;
        this.changeDetectorRef.detectChanges();
      }
    });
    messagingService.subscribe(events.NAVIGATION_SELECT, element => {
      let isOwnElement = element.path === this.model.path;
      if (!isOwnElement && this.selected) {
        this.selected = false;
        this.changeDetectorRef.detectChanges();
      }
    });
  }

  onClick() {
    if (this.model.type === TreeViewerComponent.FOLDER) {
      this.model.expanded = !this.model.expanded;
    }
    this.selected = true;
    this.messagingService.publish(events.NAVIGATION_SELECT, { path: this.model.path });
  }

  onDoubleClick() {
    if (this.isFile()) {
      let document = this.persistenceService.getDocument(this.model);
      this.messagingService.publish(events.NAVIGATION_OPEN, document);
    }
  }

  isFolderExpanded(): boolean {
    return this.model.expanded && this.model.children.length > 0 && this.model.type === TreeViewerComponent.FOLDER;
  }

  isFolderFolded(): boolean {
    return !this.model.expanded && this.model.children.length > 0 && this.model.type === TreeViewerComponent.FOLDER;
  }

  isEmptyFolder(): boolean {
    return this.model.children.length == 0 && this.model.type === TreeViewerComponent.FOLDER;
  }

  isFile(): boolean {
    return this.model.children.length == 0 && this.model.type === TreeViewerComponent.FILE;
  }

  isUnknown(): boolean {
    return this.model.type !== TreeViewerComponent.FILE && this.model.type !== TreeViewerComponent.FOLDER;
  }

}
