import { UiState } from './ui-state';

describe('UI State', () => {

  const examplePath = 'example.txt';
  let state: UiState;

  beforeEach(() => {
    state = new UiState();
  });

  it('should be unexpanded by default', () => {
    // then
    expect(state.isExpanded(examplePath)).toBeFalsy();
  });

  it('should be expanded when set', () => {
    // when
    state.setExpanded(examplePath, true);

    // then
    expect(state.isExpanded(examplePath)).toBeTruthy();
  });

  it('should be unexpanded when reset', () => {
    /// given
    state.setExpanded(examplePath, true);

    // when
    state.setExpanded(examplePath, false);

    // then
    expect(state.isExpanded(examplePath)).toBeFalsy();
  });

  it('should toggle expanded state correctly', () => {
    // when + then
    state.toggleExpanded(examplePath); // undefined -> true
    expect(state.isExpanded(examplePath)).toBeTruthy();
    state.toggleExpanded(examplePath); // true -> false
    expect(state.isExpanded(examplePath)).toBeFalsy();
    state.toggleExpanded(examplePath); // false -> true
    expect(state.isExpanded(examplePath)).toBeTruthy();
  });

  it('should clear expanded state correctly', () => {
    // given
    state.setExpanded(examplePath, true);

    // when
    state.clearExpanded();

    // then
    expect(state['expandedElements']).toEqual([]);
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
