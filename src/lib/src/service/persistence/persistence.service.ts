import { Injectable } from '@angular/core';
import { Http, Headers, Response, RequestOptionsArgs, ResponseContentType } from '@angular/http';
import { AuthHttp } from 'angular2-jwt';

import { WorkspaceElement } from '../../common/workspace-element';
import { PersistenceServiceConfig } from './persistence.service.config';

import 'rxjs/add/operator/toPromise';

@Injectable()
export class PersistenceService {

  private serviceUrl: string;
  private listFilesUrl: string;

  constructor(private http: AuthHttp, config: PersistenceServiceConfig) {
    this.serviceUrl = config.persistenceServiceUrl;
    this.listFilesUrl = `${config.persistenceServiceUrl}/workspace/list-files`;
  }

  listFiles(): Promise<WorkspaceElement> {
    return this.http.get(this.listFilesUrl).toPromise()
      .then(response => response.json());
  }

  // TODO - should be renamed createResource
  createDocument(path: string, type: string): Promise<Response> {
    let requestOptions = {
      params: { type: type }
    };
    return this.http.post(this.getURL(path), '', requestOptions).toPromise();
  }

  deleteResource(path: string): Promise<Response> {
    return this.http.delete(this.getURL(path)).toPromise();
  }

  getBinaryResource(path: string): Promise<Response> {
    return this.http.get(this.getURL(path), { responseType: ResponseContentType.Blob}).toPromise();
  }

  getURL(path: string): string {
    let encodedPath = path.split('/').map(encodeURIComponent).join('/');
    return `${this.serviceUrl}/documents/${encodedPath}`;
  }

}
