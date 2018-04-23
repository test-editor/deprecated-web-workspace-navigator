import { Injectable, Injector } from '@angular/core';
import { HttpClient, HttpClientModule }  from '@angular/common/http';
import { WorkspaceElement } from '../../common/workspace-element';
import { PersistenceServiceConfig } from './persistence.service.config';

import 'rxjs/add/operator/toPromise';
import { MessagingService } from '@testeditor/messaging-service';

// code duplication with test execution service and test-editor-web, removal planned with next refactoring
const HTTP_CLIENT_NEEDED = 'httpClient.needed';
const HTTP_CLIENT_SUPPLIED = 'httpClient.supplied';

@Injectable()
export class PersistenceService {

  private serviceUrl: string;
  private listFilesUrl: string;

  private cachedHttpClient: HttpClient;

  constructor(config: PersistenceServiceConfig, private messagingService: MessagingService) {
    this.serviceUrl = config.persistenceServiceUrl;
    this.listFilesUrl = `${config.persistenceServiceUrl}/workspace/list-files`;
  }

  listFiles(onThen: (workspaceElement: WorkspaceElement) => void, onError?: (error: any) => void) {
    this.httpClientExecute( httpClient => httpClient.get<WorkspaceElement>(this.listFilesUrl).toPromise(), onThen, onError);
  }

  createResource(path: string, type: string, onThen: (some: string) => void, onError?: (error: any) => void): void {
    this.httpClientExecute(
      httpClient => httpClient.post(this.getURL(path), '', { responseType: 'text', params: { type: type } }).toPromise(),
      onThen, onError);
  }

  deleteResource(path: string, onThen: (some: string) => void, onError?: (error: any) => void): void {
    this.httpClientExecute( httpClient => httpClient.delete(this.getURL(path), {responseType: 'text'}).toPromise(), onThen, onError);
  }

  getBinaryResource(path: string, onThen: (blob: Blob) => void, onError?: (error: any) => void): void {
    this.httpClientExecute( httpClient => httpClient.get(this.getURL(path), { responseType: 'blob' }).toPromise(), onThen, onError);
  }

  private getURL(path: string): string {
    let encodedPath = path.split('/').map(encodeURIComponent).join('/');
    return `${this.serviceUrl}/documents/${encodedPath}`;
  }

  // code duplication with test execution service, removal planned with next refactoring
  private httpClientExecute(onResponse: (httpClient: HttpClient) => Promise<any>,
                            onThen?: (some: any) => void,
                            onError?: (error: any) => void): void {
    if (this.cachedHttpClient) {
      this.httpClientExecuteCached(onResponse, onThen, onError);
    } else {
      const responseSubscription = this.messagingService.subscribe(HTTP_CLIENT_SUPPLIED, (httpClientPayload) => {
        responseSubscription.unsubscribe();
        this.cachedHttpClient = httpClientPayload.httpClient;
        this.httpClientExecuteCached(onResponse, onThen, onError);
      });
      this.messagingService.publish(HTTP_CLIENT_NEEDED, null);
    }
  }

  private httpClientExecuteCached(onResponse: (httpClient: HttpClient) => Promise<any>,
                                  onThen?: (some: any) => void,
                                  onError?: (error: any) => void): void {
    onResponse(this.cachedHttpClient).then((some) => {
      if (onThen) {
        onThen(some);
      }
    }).catch((error) => {
      if (onError) {
        onError(error);
      } else {
        throw(error);
      }
    });
  }

}
