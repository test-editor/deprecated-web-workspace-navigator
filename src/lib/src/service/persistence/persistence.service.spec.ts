import { PersistenceServiceConfig } from './persistence.service.config'
import { PersistenceService } from './persistence.service'
import { AuthHttp, AuthConfig } from 'angular2-jwt';
import { Observable } from 'rxjs/Observable';
import { Response, ResponseOptions, ConnectionBackend, XHRBackend, RequestMethod, HttpModule } from '@angular/http';
import { MockBackend, MockConnection } from '@angular/http/testing';
import { Injector, ReflectiveInjector } from '@angular/core';
import { inject } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { fakeAsync } from '@angular/core/testing';
import { HTTP_STATUS_OK } from '../../component/navigation/navigation.component.test.setup';

describe('TestExecutionService', () => {
  let serviceConfig: PersistenceServiceConfig;

  beforeEach(() => {
    serviceConfig = new PersistenceServiceConfig();
    serviceConfig.persistenceServiceUrl = 'http://localhost:9080';
    // dummy jwt token
    let authToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.t-IDcSemACt8x4iTMCda8Yhe3iZaWbvV5XKSTbuAn0M';

    TestBed.configureTestingModule({
      imports: [HttpModule],
      providers: [
        { provide: XHRBackend, useClass: MockBackend},
        { provide: AuthConfig, useValue: new AuthConfig({tokenGetter: () => authToken}) },
        { provide: PersistenceServiceConfig, useValue: serviceConfig },
        PersistenceService, AuthHttp
      ]
    });
  });

  it('invokes REST endpoint with encoded path', fakeAsync(inject([XHRBackend, PersistenceService],
    (mockBackend: MockBackend, persistenceService: PersistenceService) => {
    // given
    let tclFilePath = 'path/to/file?.tcl';
    mockBackend.connections.subscribe(
      (connection: MockConnection) => {
        expect(connection.request.method).toBe(RequestMethod.Delete);
        expect(connection.request.url).toBe(serviceConfig.persistenceServiceUrl + '/documents/path/to/file%3F.tcl');

        connection.mockRespond(new Response( new ResponseOptions({status: HTTP_STATUS_OK})));
      }
    );

    // when
    persistenceService.deleteResource(tclFilePath)

    // then
    .then(response => {
      expect(response.status).toBe(HTTP_STATUS_OK);
    });
  })));

});
