import { Injectable, Injector } from '@angular/core';
import { HttpClient, HttpClientModule }  from '@angular/common/http';
import { WorkspaceElement } from '../../common/workspace-element';
import { PersistenceServiceConfig } from './persistence.service.config';
import { Conflict } from './conflict';
import 'rxjs/add/operator/toPromise';
import { MessagingService } from '@testeditor/messaging-service';

// code duplication with test execution service and test-editor-web, removal planned with next refactoring
const HTTP_CLIENT_NEEDED = 'httpClient.needed';
const HTTP_CLIENT_SUPPLIED = 'httpClient.supplied';

export const HTTP_STATUS_NO_CONTENT = 204;
export const HTTP_STATUS_CONFLICT = 409;
export const HTTP_HEADER_CONTENT_LOCATION = 'content-location';
@Injectable()
export class PersistenceService {

  private serviceUrl: string;
  private listFilesUrl: string;

  private cachedHttpClient: HttpClient;

  constructor(config: PersistenceServiceConfig, private messagingService: MessagingService) {
    this.serviceUrl = config.persistenceServiceUrl;
    this.listFilesUrl = `${config.persistenceServiceUrl}/workspace/list-files`;
  }

  listFiles(onResponse: (workspaceElement: WorkspaceElement) => void, onError?: (error: any) => void) {
    this.httpClientExecute( httpClient => httpClient.get<WorkspaceElement>(this.listFilesUrl).toPromise(), onResponse, onError);
  }

  renameResource(newPath: string, oldPath: string, onResponse: (some: Conflict | string) => void, onError?: (error: any) => void): void {
    this.httpClientExecute(
      httpClient => httpClient.put(this.getRenameURL(oldPath), newPath, { observe: 'response', responseType: 'text'}).toPromise(),
      (response) => {
        onResponse(response.body);
      }, (response) => {
      if (response.status === HTTP_STATUS_CONFLICT) {
        onResponse(new Conflict(response.error));
      } else {
        onError(new Error(response.error));
      }
      });
  }

  deleteResource(path: string, onResponse: (some: Conflict | string) => void, onError?: (error: any) => void): void {
    this.httpClientExecute(
      httpClient => httpClient.delete(this.getURL(path), { observe: 'response', responseType: 'text'}).toPromise(),
      (response) => {
        onResponse(response.body);
      }, (response) => {
      if (response.status === HTTP_STATUS_CONFLICT) {
        onResponse(new Conflict(response.error));
      } else {
        onError(new Error(response.error));
      }
      });
  }

  createResource(path: string, type: string, onResponse: (some: Conflict | string) => void, onError?: (error: any) => void): void {
    this.httpClientExecute(
      httpClient => httpClient.post(this.getURL(path), '', { observe: 'response', responseType: 'text', params: { type: type } })
        .toPromise(),
      (response) => {
        onResponse(response.body);
      }, (response) => {
        if (response.status === HTTP_STATUS_CONFLICT) {
          onResponse(new Conflict(response.error));
        } else {
          onError(response.error);
        }
      });
  }

  getBinaryResource(path: string, onResponse: (blob: Blob) => void, onError?: (error: any) => void): void {
    this.httpClientExecute( httpClient => httpClient.get(this.getURL(path), { responseType: 'blob' }).toPromise(), onResponse, onError);
  }

  private getRenameURL(path: string): string {
    return this.getURL(path) + '?rename';
  }

  private getURL(path: string): string {
    let encodedPath = path.split('/').map(encodeURIComponent).join('/');
    return `${this.serviceUrl}/documents/${encodedPath}`;
  }

  // code duplication with test execution service, removal planned with next refactoring
  private httpClientExecute(onHttpClient: (httpClient: HttpClient) => Promise<any>,
                            onResponse?: (some: any) => void,
                            onError?: (error: any) => void): void {
    if (this.cachedHttpClient) {
      this.httpClientExecuteCached(onHttpClient, onResponse, onError);
    } else {
      const responseSubscription = this.messagingService.subscribe(HTTP_CLIENT_SUPPLIED, (httpClientPayload) => {
        responseSubscription.unsubscribe();
        this.cachedHttpClient = httpClientPayload.httpClient;
        this.httpClientExecuteCached(onHttpClient, onResponse, onError);
      });
      this.messagingService.publish(HTTP_CLIENT_NEEDED, null);
    }
  }

  private httpClientExecuteCached(onHttpClient: (httpClient: HttpClient) => Promise<any>,
                                  onResponse?: (some: any) => void,
                                  onError?: (error: any) => void): void {
    onHttpClient(this.cachedHttpClient).then((some) => {
      if (onResponse) {
        onResponse(some);
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
