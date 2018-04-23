import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TestExecutionService, TestExecutionState, DefaultTestExecutionService } from './test.execution.service';
import { TestExecutionServiceConfig } from './test.execution.service.config';
import { Observable } from 'rxjs/Observable';
import { HttpTestingController, HttpClientTestingModule } from '@angular/common/http/testing';
import { Injector } from '@angular/core';
import { inject } from '@angular/core/testing';
import { HTTP_STATUS_CREATED, HTTP_STATUS_OK } from '../../component/navigation/navigation.component.test.setup';
import { ElementState } from '../../common/element-state';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { MessagingService, MessagingModule } from '@testeditor/messaging-service';

describe('TestExecutionService', () => {
  let serviceConfig: TestExecutionServiceConfig;
  let messagingService: MessagingService;
  let httpClient: HttpClient;

  beforeEach(() => {
    serviceConfig = new TestExecutionServiceConfig();
    serviceConfig.testExecutionServiceUrl = 'http://localhost:9080/tests';

    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        HttpClientModule,
        MessagingModule.forRoot()
      ],
      providers: [
        { provide: TestExecutionServiceConfig, useValue: serviceConfig },
        { provide: TestExecutionService, useClass: DefaultTestExecutionService },
        HttpClient
      ]
    });

    messagingService = TestBed.get(MessagingService);
    httpClient = TestBed.get(HttpClient);

    const subscription = messagingService.subscribe('httpClient.needed', () => {
      subscription.unsubscribe();
      messagingService.publish('httpClient.supplied', { httpClient: httpClient });
    });
  });

  it('invokes REST endpoint with encoded path', inject([HttpTestingController, TestExecutionService],
    (httpMock: HttpTestingController, executionService: TestExecutionService) => {
      // given
      const tclFilePath = 'path/to/file?.tcl';
      const request = { method: 'POST',
                        url: serviceConfig.testExecutionServiceUrl + '/execute?resource=path/to/file%3F.tcl' };
      const mockResponse = 'something'

      // when
      executionService.execute(
        tclFilePath,

      // then
        response => {
          expect(response).toBe('something');
        });

      httpMock.match(request)[0].flush(mockResponse);
  }));

  it('invokes REST test status endpoint', inject([HttpTestingController, TestExecutionService],
    (httpMock: HttpTestingController, executionService: TestExecutionService) => {
      // given
      const tclFilePath = 'path/to/file.tcl';
      const request = { method: 'GET',
                        url: serviceConfig.testExecutionServiceUrl + '/status?resource=' + tclFilePath + '&wait=true' };
      const mockResponse = { status: 'IDLE', path: tclFilePath };

      // when
      executionService.getStatus(
        tclFilePath,

      // then
        result => {
          expect(result).toEqual({ status: TestExecutionState.Idle, path: tclFilePath });
        });

      httpMock.match(request)[0].flush(mockResponse);
  }));

  it('translates server response to "getAllStatus" request to properly typed array of TestExecutionStatus',
     inject([HttpTestingController, TestExecutionService],
    (httpMock: HttpTestingController, executionService: TestExecutionService) => {
      // given
      const request = { method: 'GET',
                        url: serviceConfig.testExecutionServiceUrl + '/status/all' };
      const mockResponse = [{ status: 'FAILED',  path: 'failedTest.tcl' },
                            { status: 'RUNNING', path: 'runningTest.tcl' },
                            { status: 'SUCCESS', path: 'successfulTest.tcl' }];

      // when
      executionService.getAllStatus(

      // then
      statusUpdates => {
        expect(statusUpdates).toEqual([{ status: TestExecutionState.LastRunFailed,     path: 'failedTest.tcl' },
                                       { status: TestExecutionState.Running,           path: 'runningTest.tcl' },
                                       { status: TestExecutionState.LastRunSuccessful, path: 'successfulTest.tcl' }])});

      httpMock.match(request)[0].flush(mockResponse);
  }));
});
