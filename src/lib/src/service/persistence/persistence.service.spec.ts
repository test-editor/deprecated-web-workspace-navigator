import { PersistenceServiceConfig } from './persistence.service.config'
import { PersistenceService } from './persistence.service'
import { Observable } from 'rxjs/Observable';
import { HttpClientModule, HttpClient, HttpResponse } from '@angular/common/http';
import { HttpTestingController, HttpClientTestingModule } from '@angular/common/http/testing';
import { Injector } from '@angular/core';
import { inject } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { fakeAsync } from '@angular/core/testing';
import { HTTP_STATUS_OK } from '../../component/navigation/navigation.component.test.setup';
import { Conflict } from './conflict';

describe('PersistenceService', () => {
  let serviceConfig: PersistenceServiceConfig;

  beforeEach(() => {
    serviceConfig = new PersistenceServiceConfig();
    serviceConfig.persistenceServiceUrl = 'http://localhost:9080';

    TestBed.configureTestingModule({
      imports: [HttpClientModule, HttpClientTestingModule],
      providers: [
        { provide: PersistenceServiceConfig, useValue: serviceConfig },
        PersistenceService,
        HttpClient
      ]
    });
  });

  it('invokes REST endpoint with encoded path', fakeAsync(inject([HttpTestingController, PersistenceService],
    (httpMock: HttpTestingController, persistenceService: PersistenceService) => {
      // given
      let tclFilePath = 'path/to/file?.tcl';

      // when
      persistenceService.deleteResource(tclFilePath)

        // then
        .subscribe(response => {
          expect(response).toBe('');
        });

      httpMock.match({
        method: 'DELETE',
        url: serviceConfig.persistenceServiceUrl + '/documents/path/to/file%3F.tcl'
      })[0].flush('');
    })));

    it('createResource returns Conflict object if HTTP status code is CONFLICT',
      inject([HttpTestingController, PersistenceService],
      (httpMock: HttpTestingController, persistenceService: PersistenceService) => {
        // given
        let tclFilePath = 'path/to/file.tcl';
        const url = `${serviceConfig.persistenceServiceUrl}/documents/${tclFilePath}`;
        const message = `The file '${tclFilePath}' already exists.`;
        const mockResponse = new HttpResponse({ body: message, status: 409, statusText: 'Conflict' });

        const expectedResult = new Conflict(message);

        // when
        const actualObservableResult = persistenceService.createResource(tclFilePath, 'file');

        // then
        actualObservableResult.subscribe(actualResult => {
          expect(actualResult).toEqual(expectedResult);
        });

        const actualRequest = httpMock.expectOne({ method: 'POST' });
        expect(actualRequest.request.url).toEqual('http://localhost:9080/documents/path/to/file.tcl');
        expect(actualRequest.request.params.get('type')).toEqual('file');
        actualRequest.flush(message, {status: 409, statusText: 'Conflict'});
      }));

      it('deleteResource returns Conflict object if HTTP status code is CONFLICT',
      inject([HttpTestingController, PersistenceService],
      (httpMock: HttpTestingController, persistenceService: PersistenceService) => {
        // given
        let tclFilePath = 'path/to/file.tcl';
        const url = `${serviceConfig.persistenceServiceUrl}/documents/${tclFilePath}`;
        const message = `The file '${tclFilePath}' does not exist.`;
        const mockResponse = new HttpResponse({ body: message, status: 409, statusText: 'Conflict' });

        const expectedResult = new Conflict(message);

        // when
        const actualObservableResult = persistenceService.deleteResource(tclFilePath);

        // then
        actualObservableResult.subscribe(actualResult => {
          expect(actualResult).toEqual(expectedResult);
        });

        const actualRequest = httpMock.expectOne({ method: 'DELETE' });
        expect(actualRequest.request.url).toEqual('http://localhost:9080/documents/path/to/file.tcl');
        actualRequest.flush(message, {status: 409, statusText: 'Conflict'});
      }));
});
