import { Injectable } from '@angular/core';
import { Http, Headers, Response, RequestOptionsArgs } from '@angular/http';
import { AuthHttp } from 'angular2-jwt';

import { WorkspaceElement } from '../../common/workspace-element';
import { PersistenceServiceConfig } from './persistence.service.config';

import 'rxjs/add/operator/toPromise';

@Injectable()
export class PersistenceService {

  private serviceUrl: string;
  private listFilesUrl: string;

  constructor(private http: AuthHttp, config: PersistenceServiceConfig) {
    this.serviceUrl = config.serviceUrl;
    this.listFilesUrl = `${config.serviceUrl}/workspace/list-files`;
  }

  listFiles(): Promise<WorkspaceElement> {
    return this.http.get(this.listFilesUrl).toPromise()
      .then(response => response.json());
  }

  // TODO - should be renamed createResource
  createDocument(path: string, type: string): Promise<Response> {
    let url = `${this.serviceUrl}/documents/${path}`;
    let requestOptions = {
      params: { type: type }
    };
    return this.http.post(url, "", requestOptions).toPromise();
  }

  deleteResource(path: string): Promise<Response> {
    let url = `${this.serviceUrl}/documents/${path}`;
    return this.http.delete(url).toPromise();
  }

}
