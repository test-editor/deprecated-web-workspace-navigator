import { NgModule } from '@angular/core';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { MessagingModule } from '@testeditor/messaging-service';

import { AppComponent }  from './app.component';
import { PersistenceServiceMock } from './persistence.service.mock';
import { testEditorIndicatorFieldSetup } from './indicator.field.setup';
import { WorkspaceNavigatorModule } from './modules/workspace.navigator.module';
import { PersistenceService } from './modules/service/persistence/persistence.service';


@NgModule({
  imports: [
    BrowserModule,
    HttpClientModule,
    MessagingModule.forRoot(),
    WorkspaceNavigatorModule.forRoot({
      persistenceServiceUrl: 'http://localhost:9080',
    }, testEditorIndicatorFieldSetup)
  ],
  declarations: [ AppComponent ],
  bootstrap: [ AppComponent ],
  providers: [
    HttpClient,
    { provide: PersistenceService, useClass: PersistenceServiceMock }
  ]
})
export class AppModule { }
