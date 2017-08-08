import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';

import { WorkspaceElement } from './workspace-element';
import { WorkspaceDocument } from './workspace-document';
import { PersistenceServiceConfig } from './persistence.service.config';

import 'rxjs/add/operator/toPromise';

@Injectable()
export class PersistenceService {

  private serviceUrl: string;
  private listFilesUrl: string;
  private headers: Headers;

  constructor(private http: Http, config: PersistenceServiceConfig) {
    this.serviceUrl = config.serviceUrl;
    this.listFilesUrl = `${config.serviceUrl}/workspace/list-files`;
    this.headers = new Headers();
    this.headers.append('Authorization', config.authorizationHeader);
  }

  listFiles(): Promise<WorkspaceElement> {
    return this.http.get(this.listFilesUrl, { headers: this.headers }).toPromise()
      .then(response => response.json())
      .catch(this.handleError);
  }

  getDocument(element: WorkspaceElement): WorkspaceDocument {
    let url = `${this.serviceUrl}/documents/${element.path}`;
    let contentPromise = this.http.get(url, { headers: this.headers }).toPromise()
      .then(response => response.text())
      .catch(this.handleError);
    return {
      name: element.name,
      path: element.path,
      content: contentPromise
    }
  }

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error); // for demo purposes only
    return Promise.reject(error.message || error);
  }

}
