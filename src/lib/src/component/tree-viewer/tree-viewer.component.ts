import { Component, Input, OnInit } from '@angular/core';
import { WorkspaceElement } from '../../service/workspace/workspace-element';

@Component({
  selector: 'nav-tree-viewer',
  templateUrl: './tree-viewer.component.html',
  styleUrls: ['./tree-viewer.component.css']
})
export class TreeViewerComponent implements OnInit {

  // workspace element types
  static readonly FOLDER = "folder";
  static readonly FILE = "file";

  static readonly EVENT_SOURCE = "tree-viewer";
  static readonly CLICK_NAV_EVENT_TYPE = "selectTreeElement";

  @Input() model: WorkspaceElement;

  ngOnInit() {
  }

  onClick() {
    if (this.model.type === TreeViewerComponent.FOLDER) {
      this.model.expanded = !this.model.expanded;
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
    return this.model.type !== "file" && this.model.type !== TreeViewerComponent.FOLDER;
  }

}
