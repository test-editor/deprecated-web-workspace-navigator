import { NgModule } from '@angular/core';
import { HttpModule, Http, RequestOptions } from '@angular/http';
import { BrowserModule } from '@angular/platform-browser';
import { MessagingModule } from '@testeditor/messaging-service';
import { PersistenceService, TestExecutionService, WorkspaceNavigatorModule } from '@testeditor/workspace-navigator';
import { AuthHttp, AuthConfig } from 'angular2-jwt';

import { AppComponent }  from './app.component';
import { PersistenceServiceMock } from './persistence.service.mock';
import { TestExecutionServiceMock } from './test.execution.service.mock';
import { testEditorIndicatorFieldSetup } from './indicator.field.setup';

export function authHttpServiceFactory(http: Http, options: RequestOptions) {
  return new AuthHttp(new AuthConfig(), http, options);
}

@NgModule({
  imports: [
    BrowserModule,
    HttpModule,
    MessagingModule.forRoot(),
    WorkspaceNavigatorModule.forRoot({
      persistenceServiceUrl: 'http://localhost:9080',
    }, {
      testExecutionServiceUrl: 'http://localhost:9080/tests'
    }, testEditorIndicatorFieldSetup)
  ],
  declarations: [ AppComponent ],
  bootstrap: [ AppComponent ],
  providers: [
    { provide: PersistenceService, useClass: PersistenceServiceMock },
    { provide: TestExecutionService, useClass: TestExecutionServiceMock },
    { provide: AuthHttp, useFactory: authHttpServiceFactory, deps: [Http, RequestOptions] }
  ]
})
export class AppModule { }
