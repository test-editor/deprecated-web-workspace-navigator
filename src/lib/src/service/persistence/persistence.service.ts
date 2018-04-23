import { Injectable, Injector } from '@angular/core';
import { HttpClient, HttpClientModule }  from '@angular/common/http';
import { WorkspaceElement } from '../../common/workspace-element';
import { PersistenceServiceConfig } from './persistence.service.config';
import { Conflict } from './conflict';


import 'rxjs/add/operator/toPromise';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/of';

export const HTTP_STATUS_NO_CONTENT = 204;
export const HTTP_STATUS_CONFLICT = 409;
export const HTTP_HEADER_CONTENT_LOCATION = 'content-location';
@Injectable()
export class PersistenceService {

  private serviceUrl: string;
  private listFilesUrl: string;

  private httpClient: HttpClient;

  constructor(config: PersistenceServiceConfig, private injector: Injector) {
    this.serviceUrl = config.persistenceServiceUrl;
    this.listFilesUrl = `${config.persistenceServiceUrl}/workspace/list-files`;
  }

  private getHttpClient(): HttpClient {
    if (!this.httpClient) {
      this.httpClient = this.injector.get(HttpClient);
    }
    return this.httpClient;
  }

  listFiles(): Promise<WorkspaceElement> {
    return this.getHttpClient().get<WorkspaceElement>(this.listFilesUrl).toPromise();
  }

  createResource(path: string, type: string): Observable<string | Conflict> {
    return this.getHttpClient().post(this.getURL(path), '', {
      observe: 'response',
      responseType: 'text',
      params: { type: type }
    }).map(response => response.body)
    .catch(response => {
      if (response.status === HTTP_STATUS_CONFLICT) {
        return Observable.of(new Conflict(response.error));
      } else {
        Observable.throw(new Error(response.error));
      }
    });
  }

  deleteResource(path: string): Observable<string | Conflict> {
    return this.getHttpClient().delete(this.getURL(path),  {
      observe: 'response',
      responseType: 'text',
      }).map(response => response.body)
      .catch(response => {
      if (response.status === HTTP_STATUS_CONFLICT) {
        return Observable.of(new Conflict(response.error));
      } else {
        Observable.throw(new Error(response.error));
      }
    });
  }

  getBinaryResource(path: string): Promise<Blob> {
    return this.getHttpClient().get(this.getURL(path), { responseType: 'blob' }).toPromise();
  }

  private getURL(path: string): string {
    let encodedPath = path.split('/').map(encodeURIComponent).join('/');
    return `${this.serviceUrl}/documents/${encodedPath}`;
  }

}
