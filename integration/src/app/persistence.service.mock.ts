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

  listFiles(): Promise<WorkspaceElement> {
    return Promise.resolve(this.data);
  }

  createDocument(path: string, type: string): Promise<string> {
    console.log(`Received createDocument(path: '${path}', type: '${type}')`);
    return Promise.reject("not supported by mock");
  }

  deleteResource(path: string): Promise<Response> {
    console.log(`Received deleteResource(path: '${path}')`);
    return Promise.reject("not supported by mock");
  }

}
