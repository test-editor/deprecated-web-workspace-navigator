import { Injectable } from '@angular/core';

import { ElementType, WorkspaceElement } from '@testeditor/workspace-navigator';

@Injectable()
export class PersistenceServiceMock {

  readonly data: WorkspaceElement = {
    name: "root",
    path: "",
    type: ElementType.Folder,
    children: [
      {
        name: "hello.tsl",
        path: "hello.tsl",
        type: ElementType.File,
        children: []
      },
      {
        name: "world.tsl",
        path: "world.tsl",
        type: ElementType.File,
        children: []
      },
      {
        name: "com",
        path: "com",
        type: ElementType.Folder,
        children: [
          {
            name: "example",
            path: "com/example",
            type: ElementType.Folder,
            children: [
              {
                name: "test.tsl",
                path: "com/example/test.tsl",
                type: ElementType.File,
                children: []
              }
            ]
          }
        ]
      }
    ]
  }

  listFiles(onResponse: (workspaceElement: WorkspaceElement) => void, onError?: (error: any) => void) {
    onResponse(this.data);
  }

  createResource(path: string, type: string, onResonse: (some: any) => void, onError?: (error: any) => void): void {
    onError('not supported by mock');
  }

  deleteResource(path: string, onResponse: (some: any) => void, onError?: (error: any) => void): void {
    onError('not supported by mock');
  }

}
