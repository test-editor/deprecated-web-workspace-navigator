import { TestExecutionServiceConfig } from './test.execution.service.config';
import { Injectable, Injector } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MessagingService } from '@testeditor/messaging-service';
import { Observable } from 'rxjs/Observable';

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
  abstract execute(path: string, onThen?: (some: any) => void, onError?: (error: any) => void): void
  abstract getStatus(path: string, onThen?: (status: TestExecutionStatus) => void, onError?: (error: any) => void): void
  abstract getAllStatus(onThen?: (status: TestExecutionStatus[]) => void, onError?: (error: any) => void): void
}


@Injectable()
export class DefaultTestExecutionService extends TestExecutionService {

  private static readonly statusURLPath = '/status';
  private static readonly executeURLPath = '/execute';
  private static readonly statusAllURLPath = '/status/all';
  private serviceUrl: string;

  private httpClient: HttpClient;

  constructor(config: TestExecutionServiceConfig, private messagingService: MessagingService) {
    super();
    this.serviceUrl = config.testExecutionServiceUrl;
  }

  private httpClientExecute(onResponse: (httpClient: HttpClient) => Promise<any>,
                            onThen?: (some: any) => void,
                            onError?: (error: any) => void): void {
    if (this.httpClient) {
      this.httpClientExecuteCached(onResponse, onThen, onError);
    } else {
      const responseSubscription = this.messagingService.subscribe(HTTP_CLIENT_SUPPLIED, (httpClientPayload) => {
        responseSubscription.unsubscribe();
        this.httpClient = httpClientPayload.httpClient;
        this.httpClientExecuteCached(onResponse, onThen, onError);
      });
      this.messagingService.publish(HTTP_CLIENT_NEEDED, null);
    }
  }

  private httpClientExecuteCached(onResponse: (httpClient: HttpClient) => Promise<any>,
                                  onThen?: (some: any) => void,
                                  onError?: (error: any) => void): void {
    onResponse(this.httpClient).then((some) => {
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

  execute(path: string, onThen?: (some: any) => void, onError?: (error: any) => void): void {
    this.httpClientExecute(httpClient => {
      return httpClient.post(this.getURL(path, DefaultTestExecutionService.executeURLPath), '').toPromise();
    }, onThen, onError );
  }

  getStatus(path: string,
            onThen?: (status: TestExecutionStatus) => void,
            onError?: (error: any) => void): void { // Promise<TestExecutionStatus> {
    this.httpClientExecute(httpClient => {
      return httpClient.get(this.getURL(path, DefaultTestExecutionService.statusURLPath) + '&wait=true', { responseType: 'text' })
        .toPromise();
    }, text => {
      const status: TestExecutionStatus = { path: path, status: this.toTestExecutionState(text) };
      onThen(status);
    }, onError);
  }

  getAllStatus(onThen?: (status: TestExecutionStatus[]) => void,
               onError?: (error: any) => void): void { //  Promise<TestExecutionStatus[]> {
    this.httpClientExecute(httpClient => {
      return httpClient.get<any[]>(`${this.serviceUrl}${DefaultTestExecutionService.statusAllURLPath}`).toPromise();
    }, statusResponse => {
      const status: any[] = statusResponse;
      status.forEach((value) => { value.status = this.toTestExecutionState(value.status); });
      onThen(status);
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

}
