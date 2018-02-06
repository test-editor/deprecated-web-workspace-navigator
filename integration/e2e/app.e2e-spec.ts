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

  it('should know about font awesome icons', () => {
    // when (not in aot test, since index-aot.html there is no css included as in index.html)
    let heightPromise = browser.executeScript(
      'var result = 1; \
       if (window.module != "aot") { \
         result = parseInt(window.getComputedStyle(document.getElementById("new-file", null)).getPropertyValue("height"), 10); \
       } \
       return result;'
    )

    // then
    heightPromise.then((height) => {
      console.log("found icon to be of height " + height);
      expect(height).toBeGreaterThan(0); // is 0 if the font is not found!
    });
  });

});
