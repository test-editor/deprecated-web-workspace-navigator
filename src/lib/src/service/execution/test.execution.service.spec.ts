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
    serviceConfig.serviceUrl = 'http://localhost:9080/tests';

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

    // when
    executionService.execute(tclFilePath)

    // then
    .then(response => {
      expect(response).toBe('');
    });

      httpMock.match({
        method: 'POST',
        url: serviceConfig.serviceUrl + '/execute?resource=path/to/file%3F.tcl'
      })[0].flush('');
  })));

  it('invokes REST test status endpoint', fakeAsync(inject([HttpTestingController, TestExecutionService],
    (httpMock: HttpTestingController, executionService: TestExecutionService) => {
    // given
    let tclFilePath = 'path/to/file.tcl';

    // when
    executionService.getStatus(tclFilePath)

    // then
    .then(response => {
      expect(response.status).toBe(TestExecutionState.Idle);
      expect(response.path).toBe(tclFilePath);
    });

      httpMock.match({
        url: serviceConfig.serviceUrl + '/status?resource=' + tclFilePath + '&wait=true',
        method: 'GET'
      })[0].flush({ status: 'IDLE', path: tclFilePath });
  })));

  it('Translates server response to "statusAll" request to properly typed map', fakeAsync(inject([HttpTestingController, TestExecutionService],
    (httpMock: HttpTestingController, executionService: TestExecutionService) => {
      // given

      // when
      executionService.getAllStatus()

      // then
      .then(statusUpdates => {
        expect(statusUpdates.length).toEqual(3);
        // expect(statusUpdates.get('failedTest.tcl')).toEqual(ElementState.LastRunFailed);
        // expect(statusUpdates.get('runningTest.tcl')).toEqual(ElementState.Running);
        // expect(statusUpdates.get('successfulTest.tcl')).toEqual(ElementState.LastRunSuccessful);
      });
      httpMock.match({
        method: 'GET',
        url: serviceConfig.serviceUrl + '/status/all'
      })[0].flush([{ status: 'FAILED',  path: 'failedTest.tcl' },
                   { status: 'RUNNING', path: 'runningTest.tcl' },
                   { status: 'SUCCESS', path: 'successfulTest.tcl' }]);
    })));
});
