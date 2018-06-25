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
  selector: 'nav-rename-element',
  templateUrl: './rename-element.component.html',
  styleUrls: ['./rename-element.component.css']
})
export class RenameElementComponent implements AfterViewInit {

  @ViewChild('renameInput') input: ElementRef;
  @Input() workspace: Workspace;
  @Input() originalName: string;

  errorMessage: string;

  constructor(
    private messagingService: MessagingService,
    private pathValidator: PathValidator,
    private persistenceService: PersistenceService
  ) {  }

  ngAfterViewInit(): void {
    this.input.nativeElement.focus();
  }

  onKeyup(event: any): void {
    this.validate();
  }

  validate(): boolean {
    let isDirty = this.workspace.isDirty(this.workspace.getRenameElement().path);
    if (isDirty) {
      this.errorMessage = 'cannot rename dirty files';
      return !isDirty
    } else {
      let newName: string = this.input.nativeElement.value;
      let isValid = this.pathValidator.isValid(newName);
      this.errorMessage = isValid ? null : this.pathValidator.getMessage(newName);
      return isValid;
    }
  }

  onEnter(): void {
    if (this.validate()) {
      let newName = this.input.nativeElement.value;
      let oldElement = this.workspace.getRenameElement();
      const pathElements = oldElement.path.split('/')
      let newPath = pathElements.slice(0, pathElements.length - 1).join('/') + '/' + newName;
      this.sendRenameRequest(newPath, oldElement.path);
    }
  }

  private sendRenameRequest(newPath: string, oldPath: string): void {
    this.persistenceService.renameResource(newPath, oldPath, (result) => {
      let resultPath: string;
      if (isConflict(result)) {
        this.errorMessage = result.message;
        this.input.nativeElement.value = '';
        resultPath = oldPath;
      } else {
        this.remove();
        resultPath = result;
      }
      this.messagingService.publish(events.NAVIGATION_RENAMED, { newPath: resultPath, oldPath: oldPath });
    }, () => this.errorMessage = 'Error while renaming element!');
  }

  remove(): void {
    this.workspace.removeRenameElementRequest();
  }

}
