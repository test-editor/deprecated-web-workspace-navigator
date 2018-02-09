import { Component, OnInit } from '@angular/core';
import { Workspace } from '../../common/workspace';
import { MarkerState } from '../../common/markers/marker.state';

@Component({
  selector: 'indicator-box',
  templateUrl: './indicator.box.component.html',
  styleUrls: ['./indicator.box.component.css']
})
export class IndicatorBoxComponent {
  workspace: Workspace;
  path: string;

  private cssClasses: any = {};
  private labelProviders: {condition: (marker: any) => boolean, label: (marker: any) => string}[];

  public set states(states: MarkerState[]) {
    this.cssClasses = {};
    states.forEach((state) => {
      this.cssClasses[state.cssClasses] = () => state.condition(this.getMarker());
    });
    this.labelProviders = states.map((state) => {
      return {condition: state.condition, label: state.label};
    });
  }


  get label(): string {
    const activeLabel = this.labelProviders.find((provider) => provider.condition(this.getMarker()));
    if (activeLabel) {
      return activeLabel.label(this.getMarker());
    }
  }

  private getMarker(): any {
    return this.workspace.getMarker(this.path);
  }

}
