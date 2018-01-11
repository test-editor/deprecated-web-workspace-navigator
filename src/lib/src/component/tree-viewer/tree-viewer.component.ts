import { Component, Input, ChangeDetectorRef } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { MessagingService } from '@testeditor/messaging-service';
import { WorkspaceElement } from '../../common/workspace-element';
import { ElementType } from '../../common/element-type';
import { PersistenceService } from '../../service/persistence/persistence.service';
import * as events from '../event-types';
import { UiState } from '../ui-state';
import { WindowService } from '../../service/browserObjectModel/window.service';

@Component({
  selector: 'nav-tree-viewer',
  templateUrl: './tree-viewer.component.html',
  styleUrls: ['./tree-viewer.component.css']
})
export class TreeViewerComponent {

  private static readonly IMAGE_EXTENSIONS = ['.bmp', '.png', '.jpg', '.jpeg', '.gif', '.svg'];

  @Input() uiState: UiState;
  @Input() model: WorkspaceElement;
  @Input() level: number = 0;

  confirmDelete: boolean = false;
  errorMessage: string;

  private subscriptions: Subscription[] = [];

  constructor(
    private messagingService: MessagingService,
    private changeDetectorRef: ChangeDetectorRef,
    private persistenceService: PersistenceService,
    private windowReference: WindowService
  ) { }

  onClick() {
    this.messagingService.publish(events.NAVIGATION_SELECT, this.model);
  }

  onDoubleClick() {
    if (this.isFolder()) {
      this.uiState.toggleExpanded(this.model.path);
    }
    if (this.isFile()) {
      this.openFile();
    }
  }

  openFile() {
    if (this.isImage()) {
      this.windowReference.open(new URL(this.persistenceService.getURL(this.model.path)));
    } else {
      this.messagingService.publish(events.NAVIGATION_OPEN, {
        name: this.model.name,
        path: this.model.path
      });
    }
  }

  onIconClick() {
    if (this.isFolder()) {
      this.uiState.toggleExpanded(this.model.path);
    }
  }

  onDeleteIconClick(): void {
    this.confirmDelete = true;
  }

  onDeleteConfirm(): void {
    this.persistenceService.deleteResource(this.model.path).then(() => {
      this.messagingService.publish(events.NAVIGATION_DELETED, this.model);
    }).catch(() => {
      this.handleDeleteFailed();
    });
    this.confirmDelete = false;
  }

  handleDeleteFailed(): void {
    this.errorMessage = 'Error while deleting element!';
    setTimeout(() => {
      this.errorMessage = null;
    }, 3000);
  }

  onDeleteCancel(): void {
    this.errorMessage = null;
    this.confirmDelete = false;
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

  shouldShowNewElement(): boolean {
    if (this.uiState.newElementRequest) {
      let selectedElement = this.uiState.newElementRequest.selectedElement
      if (selectedElement) {
        return selectedElement.path == this.model.path;
      } else {
        return this.level == 0; // display at root
      }
    }
    return false;
  }

  isImage(): boolean {
    return TreeViewerComponent.IMAGE_EXTENSIONS.some((extension) => {
      return this.model.path.toLowerCase().endsWith(extension);
    }, this);
  }

}
