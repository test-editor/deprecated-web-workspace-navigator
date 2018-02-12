import { Component, OnInit, Input } from '@angular/core';
import { Workspace } from '../../common/workspace';
import { MarkerState } from '../../common/markers/marker.state';

@Component({
  selector: 'indicator-box',
  templateUrl: './indicator.box.component.html',
  styleUrls: ['./indicator.box.component.css']
})
export class IndicatorBoxComponent {
  @Input() model: { workspace: Workspace, path: string, states: MarkerState[] };

  get cssClasses(): string {
    if (this.isInitialized()) {
      const activeState = this.model.states.find((state) => state.condition(this.getMarker()));
      if (activeState != null) {
        return activeState.cssClasses;
      }
    }
    return '';
  }

  get label(): string {
    if (this.isInitialized()) {
      const activeState = this.model.states.find((state) => state.condition(this.getMarker()));
      if (activeState) {
        return activeState.label(this.getMarker());
      }
    } else {
      return '';
    }
  }

  private getMarker(): any {
    return this.model.workspace.getMarker(this.model.path);
  }

  private isInitialized(): boolean {
    return this.model != null && this.model.path != null && this.model.states != null && this.model.workspace != null;
  }

}
