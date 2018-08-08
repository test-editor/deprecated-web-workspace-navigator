import { TestBed, async } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { WorkspaceNavigatorModule } from './modules/workspace.navigator.module';
import { testEditorIndicatorFieldSetup } from './modules/component/navigation/navigation.component.test.setup';
import { MessagingModule } from '@testeditor/messaging-service';
describe('AppComponent', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        MessagingModule.forRoot(),
        WorkspaceNavigatorModule.forRoot({
          persistenceServiceUrl: 'http://localhost:9080',
        }, testEditorIndicatorFieldSetup)],
      declarations: [
        AppComponent
      ],
    }).compileComponents();
  }));
  it('should create the app', async(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  }));
});
