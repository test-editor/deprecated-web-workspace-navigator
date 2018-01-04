import { Response, ResponseOptions } from '@angular/http';
import { AuthHttp } from 'angular2-jwt';
import { Injectable } from '@angular/core';

@Injectable()
export class TestExecutionServiceMock {
  execute(path: string): Promise<Response> {
    console.log(`Received execute(path: '${path}')`);
    return Promise.resolve(new Response(new ResponseOptions({ status: 201 })));
  }
}
