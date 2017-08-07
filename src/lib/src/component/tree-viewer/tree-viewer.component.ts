import { Component, Input } from '@angular/core';
import { MessagingService } from '@testeditor/messaging-service';
import { WorkspaceElement } from '../../service/persistence/workspace-element';

@Component({
  selector: 'nav-tree-viewer',
  templateUrl: './tree-viewer.component.html',
  styleUrls: ['./tree-viewer.component.css']
})
export class TreeViewerComponent {

  // workspace element types
  static readonly FOLDER = "folder";
  static readonly FILE = "file";

  static readonly EVENT_SOURCE = "tree-viewer";
  static readonly CLICK_NAV_EVENT_TYPE = "selectTreeElement";

  @Input() model: WorkspaceElement;

  constructor(private messagingService: MessagingService) {
  }

  onClick() {
    if (this.model.type === TreeViewerComponent.FOLDER) {
      this.model.expanded = !this.model.expanded;
    }
  }

  onDoubleClick() {
    this.messagingService.publish('navigation.open', this.model);
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
