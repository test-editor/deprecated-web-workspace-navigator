import { Injectable } from '@angular/core';
import { WorkspaceElement } from '@testeditor/workspace-navigator';

@Injectable()
export class PersistenceServiceMock {

  readonly data: WorkspaceElement = {
    name: "root",
    path: "",
    type: "folder",
    children: [
      {
        name: "hello.tsl",
        path: "hello.tsl",
        type: "file",
        children: []
      },
      {
        name: "world.tsl",
        path: "world.tsl",
        type: "file",
        children: []
      },
      {
        name: "com",
        path: "com",
        type: "folder",
        children: [
          {
            name: "example",
            path: "com/example",
            type: "folder",
            children: [
              {
                name: "test.tsl",
                path: "com/example/test.tsl",
                type: "file",
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

}
