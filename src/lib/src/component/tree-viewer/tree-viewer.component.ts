import { Component, Input, ChangeDetectorRef } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { MessagingService } from '@testeditor/messaging-service';
import { WorkspaceElement } from '../../common/workspace-element';
import { ElementType } from '../../common/element-type';
import { PersistenceService } from '../../service/persistence/persistence.service';
import * as events from '../event-types';
import { UiState } from '../ui-state';

@Component({
  selector: 'nav-tree-viewer',
  templateUrl: './tree-viewer.component.html',
  styleUrls: ['./tree-viewer.component.css']
})
export class TreeViewerComponent {

  @Input() uiState: UiState;
  @Input() model: WorkspaceElement;
  @Input() level: number = 0;

  private subscriptions: Subscription[] = [];

  constructor(
    private messagingService: MessagingService,
    private changeDetectorRef: ChangeDetectorRef
  ) { }

  onClick() {
    this.messagingService.publish(events.NAVIGATION_SELECT, this.model);
  }

  onDoubleClick() {
    if (this.isFolder()) {
      this.uiState.toggleExpanded(this.model.path);
    }
    if (this.isFile()) {
      this.messagingService.publish(events.NAVIGATION_OPEN, { path: this.model.path });
    }
  }

  isExpanded(): boolean {
    return this.uiState.isExpanded(this.model.path);
  }

  isFile(): boolean {
    return this.model.type === ElementType.File;
  }

  isFolder(): boolean {
    return this.model.type === ElementType.Folder;
  }

  isFolderExpanded(): boolean {
    return this.isExpanded() && this.model.children.length > 0 && this.isFolder();
  }

  isFolderFolded(): boolean {
    return !this.isExpanded() && this.model.children.length > 0 && this.isFolder();
  }

  isEmptyFolder(): boolean {
    return this.model.children.length == 0 && this.isFolder();
  }

  isUnknown(): boolean {
    return !(this.isFile() || this.isFolder());
  }

}
