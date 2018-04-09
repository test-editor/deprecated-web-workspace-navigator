import { Response } from '@angular/http';
import { HttpClient } from '@angular/common/http';
import { TestExecutionServiceConfig } from './test.execution.service.config';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { ElementState } from '../../common/element-state';
import { TestStatusInfo } from '../../common/test-status-info';

@Injectable()
export class TestExecutionService {

  private static readonly statusURLPath = '/status';
  private static readonly executeURLPath = '/execute';
  private static readonly statusAllURLPath = '/status/all';
  private serviceUrl: string;

  constructor(private httpClient: HttpClient, config: TestExecutionServiceConfig) {
    this.serviceUrl = config.testExecutionServiceUrl;
  }

  execute(path: string): Promise<Response> {
    return this.httpClient.post<Response>(this.getURL(path, TestExecutionService.executeURLPath), '').toPromise();
  }

  status(path: string): Promise<Response> {
    return this.httpClient.get<Response>(this.getURL(path, TestExecutionService.statusURLPath) + '&wait=true').toPromise();
  }

  statusAll(): Promise<Map<string, ElementState>> {
    return this.httpClient.get<Response>(`${this.serviceUrl}${TestExecutionService.statusAllURLPath}`).toPromise().then(response => {
      let statusUpdates: TestStatusInfo[] = response.json();
      return new Map(statusUpdates.map(update => [update.path, this.toElementState(update.status)] as [string, ElementState]));
    });
  }

  private getURL(workspaceElementPath: string, urlPath: string = ''): string {
    let encodedPath = workspaceElementPath.split('/').map(encodeURIComponent).join('/');
    return `${this.serviceUrl}${urlPath}?resource=${encodedPath}`;
  }

  private toElementState(status: string): ElementState {
    switch (status) {
      case 'RUNNING': return ElementState.Running;
      case 'SUCCESS': return ElementState.LastRunSuccessful;
      case 'FAILED': return ElementState.LastRunFailed;
    }
  }
}
