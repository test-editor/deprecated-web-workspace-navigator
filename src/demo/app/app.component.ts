import { Component } from '@angular/core';
import { MessagingService } from '@testeditor/messaging-service';
import { LibService } from '@testeditor/workspace-navigator';

@Component({
  selector: 'demo-app',
  templateUrl: './app.component.html'
})
export class AppComponent {

  lastModelName: string;

  constructor(messagingService: MessagingService) {
    messagingService.subscribe('navigation.open', (model) => {
      console.log(`Received 'navigation.open' on '${model.name}'.`);
      this.lastModelName = model.name;
    });
  }
}
