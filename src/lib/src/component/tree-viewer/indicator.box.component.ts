import { Component, OnInit, Input } from '@angular/core';
import { Workspace } from '../../common/workspace';
import { MarkerState } from '../../common/markers/marker.state';

@Component({
  selector: 'indicator-box',
  templateUrl: './indicator.box.component.html',
  styleUrls: ['./indicator.box.component.css']
})
export class IndicatorBoxComponent {
  @Input() model: { workspace: Workspace, path: string, possibleStates: MarkerState[] };

  get cssClasses(): string {
    if (this.isInitialized()) {
      const activeState = this.model.possibleStates.find((state) => state.condition(this.getMarkers()));
      if (activeState != null) {
        return activeState.cssClasses;
      }
    }
    return '';
  }

  get label(): string {
    if (this.isInitialized()) {
      const activeState = this.model.possibleStates.find((state) => state.condition(this.getMarkers()));
      if (activeState) {
        return activeState.label(this.getMarkers());
      }
    } else {
      return '';
    }
  }

  private getMarkers(): any {
    return this.model.workspace.getMarkers(this.model.path);
  }

  private isInitialized(): boolean {
    return this.model != null && this.model.path != null && this.model.possibleStates != null && this.model.workspace != null;
  }

}