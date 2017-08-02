# web-workspace-navigator

[![NPM version][npm-image]][npm-url]
[![Build Status][travis-image]][travis-url]

[npm-image]: https://badge.fury.io/js/%40testeditor%2Fworkspace-navigator.svg
[npm-url]: https://www.npmjs.com/package/@testeditor/workspace-navigator
[travis-image]: https://travis-ci.org/test-editor/web-workspace-navigator.svg?branch=master
[travis-url]: https://travis-ci.org/test-editor/web-workspace-navigator

Angular component and Dropwizard service for workspace handling and navigation.

## Build

    yarn install
    npm run build

## Development

For developing the library run

    npm run start

Initial setup was taken from https://github.com/filipesilva/angular-quickstart-lib @ [c687d9a](https://github.com/filipesilva/angular-quickstart-lib/commit/c687d9a3c00c8db5c290f0dfb243172f8dbfdf40) which is currently work-in-progress
so be part of the official Angular code base (see angular PR [#16486](https://github.com/angular/angular/pull/16486) ).

### Release process

In order to create a release, the version needs to be increased and tagged. This is done easily using `npm version`, for example:

```
npm version minor
```

After the commit and tag is pushed Travis will automatically deploy the tagged version.

### Gotchas

When adding or using a new Angular dependency it must be added in the rollup configuration in the `build.js` so that it's not included in the output bundle.