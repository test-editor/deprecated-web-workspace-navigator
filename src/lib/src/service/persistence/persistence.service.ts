import { Injectable } from '@angular/core';
import { Headers, Response, RequestOptionsArgs, ResponseContentType } from '@angular/http';
import { HttpClient }  from '@angular/common/http';
import { WorkspaceElement } from '../../common/workspace-element';
import { PersistenceServiceConfig } from './persistence.service.config';

import 'rxjs/add/operator/toPromise';

@Injectable()
export class PersistenceService {

  private serviceUrl: string;
  private listFilesUrl: string;

  constructor(private httpClient: HttpClient, config: PersistenceServiceConfig) {
    this.serviceUrl = config.persistenceServiceUrl;
    this.listFilesUrl = `${config.persistenceServiceUrl}/workspace/list-files`;
  }

  listFiles(): Promise<WorkspaceElement> {
    return this.httpClient.get<Response>(this.listFilesUrl).toPromise()
      .then(response => response.json());
  }

  // TODO - should be renamed createResource
  createDocument(path: string, type: string): Promise<Response> {
    let requestOptions = {
      params: { type: type }
    };
    return this.httpClient.post<Response>(this.getURL(path), '', requestOptions).toPromise();
  }

  deleteResource(path: string): Promise<Response> {
    return this.httpClient.delete<Response>(this.getURL(path)).toPromise();
  }

  getBinaryResource(path: string): Promise<Blob> {
    return this.httpClient.get(this.getURL(path), { responseType: 'blob' }).toPromise();
  }

  getURL(path: string): string {
    let encodedPath = path.split('/').map(encodeURIComponent).join('/');
    return `${this.serviceUrl}/documents/${encodedPath}`;
  }

}
