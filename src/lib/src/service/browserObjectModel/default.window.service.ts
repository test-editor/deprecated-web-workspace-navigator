import { Injectable } from '@angular/core';
import { WindowService } from './window.service';

/**
 * Wraps around the window object to avoid using a global,
 * platform-specific object throughout the code.
 */
@Injectable()
export class DefaultWindowService implements WindowService {
  private readonly windowRef = window;

  open(url: URL): void {
    this.windowRef.open(url.toString());
  }

}
