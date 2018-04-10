import { NgModule } from '@angular/core';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { MessagingModule } from '@testeditor/messaging-service';
import { PersistenceService, TestExecutionService, WorkspaceNavigatorModule } from '@testeditor/workspace-navigator';

import { AppComponent }  from './app.component';
import { PersistenceServiceMock } from './persistence.service.mock';
import { TestExecutionServiceMock } from './test.execution.service.mock';
import { testEditorIndicatorFieldSetup } from './indicator.field.setup';


@NgModule({
  imports: [
    BrowserModule,
    HttpClientModule,
    MessagingModule.forRoot(),
    WorkspaceNavigatorModule.forRoot({
      persistenceServiceUrl: 'http://localhost:9080',
    }, {
      serviceUrl: 'http://localhost:9080/tests'
    }, testEditorIndicatorFieldSetup)
  ],
  declarations: [ AppComponent ],
  bootstrap: [ AppComponent ],
  providers: [
    HttpClient,
    { provide: PersistenceService, useClass: PersistenceServiceMock },
    { provide: TestExecutionService, useClass: TestExecutionServiceMock },
  ]
})
export class AppModule { }
