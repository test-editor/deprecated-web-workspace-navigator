import { TestExecutionServiceConfig } from './test.execution.service.config';
import { Injectable, Injector } from '@angular/core';
import { HttpClient } from '@angular/common/http';

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
  abstract execute(path: string): Promise<any>;
  abstract getStatus(path: string): Promise<TestExecutionStatus>;
  abstract getAllStatus(): Promise<TestExecutionStatus[]>;
}


@Injectable()
export class DefaultTestExecutionService extends TestExecutionService {

  private static readonly statusURLPath = '/status';
  private static readonly executeURLPath = '/execute';
  private static readonly statusAllURLPath = '/status/all';
  private serviceUrl: string;

  private httpClient: HttpClient;

  constructor(config: TestExecutionServiceConfig, private injector: Injector) {
    super();
    this.serviceUrl = config.testExecutionServiceUrl;
  }

  private getHttpClient(): HttpClient {
    if (!this.httpClient) {
      this.httpClient = this.injector.get(HttpClient);
    }
    return this.httpClient;
  }

  execute(path: string): Promise<any> {
    return this.getHttpClient().post(this.getURL(path, DefaultTestExecutionService.executeURLPath), '').toPromise();
  }

  getStatus(path: string): Promise<TestExecutionStatus> {
    return this.getHttpClient().get(this.getURL(path, DefaultTestExecutionService.statusURLPath) + '&wait=true', { responseType: 'text' })
      .toPromise().then(text => {
        const status: TestExecutionStatus = { path: path, status: this.toTestExecutionState(text) };
        return status;
      });
  }

  getAllStatus(): Promise<TestExecutionStatus[]> {
    return this.getHttpClient().get<any[]>(`${this.serviceUrl}${DefaultTestExecutionService.statusAllURLPath}`).toPromise().then(statusResponse => {
      const status: any[] = statusResponse;
      status.forEach((value) => { value.status = this.toTestExecutionState(value.status); });
      return status;
    });
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
