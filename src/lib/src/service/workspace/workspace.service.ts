import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { WorkspaceElement } from './workspace-element';
import { WorkspaceServiceConfig } from './workspace-service-config';

import 'rxjs/add/operator/toPromise';

@Injectable()
export class WorkspaceService {

  private listFilesUrl: string;
  private headers: Headers;

  constructor(private http: Http, config: WorkspaceServiceConfig) {
    this.listFilesUrl = `${config.serviceUrl}/list-files`;
    this.headers = new Headers();
    this.headers.append('Authorization', config.authorizationHeader);
  }

  listFiles(): Promise<WorkspaceElement> {
    return this.http.get(this.listFilesUrl, { headers: this.headers }).toPromise()
      .then(response => response.json())
      .catch(this.handleError);
  }

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error); // for demo purposes only
    return Promise.reject(error.message || error);
  }

}
