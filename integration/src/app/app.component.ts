import { Component } from '@angular/core';
import { MessagingService } from '@testeditor/messaging-service';

import * as events from '@testeditor/workspace-navigator';
import { WorkspaceElement, PersistenceService } from '@testeditor/workspace-navigator';

@Component({
  selector: 'integration-app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  lastSelected: any;
  lastOpened: any;

  constructor(messagingService: MessagingService, private persistenceService: PersistenceService) {
    messagingService.subscribe(events.NAVIGATION_SELECT, element => {
      this.lastSelected = element;
    });
    messagingService.subscribe(events.NAVIGATION_OPEN, element => {
      this.lastOpened = element;
    });
    messagingService.subscribe(events.WORKSPACE_RELOAD_REQUEST, () => {
      this.persistenceService.listFiles((root: WorkspaceElement) => {
        messagingService.publish(events.WORKSPACE_RELOAD_RESPONSE, root);
      });
    });
  }

}
