import { TestExecutionServiceConfig } from './test.execution.service.config';
import { Injectable, Injector } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MessagingService } from '@testeditor/messaging-service';

// code duplication with persistence service and test-editor-web, removal planned with next refactoring
const HTTP_CLIENT_NEEDED = 'httpClient.needed';
const HTTP_CLIENT_SUPPLIED = 'httpClient.supplied';

export enum TestExecutionState {
  Idle = 0,
  LastRunSuccessful = 1,
  LastRunFailed = 2,
  Running = 3
}


export interface TestExecutionStatus {
  path: string;
  status: TestExecutionState;
}


export abstract class TestExecutionService {
  abstract execute(path: string, onResponse?: (some: any) => void, onError?: (error: any) => void): void
  abstract getStatus(path: string, onResponse?: (status: TestExecutionStatus) => void, onError?: (error: any) => void): void
  abstract getAllStatus(onResponse?: (status: TestExecutionStatus[]) => void, onError?: (error: any) => void): void
}


@Injectable()
export class DefaultTestExecutionService extends TestExecutionService {

  private static readonly statusURLPath = '/status';
  private static readonly executeURLPath = '/execute';
  private static readonly statusAllURLPath = '/status/all';
  private serviceUrl: string;

  private cachedHttpClient: HttpClient;

  constructor(config: TestExecutionServiceConfig, private messagingService: MessagingService) {
    super();
    this.serviceUrl = config.testExecutionServiceUrl;
  }

  execute(path: string, onResponse?: (some: any) => void, onError?: (error: any) => void): void {
    this.httpClientExecute(httpClient => {
      return httpClient.post(this.getURL(path, DefaultTestExecutionService.executeURLPath), '').toPromise();
    }, onResponse, onError );
  }

  getStatus(path: string,
            onResponse?: (status: TestExecutionStatus) => void,
            onError?: (error: any) => void): void {
    this.httpClientExecute(httpClient => {
      return httpClient.get(this.getURL(path, DefaultTestExecutionService.statusURLPath) + '&wait=true', { responseType: 'text' })
        .toPromise();
    }, text => {
      const status: TestExecutionStatus = { path: path, status: this.toTestExecutionState(text) };
      onResponse(status);
    }, onError);
  }

  getAllStatus(onResponse?: (status: TestExecutionStatus[]) => void,
               onError?: (error: any) => void): void {
    this.httpClientExecute(httpClient => {
      return httpClient.get<any[]>(`${this.serviceUrl}${DefaultTestExecutionService.statusAllURLPath}`).toPromise();
    }, statusResponse => {
      const status: any[] = statusResponse;
      status.forEach((value) => { value.status = this.toTestExecutionState(value.status); });
      onResponse(status);
    }, onError);
  }

  private getURL(workspaceElementPath: string, urlPath: string = ''): string {
    const encodedPath = workspaceElementPath.split('/').map(encodeURIComponent).join('/');
    return `${this.serviceUrl}${urlPath}?resource=${encodedPath}`;
  }

  private toTestExecutionState(state: string): TestExecutionState {
    switch (state) {
      case 'RUNNING': return TestExecutionState.Running;
      case 'FAILED': return TestExecutionState.LastRunFailed;
      case 'SUCCESS': return TestExecutionState.LastRunSuccessful;
      case 'IDLE':
      default: return TestExecutionState.Idle;
    }
  }

  // code duplication with persistence service, removal planned with next refactoring
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
