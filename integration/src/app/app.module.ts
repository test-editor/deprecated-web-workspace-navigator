import { NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';
import { BrowserModule } from '@angular/platform-browser';
import { MessagingModule } from '@testeditor/messaging-service';
import { PersistenceService, WorkspaceNavigatorModule } from '@testeditor/workspace-navigator';

import { AppComponent }  from './app.component';
import { PersistenceServiceMock } from './persistence.service.mock';

@NgModule({
  imports: [
    BrowserModule,
    HttpModule,
    MessagingModule.forRoot(),
    WorkspaceNavigatorModule.forRoot({
      serviceUrl: "http://localhost:9080",
      authorizationHeader: "admin:admin@example.com"
    })
  ],
  declarations: [ AppComponent ],
  bootstrap: [ AppComponent ],
  providers: [
    { provide: PersistenceService, useClass: PersistenceServiceMock }
  ]
})
export class AppModule { }
