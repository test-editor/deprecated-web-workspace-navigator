import { Component, ViewChild, Input, ElementRef, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { UiState } from '../ui-state';
import { ElementType } from '../../common/element-type';
import { WorkspaceElement } from '../../common/workspace-element';
import { Workspace } from '../../common/workspace';
import { PersistenceService } from '../../service/persistence/persistence.service';
import { MessagingService } from '@testeditor/messaging-service';
import * as events from '../event-types';

@Component({
  selector: 'nav-new-element',
  templateUrl: './new-element.component.html',
  styleUrls: ['./new-element.component.css']
})
export class NewElementComponent implements AfterViewInit {

  @ViewChild('theInput') input: ElementRef;
  @Input() uiState: UiState;

  errorMessage: string;

  constructor(
    private messagingService: MessagingService,
    private persistenceService: PersistenceService
  ) {  }

  ngAfterViewInit(): void {
    this.input.nativeElement.focus();
  }

  getType(): string {
    return this.uiState.newElementRequest.type;
  }

  onEnter(): void {
    let newName = this.input.nativeElement.value;
    let selectedElement = this.uiState.newElementRequest.selectedElement;
    let parent = Workspace.getDirectory(selectedElement);
    let newPath = parent ? `${parent}/${newName}` : newName;
    this.sendCreateRequest(newPath, this.getType());
  }

  private sendCreateRequest(newPath: string, type: string): void {
    this.persistenceService.createDocument(newPath, type).then(response => {
      this.remove();
      this.messagingService.publish(events.NAVIGATION_CREATED, {
        path: response.text()
      });
    }).catch(() => {
      this.errorMessage = 'Error while creating element!';
    });
  }

  remove(): void {
    this.uiState.newElementRequest = null;
  }

  getPaddingLeft(): string {
    if (this.uiState.newElementRequest) {
      let selectedElement = this.uiState.newElementRequest.selectedElement;
      let isFileSelected = selectedElement && selectedElement.type === ElementType.File;
      return isFileSelected ? '0px' : '12px';
    }
    return '0px';
  }

}
