import { TestExecutionService } from './test.execution.service';
import { AuthHttp, AuthConfig } from 'angular2-jwt';
import { TestExecutionServiceConfig } from './test.execution.service.config';
import { Observable } from 'rxjs/Observable';
import { Response, ResponseOptions, ConnectionBackend, XHRBackend, RequestMethod, HttpModule } from '@angular/http';
import { MockBackend, MockConnection } from '@angular/http/testing';
import { Injector, ReflectiveInjector } from '@angular/core';
import { inject } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { fakeAsync } from '@angular/core/testing';

describe('TestExecutionService', () => {
  let serviceConfig: TestExecutionServiceConfig;

  beforeEach(() => {
    serviceConfig = new TestExecutionServiceConfig();
    serviceConfig.testExecutionServiceUrl = 'http://example.org';
    // dummy jwt token
    let authToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.t-IDcSemACt8x4iTMCda8Yhe3iZaWbvV5XKSTbuAn0M';

    TestBed.configureTestingModule({
      imports: [HttpModule],
      providers: [
        { provide: XHRBackend, useClass: MockBackend},
        { provide: AuthConfig, useValue: new AuthConfig({tokenGetter: () => authToken}) },
        { provide: TestExecutionServiceConfig, useValue: serviceConfig },
        TestExecutionService, AuthHttp
      ]
    });
  });

  it('invokes REST endpoint with provided path', fakeAsync(inject([XHRBackend, TestExecutionService],
    (mockBackend: MockBackend, executionService: TestExecutionService) => {
    // given
    let tclFilePath = 'path/to/file.tcl';
    mockBackend.connections.subscribe(
      (connection: MockConnection) => {
        expect(connection.request.method).toBe(RequestMethod.Put);
        expect(connection.request.url).toBe(serviceConfig.testExecutionServiceUrl + '/' + tclFilePath);

        connection.mockRespond(new Response( new ResponseOptions({status: 200})));
      }
    );

    // when
    executionService.execute(tclFilePath)

    // then
    .then(response => {
      expect(response.status).toBe(200);
    });
  })));

});
