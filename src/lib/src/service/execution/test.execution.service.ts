import { Response } from '@angular/http';
import { AuthHttp } from 'angular2-jwt';
import { TestExecutionServiceConfig } from './test.execution.service.config';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { ElementState } from '../../common/element-state';

@Injectable()
export class TestExecutionService {

  private static readonly statusURLPath = '/status/wait';
  private static readonly executeURLPath = '/execute';
  private serviceUrl: string;

  constructor(private http: AuthHttp, config: TestExecutionServiceConfig) {
    this.serviceUrl = config.testExecutionServiceUrl;
  }

  execute(path: string): Promise<Response> {
    return this.http.post(this.getURL(path, TestExecutionService.executeURLPath), '').toPromise();
  }

  status(path: string): Promise<Response> {
    return this.http.get(this.getURL(path, TestExecutionService.statusURLPath)).toPromise();
  }

  private getURL(workspaceElementPath: string, urlPath: string = ''): string {
    let encodedPath = workspaceElementPath.split('/').map(encodeURIComponent).join('/');
    return `${this.serviceUrl}${urlPath}?resource=${encodedPath}`;
  }

}
