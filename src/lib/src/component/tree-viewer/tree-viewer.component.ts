import { Component, Input, ChangeDetectorRef } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { MessagingService } from '@testeditor/messaging-service';
import { WorkspaceElement } from '../../service/persistence/workspace-element';
import { PersistenceService } from '../../service/persistence/persistence.service';
import { UiState } from '../ui-state';
import * as events from '../event-types';

@Component({
  selector: 'nav-tree-viewer',
  templateUrl: './tree-viewer.component.html',
  styleUrls: ['./tree-viewer.component.css']
})
export class TreeViewerComponent {

  // workspace element types
  static readonly FOLDER = "folder";
  static readonly FILE = "file";

  @Input() uiState: UiState;
  @Input() model: WorkspaceElement;
  @Input() level: number = 0;
  expanded: boolean = false;

  private subscriptions: Subscription[] = [];

  constructor(
    private messagingService: MessagingService,
    private changeDetectorRef: ChangeDetectorRef
  ) { }

  onClick() {
    this.messagingService.publish(events.NAVIGATION_SELECT, { path: this.model.path });
  }

  onDoubleClick() {
    if (this.isFolder()) {
      this.expanded = !this.expanded;
    }
    if (this.isFile()) {
      this.messagingService.publish(events.NAVIGATION_OPEN, { path: this.model.path });
    }
  }

  isFile(): boolean {
    return this.model.type === TreeViewerComponent.FILE;
  }

  isFolder(): boolean {
    return this.model.type === TreeViewerComponent.FOLDER;
  }

  isFolderExpanded(): boolean {
    return this.expanded && this.model.children.length > 0 && this.model.type === TreeViewerComponent.FOLDER;
  }

  isFolderFolded(): boolean {
    return !this.expanded && this.model.children.length > 0 && this.model.type === TreeViewerComponent.FOLDER;
  }

  isEmptyFolder(): boolean {
    return this.model.children.length == 0 && this.model.type === TreeViewerComponent.FOLDER;
  }



  isUnknown(): boolean {
    return this.model.type !== TreeViewerComponent.FILE && this.model.type !== TreeViewerComponent.FOLDER;
  }

}
