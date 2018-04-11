import { TestExecutionService, TestExecutionState, DefaultTestExecutionService } from './test.execution.service';
import { TestExecutionServiceConfig } from './test.execution.service.config';
import { Observable } from 'rxjs/Observable';
import { HttpTestingController, HttpClientTestingModule } from '@angular/common/http/testing';
import { Injector, ReflectiveInjector } from '@angular/core';
import { inject } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { fakeAsync } from '@angular/core/testing';
import { HTTP_STATUS_CREATED, HTTP_STATUS_OK } from '../../component/navigation/navigation.component.test.setup';
import { ElementState } from '../../common/element-state';
import { HttpClient, HttpClientModule } from '@angular/common/http';

describe('TestExecutionService', () => {
  let serviceConfig: TestExecutionServiceConfig;

  beforeEach(() => {
    serviceConfig = new TestExecutionServiceConfig();
    serviceConfig.testExecutionServiceUrl = 'http://localhost:9080/tests';

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, HttpClientModule],
      providers: [
        { provide: TestExecutionServiceConfig, useValue: serviceConfig },
        { provide: TestExecutionService, useClass: DefaultTestExecutionService },
        HttpClient
      ]
    });
  });

  it('invokes REST endpoint with encoded path', fakeAsync(inject([HttpTestingController, TestExecutionService],
    (httpMock: HttpTestingController, executionService: TestExecutionService) => {
      // given
      const tclFilePath = 'path/to/file?.tcl';
      const request = { method: 'POST',
                        url: serviceConfig.testExecutionServiceUrl + '/execute?resource=path/to/file%3F.tcl' };
      const mockResponse = 'something'

      // when
      executionService.execute(tclFilePath)

      // then
        .then(response => {
          expect(response).toBe('something');
        });

      httpMock.match(request)[0].flush(mockResponse);
  })));

  it('invokes REST test status endpoint', fakeAsync(inject([HttpTestingController, TestExecutionService],
    (httpMock: HttpTestingController, executionService: TestExecutionService) => {
      // given
      const tclFilePath = 'path/to/file.tcl';
      const request = { method: 'GET',
                        url: serviceConfig.testExecutionServiceUrl + '/status?resource=' + tclFilePath + '&wait=true' };
      const mockResponse = { status: 'IDLE', path: tclFilePath };

      // when
      executionService.getStatus(tclFilePath)

      // then
        .then(result => {
          expect(result).toEqual({ status: TestExecutionState.Idle, path: tclFilePath });
        });

      httpMock.match(request)[0].flush(mockResponse);
  })));

  it('translates server response to "getAllStatus" request to properly typed array of TestExecutionStatus',
     fakeAsync(inject([HttpTestingController, TestExecutionService],
    (httpMock: HttpTestingController, executionService: TestExecutionService) => {
      // given
      const request = { method: 'GET',
                        url: serviceConfig.testExecutionServiceUrl + '/status/all' };
      const mockResponse = [{ status: 'FAILED',  path: 'failedTest.tcl' },
                            { status: 'RUNNING', path: 'runningTest.tcl' },
                            { status: 'SUCCESS', path: 'successfulTest.tcl' }];

      // when
      executionService.getAllStatus()

      // then
      .then(statusUpdates => {
        expect(statusUpdates).toEqual([{ status: TestExecutionState.LastRunFailed,     path: 'failedTest.tcl' },
                                       { status: TestExecutionState.Running,           path: 'runningTest.tcl' },
                                       { status: TestExecutionState.LastRunSuccessful, path: 'successfulTest.tcl' }]);

      httpMock.match(request)[0].flush(mockResponse);
  })})));
});
