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
    let url = `${this.serviceUrl}?resource=${path}`;
    return this.http.post(url, '').toPromise();
  }

}
