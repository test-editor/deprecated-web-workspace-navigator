import { Component, Input } from '@angular/core';
import { MessagingService } from '@testeditor/messaging-service';
import { WorkspaceElement } from '../../service/persistence/workspace-element';
import { PersistenceService } from '../../service/persistence/persistence.service';

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

  constructor(private messagingService: MessagingService, private persistenceService: PersistenceService) {
  }

  onClick() {
    if (this.model.type === TreeViewerComponent.FOLDER) {
      this.model.expanded = !this.model.expanded;
    }
  }

  onDoubleClick() {
    if (this.isFile()) {
      let document = this.persistenceService.getDocument(this.model);
      this.messagingService.publish('navigation.open', document);
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
