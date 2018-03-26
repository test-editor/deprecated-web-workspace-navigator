export const EDITOR_ACTIVE = 'editor.active';
export const EDITOR_CLOSE = 'editor.close';
export const EDITOR_DIRTY_CHANGED = 'editor.dirtyStateChanged';
export const NAVIGATION_DELETED = 'navigation.deleted';
export const NAVIGATION_CREATED = 'navigation.created';
export const NAVIGATION_OPEN = 'navigation.open';
export const NAVIGATION_SELECT = 'navigation.select';
export const WORKSPACE_MARKER_UPDATE = 'workspace.marker.update';
export const WORKSPACE_MARKER_OBSERVE = 'workspace.marker.observe';
export const WORKSPACE_OBSERVE = 'workspace.observe';
export const WORKSPACE_RELOAD_REQUEST = 'workspace.reload.request';
export const WORKSPACE_RELOAD_RESPONSE = 'workspace.reload.response';

// request execution of a test case,
// payload is the absolute path of the respective tcl
export const TEST_EXECUTE_REQUEST = 'test.execute.request';
// test execution was successfully started and is/should be running,
// payload is { response: Response, path: string, message: string }
export const TEST_EXECUTION_STARTED = 'test.execution.started';
// test execution could not be started,
// payload { path: string, reason: any, message: string }
export const TEST_EXECUTION_START_FAILED = 'test.execution.start.failed';
