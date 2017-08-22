import { browser, element, by } from 'protractor';

describe('Workspace Navigator tests', function () {

  beforeEach(() => browser.get(''));

  afterEach(() => {
    browser.manage().logs().get('browser').then((browserLog: any[]) => {
      expect(browserLog).toEqual([]);
    });
  });

  it('should display the navigation component', () => {
    // when
    let navigation = element(by.css('app-navigation'));

    // then
    expect(navigation).toBeTruthy();
  });

});
