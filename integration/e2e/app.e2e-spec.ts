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
         var element = document.getElementById("new-file", null); \
         if (element) { \
           result = parseInt(window.getComputedStyle(element).getPropertyValue("height"), 10); \
         } else { \
           console.log("new-file element was not found on page. (did the application start correctly?)"); \
           result = 0; \
         } \
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
