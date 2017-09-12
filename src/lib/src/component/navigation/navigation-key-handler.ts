import { UiState } from '../ui-state';
import { ElementType } from '../../common/element-type';

export class NavigationKeyHandler {

  constructor(private uiState: UiState) {
  }

  handleKeyboardEvent(event: KeyboardEvent): void {
    let key = event.key;
    let selectedElement = this.uiState.selectedElement;
    if (selectedElement) {
      if (selectedElement.type === ElementType.Folder) {
        if (key === 'ArrowRight') {
          this.uiState.setExpanded(selectedElement.path, true);
        } else if (key === 'ArrowLeft') {
          this.uiState.setExpanded(selectedElement.path, false);
        }
      }
    }
  }

}
