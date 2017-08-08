import { Component } from '@angular/core';
import { MessagingService } from '@testeditor/messaging-service';
import { WorkspaceDocument } from '@testeditor/workspace-navigator';

@Component({
  selector: 'demo-app',
  templateUrl: './app.component.html'
})
export class AppComponent {

  lastDocument: WorkspaceDocument;

  constructor(messagingService: MessagingService) {
    messagingService.subscribe('navigation.open', (model: WorkspaceDocument) => {
      console.log(`Received 'navigation.open' on '${model.name}'.`);
      this.lastDocument = model;
    });
  }
}
