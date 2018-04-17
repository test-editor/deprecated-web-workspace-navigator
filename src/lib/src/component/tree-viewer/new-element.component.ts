import { Component, ViewChild, Input, ElementRef, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { UiState } from '../ui-state';
import { ElementType } from '../../common/element-type';
import { getDirectory } from '../../common/util/workspace-element-helper';
import { PathValidator } from './path-validator';
import { PersistenceService } from '../../service/persistence/persistence.service';
import { MessagingService } from '@testeditor/messaging-service';
import * as events from '../event-types';
import { Workspace } from '../../common/workspace';
import { isConflict } from '../../service/persistence/conflict';

@Component({
  selector: 'nav-new-element',
  templateUrl: './new-element.component.html',
  styleUrls: ['./new-element.component.css']
})
export class NewElementComponent implements AfterViewInit {

  @ViewChild('theInput') input: ElementRef;
  @Input() workspace: Workspace;

  errorMessage: string;

  constructor(
    private messagingService: MessagingService,
    private pathValidator: PathValidator,
    private persistenceService: PersistenceService
  ) {  }

  ngAfterViewInit(): void {
    this.input.nativeElement.focus();
  }

  getType(): string {
    return this.workspace.getNewElementType();
  }

  onKeyup(event: any): void {
    this.validate();
  }

  validate(): boolean {
    let newName: string = this.input.nativeElement.value;
    let isValid = this.pathValidator.isValid(newName);
    this.errorMessage = isValid ? null : this.pathValidator.getMessage(newName);
    return isValid;
  }

  onEnter(): void {
    if (this.validate()) {
      let newName = this.input.nativeElement.value;
      let parent = getDirectory(this.workspace.getNewElement());
      let newPath = parent + newName;
      this.sendCreateRequest(newPath, this.getType());
    }
  }

  private sendCreateRequest(newPath: string, type: string): void {
    this.persistenceService.createResource(newPath, type).subscribe(result => {
      this.remove();
      if (isConflict(result)) {
        this.messagingService.publish(events.CONFLICT, result);
      } else {
        this.messagingService.publish(events.NAVIGATION_CREATED, {
            path: <string>result
        });
      }
    }, () => this.errorMessage = 'Error while creating element!');
  }

  remove(): void {
    this.workspace.removeNewElementRequest();
  }

  getPaddingLeft(): string {
    if (this.workspace.hasNewElementRequest()) {
      let selectedElement = this.workspace.getNewElement();
      let isFileSelected = selectedElement && selectedElement.type === ElementType.File;
      return isFileSelected ? '0px' : '12px';
    }
    return '0px';
  }

}
