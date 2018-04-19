import { Injectable, ReflectiveInjector, Type, Injector } from '@angular/core';
import { HttpClient, HttpClientModule }  from '@angular/common/http';
import { WorkspaceElement } from '../../common/workspace-element';
import { PersistenceServiceConfig } from './persistence.service.config';

import 'rxjs/add/operator/toPromise';

declare let Reflect: any;

@Injectable()
export class PersistenceService {

  private serviceUrl: string;
  private listFilesUrl: string;

  private httpClientX: HttpClient;

  constructor(config: PersistenceServiceConfig, private injector: Injector) {
    this.serviceUrl = config.persistenceServiceUrl;
    this.listFilesUrl = `${config.persistenceServiceUrl}/workspace/list-files`;
  }

  private getHttpClient(): HttpClient {
    if (!this.httpClientX) {
      this.httpClientX = this.injector.get(HttpClient);
    }
    return this.httpClientX;
  }

  listFiles(): Promise<WorkspaceElement> {
    return this.getHttpClient().get<WorkspaceElement>(this.listFilesUrl).toPromise();
  }

  createResource(path: string, type: string): Promise<string> {
    return this.getHttpClient().post(this.getURL(path), '', { responseType: 'text', params: { type: type } }).toPromise();
  }

  deleteResource(path: string): Promise<string> {
    return this.getHttpClient().delete(this.getURL(path), {responseType: 'text'}).toPromise();
  }

  getBinaryResource(path: string): Promise<Blob> {
    return this.getHttpClient().get(this.getURL(path), { responseType: 'blob' }).toPromise();
  }

  private getURL(path: string): string {
    let encodedPath = path.split('/').map(encodeURIComponent).join('/');
    return `${this.serviceUrl}/documents/${encodedPath}`;
  }

}
