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
import { ElementState } from '../../common/element-state';

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
        let expectedURL = new URL(serviceConfig.testExecutionServiceUrl);
        let actualURL = new URL(connection.request.url);
        expect(actualURL.protocol).toBe(expectedURL.protocol);
        expect(actualURL.host).toBe(expectedURL.host);
        expect(actualURL.pathname).toBe('/tests/status');
        expect(actualURL.searchParams.get('wait')).toBe('true');
        expect(actualURL.searchParams.get('resource')).toBe(tclFilePath);

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

  it('Translates server response to "statusAll" request to properly typed map', fakeAsync(inject([XHRBackend, TestExecutionService],
    (mockBackend: MockBackend, executionService: TestExecutionService) => {
      // given
      mockBackend.connections.subscribe(
        (connection: MockConnection) => {
          expect(connection.request.method).toBe(RequestMethod.Get);
          expect(connection.request.url).toBe(serviceConfig.testExecutionServiceUrl + '/status/all');

          connection.mockRespond(new Response(new ResponseOptions({
            status: HTTP_STATUS_OK,
            body: '[{"path":"failedTest.tcl","status":"FAILED"},\
{"path":"runningTest.tcl","status":"RUNNING"},{"path":"successfulTest.tcl","status":"SUCCESS"}]'
          })));
        }
      );

      // when
      executionService.statusAll()

      // then
      .then(statusUpdates => {
        expect(statusUpdates instanceof Map).toBeTruthy();
        expect(statusUpdates.size).toEqual(3);
        expect(statusUpdates.get('failedTest.tcl')).toEqual(ElementState.LastRunFailed);
        expect(statusUpdates.get('runningTest.tcl')).toEqual(ElementState.Running);
        expect(statusUpdates.get('successfulTest.tcl')).toEqual(ElementState.LastRunSuccessful);
      });
    })));
});
