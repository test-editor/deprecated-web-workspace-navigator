export class MarkerState {
  condition: (marker: any) => boolean;
  cssClasses: string;
  label: (marker: any) => string;
}
