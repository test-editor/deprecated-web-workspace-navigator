import { PersistenceServiceConfig } from './persistence.service.config'
import { PersistenceService } from './persistence.service'
import { Observable } from 'rxjs/Observable';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { HttpTestingController, HttpClientTestingModule } from '@angular/common/http/testing';
import { Injector, ReflectiveInjector } from '@angular/core';
import { inject } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { fakeAsync } from '@angular/core/testing';
import { HTTP_STATUS_OK } from '../../component/navigation/navigation.component.test.setup';

describe('PersistenceExecutionService', () => {
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
        .then(response => {
          expect(response).toBe('');
        });

      httpMock.match({
        method: 'DELETE',
        url: serviceConfig.persistenceServiceUrl + '/documents/path/to/file%3F.tcl'
      })[0].flush('');
    })));

});
