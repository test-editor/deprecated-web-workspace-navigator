import { Component, Input, ChangeDetectorRef } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { MessagingService } from '@testeditor/messaging-service';
import { ElementType } from '../../common/element-type';
import { PersistenceService } from '../../service/persistence/persistence.service';
import * as events from '../event-types';
import { UiState } from '../ui-state';
import { WindowService } from '../../service/browserObjectModel/window.service';
import { ElementState } from '../../common/element-state';
import { Workspace } from '../../common/workspace';
import { LinkedWorkspaceElement } from '../../common/workspace-element';
import { Field, IndicatorFieldSetup } from '../../common/markers/field';
import { MarkerState } from '../../common/markers/marker.state';

@Component({
  selector: 'nav-tree-viewer',
  templateUrl: './tree-viewer.component.html',
  styleUrls: ['./tree-viewer.component.css']
})
export class TreeViewerComponent {

  private static readonly IMAGE_EXTENSIONS = ['.bmp', '.png', '.jpg', '.jpeg', '.gif', '.svg'];

  @Input() workspace: Workspace;
  @Input() elementPath: string;
  @Input() level = 0;
  fields: Field[];

  confirmDelete = false;
  errorMessage: string;

  private subscriptions: Subscription[] = [];

  constructor(
    private messagingService: MessagingService,
    private changeDetectorRef: ChangeDetectorRef,
    private persistenceService: PersistenceService,
    private windowReference: WindowService,
    fieldSetup: IndicatorFieldSetup) {
      this.fields = fieldSetup.fields;
  }

  get indicatorBoxes(): { workspace: Workspace, path: string, states: MarkerState[] }[] {
    return this.fields.map((field) => { return {workspace: this.workspace, path: this.elementPath, states: field.states} });
  }

  get elementInfo(): LinkedWorkspaceElement {
    return this.workspace.getElementInfo(this.elementPath);
  }

  onClick() {
    this.messagingService.publish(events.NAVIGATION_SELECT, this.elementInfo);
  }

  private shouldFieldBeShown(field: Field): boolean {
    return field.condition(this.elementInfo);
  }

  onDoubleClick() {
    if (this.isFolder()) {
      this.workspace.toggleExpanded(this.elementPath);
    }
    if (this.isFile()) {
      this.openFile();
    }
  }

  openFile() {
    if (this.isImage()) {
      this.windowReference.open(() => {
        return this.persistenceService.getBinaryResource(this.elementPath).then((response) => {
          return new URL(URL.createObjectURL(response.blob()));
        });
      });
    } else {
      this.messagingService.publish(events.NAVIGATION_OPEN, {
        name: this.elementInfo.name,
        path: this.elementPath
      });
    }
  }

  onIconClick() {
    if (this.isFolder()) {
      this.workspace.toggleExpanded(this.elementPath);
    }
  }

  onDeleteIconClick(): void {
    this.confirmDelete = true;
  }

  onDeleteConfirm(): void {
    this.persistenceService.deleteResource(this.elementPath).then(() => {
      this.messagingService.publish(events.NAVIGATION_DELETED, this.elementInfo);
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
    return this.workspace.isExpanded(this.elementPath);
  }

  isFile(): boolean {
    return this.elementInfo.type === ElementType.File;
  }

  isFolder(): boolean {
    return this.elementInfo.type === ElementType.Folder;
  }

  isFolderExpanded(): boolean {
    return this.isExpanded() && this.elementInfo.childPaths.length > 0 && this.isFolder();
  }

  isFolderFolded(): boolean {
    return !this.isExpanded() && this.elementInfo.childPaths.length > 0 && this.isFolder();
  }

  isEmptyFolder(): boolean {
    return this.elementInfo.childPaths.length == 0 && this.isFolder();
  }

  isUnknown(): boolean {
    return !(this.isFile() || this.isFolder());
  }

  shouldShowNewElement(): boolean {
    if (this.workspace.hasNewElementRequest()) {
      let selectedElement = this.workspace.getNewElement();
      if (selectedElement) {
        return selectedElement.path == this.elementPath;
      } else {
        return this.level == 0; // display at root
      }
    }
    return false;
  }

  isImage(): boolean {
    return TreeViewerComponent.IMAGE_EXTENSIONS.some((extension) => {
      return this.elementPath.toLowerCase().endsWith(extension);
    }, this);
  }

  isRunning(): boolean { return this.workspace.getTestStatus(this.elementPath) === ElementState.Running}
  lastRunSuccessful(): boolean { return this.workspace.getTestStatus(this.elementPath) === ElementState.LastRunSuccessful; }
  lastRunFailed(): boolean { return this.workspace.getTestStatus(this.elementPath) === ElementState.LastRunFailed; }
}
