import { Response } from '@angular/http';
import { AuthHttp } from 'angular2-jwt';
import { TestExecutionServiceConfig } from './test.execution.service.config';
import { Injectable } from '@angular/core';

@Injectable()
export class TestExecutionService {

  private serviceUrl: string;

  constructor(private http: AuthHttp, config: TestExecutionServiceConfig) {
    this.serviceUrl = config.testExecutionServiceUrl;
  }

  execute(path: string): Promise<Response> {
    let encodedPath = path.split('/').map(encodeURIComponent).join('/');
    let url = `${this.serviceUrl}?resource=${encodedPath}`;
    return this.http.post(url, '').toPromise();
  }

}
