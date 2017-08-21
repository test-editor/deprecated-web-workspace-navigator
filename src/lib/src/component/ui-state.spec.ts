import { UiState } from './ui-state';

describe('UI State', () => {

  const examplePath = 'example.txt';
  let state: UiState;

  beforeEach(() => {
    state = new UiState();
  });

  it('should be non-dirty by default', () => {
    // then
    expect(state.isDirty(examplePath)).toBeFalsy();
  });

  it('should be dirty when set', () => {
    // when
    state.setDirty(examplePath, true);

    // then
    expect(state.isDirty(examplePath)).toBeTruthy();
  });

  it('should be non-dirty when reset', () => {
    // when
    state.setDirty(examplePath, true);
    state.setDirty(examplePath, false);

    // then
    expect(state.isDirty(examplePath)).toBeFalsy();
  })

});
