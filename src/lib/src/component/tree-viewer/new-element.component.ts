import { Component, ViewChild, Input, ElementRef, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { UiState } from '../ui-state';
import { ElementType } from '../../common/element-type';
import { WorkspaceElement } from '../../common/workspace-element';
import { getDirectory } from '../../common/util/workspace-element-helper';
import { PersistenceService } from '../../service/persistence/persistence.service';
import { MessagingService } from '@testeditor/messaging-service';
import * as events from '../event-types';

@Component({
  selector: 'nav-new-element',
  templateUrl: './new-element.component.html',
  styleUrls: ['./new-element.component.css']
})
export class NewElementComponent implements AfterViewInit {

  @ViewChild("theInput") input: ElementRef;
  @Input() uiState: UiState;

  constructor(
    private messagingService: MessagingService,
    private persistenceService: PersistenceService
  ) {  }

  ngAfterViewInit(): void {
    this.input.nativeElement.focus();
  }

  onEnter(): void {
    let newName = this.input.nativeElement.value;
    let parent = getDirectory(this.uiState.newElementRequest.selectedElement);
    let newPath = parent + newName;
    this.persistenceService.createDocument(newPath).then(() => {
      this.remove();
      this.messagingService.publish(events.NAVIGATION_REFRESH, {});
    });
  }

  remove(): void {
    this.uiState.newElementRequest = null;
  }

  getPaddingLeft(): string {
    if (this.uiState.newElementRequest) {
      let selectedElement = this.uiState.newElementRequest.selectedElement;
      let isFileSelected = selectedElement && selectedElement.type == ElementType.File;
      return isFileSelected ? "0px" : "12px";
    }
    return "0px";
  }

}
