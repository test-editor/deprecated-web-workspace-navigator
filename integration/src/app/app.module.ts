import { NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';
import { BrowserModule } from '@angular/platform-browser';
import { MessagingModule } from '@testeditor/messaging-service';
import { LibModule } from '@testeditor/workspace-navigator';

import { AppComponent }  from './app.component';

@NgModule({
  imports: [
    BrowserModule,
    HttpModule,
    MessagingModule.forRoot(),
    LibModule.forRoot({
      serviceUrl: "http://localhost:9080/workspace",
      authorizationHeader: "admin:admin@example.com"
    })
  ],
  declarations: [ AppComponent ],
  bootstrap: [ AppComponent ]
})
export class AppModule { }
