import { Response, ResponseOptions } from '@angular/http';
import { AuthHttp } from 'angular2-jwt';
import { Injectable } from '@angular/core';

@Injectable()
export class TestExecutionServiceMock {
private readonly statusMap = new Map<string, string>();

  execute(path: string): Promise<Response> {
    console.log(`Received execute(path: '${path}')`);
    this.statusMap[path] = 'RUNNING';
    return Promise.resolve(new Response(new ResponseOptions({ status: 201 })));
  }

  status(path: string): Promise<Response> {
    console.log(`Received status(path: '${path}')`);
    let timeout: number;
    if (this.statusMap[path] === 'RUNNING') {
      let self = this;
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve(new Response(new ResponseOptions({
            status: 200,
            body: 'RUNNING'
          })));
        }, 5000);
        self.statusMap[path] = Math.random() < 0.5 ? 'SUCCESS' : 'FAILED';
        console.log(`Test '${path}' will complete with status '${self.statusMap[path]}'`);
      });
    } else {
      return Promise.resolve(new Response(new ResponseOptions({
            status: 200,
            body: this.statusMap[path]
          })));
    }
  }
}
