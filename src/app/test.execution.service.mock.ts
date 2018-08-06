import { Injectable } from '@angular/core';
import { ElementState } from './modules/common/element-state';

@Injectable()
export class TestExecutionServiceMock {
  private readonly statusMap = new Map<string, string>();

  execute(path: string): Promise<string> {
    console.log(`Received execute(path: '${path}')`);
    this.statusMap[path] = 'RUNNING';
    return Promise.resolve('');
  }

  status(path: string): Promise<string> {
    console.log(`Received status(path: '${path}')`);
    let timeout: number;
    if (this.statusMap[path] === 'RUNNING') {
      let self = this;
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve('RUNNING');
        }, 5000);
        self.statusMap[path] = Math.random() < 0.5 ? 'SUCCESS' : 'FAILED';
        console.log(`Test '${path}' will complete with status '${self.statusMap[path]}'`);
      });
    } else {
      return Promise.resolve(this.statusMap[path]);
    }
  }

  statusAll(): Promise<Map<string, ElementState>> {
    return Promise.resolve(new Map<string, ElementState>([]));
  }

}
