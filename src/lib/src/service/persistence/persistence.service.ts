import { Injectable } from '@angular/core';
import { Http, Headers, Response, RequestOptionsArgs } from '@angular/http';

import { WorkspaceElement } from './workspace-element';
import { PersistenceServiceConfig } from './persistence.service.config';

import 'rxjs/add/operator/toPromise';

@Injectable()
export class PersistenceService {

  private serviceUrl: string;
  private listFilesUrl: string;
  private requestOptions: RequestOptionsArgs;

  constructor(private http: Http, config: PersistenceServiceConfig) {
    this.serviceUrl = config.serviceUrl;
    this.listFilesUrl = `${config.serviceUrl}/workspace/list-files`;
    this.requestOptions = {
      headers: new Headers({
        'Authorization': config.authorizationHeader
      })
    };
  }

  listFiles(): Promise<WorkspaceElement> {
    return this.http.get(this.listFilesUrl, this.requestOptions).toPromise()
      .then(response => response.json());
  }

}
