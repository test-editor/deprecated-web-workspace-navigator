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
import { HTTP_STATUS_CREATED, HTTP_STATUS_OK } from '../../component/navigation/navigation.component.test.setup';

describe('TestExecutionService', () => {
  let serviceConfig: TestExecutionServiceConfig;

  beforeEach(() => {
    serviceConfig = new TestExecutionServiceConfig();
    serviceConfig.testExecutionServiceUrl = 'http://localhost:9080/tests';
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

  it('invokes REST endpoint with encoded path', fakeAsync(inject([XHRBackend, TestExecutionService],
    (mockBackend: MockBackend, executionService: TestExecutionService) => {
    // given
    let tclFilePath = 'path/to/file?.tcl';
    mockBackend.connections.subscribe(
      (connection: MockConnection) => {
        expect(connection.request.method).toBe(RequestMethod.Post);
        expect(connection.request.url).toBe(serviceConfig.testExecutionServiceUrl + '/execute?resource=path/to/file%3F.tcl');

        connection.mockRespond(new Response( new ResponseOptions({status: HTTP_STATUS_CREATED})));
      }
    );

    // when
    executionService.execute(tclFilePath)

    // then
    .then(response => {
      expect(response.status).toBe(HTTP_STATUS_CREATED);
    });
  })));

  it('invokes REST test status endpoint', fakeAsync(inject([XHRBackend, TestExecutionService],
    (mockBackend: MockBackend, executionService: TestExecutionService) => {
    // given
    let tclFilePath = 'path/to/file.tcl';
    mockBackend.connections.subscribe(
      (connection: MockConnection) => {
        expect(connection.request.method).toBe(RequestMethod.Get);
        expect(connection.request.url).toBe(serviceConfig.testExecutionServiceUrl + '/status/wait?resource=path/to/file.tcl');

        connection.mockRespond(new Response( new ResponseOptions({
          body: 'IDLE',
          status: HTTP_STATUS_OK
        })));
      }
    );

    // when
    executionService.status(tclFilePath)

    // then
    .then(response => {
      expect(response.status).toBe(HTTP_STATUS_OK);
      expect(response.text()).toBe('IDLE');
    });
  })));
});
