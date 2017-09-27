# web-workspace-navigator

[![NPM version][npm-image]][npm-url]
[![Build Status][travis-image]][travis-url]

[npm-image]: https://badge.fury.io/js/%40testeditor%2Fworkspace-navigator.svg
[npm-url]: https://www.npmjs.com/package/@testeditor/workspace-navigator
[travis-image]: https://travis-ci.org/test-editor/web-workspace-navigator.svg?branch=master
[travis-url]: https://travis-ci.org/test-editor/web-workspace-navigator

Angular component and Dropwizard service for workspace handling and navigation.

## Usage

This library requires additionally `@testeditor/messaging-service` and `angular2-jwt` to be present, install with:

    yarn add @testeditor/workspace-navigator @testeditor/messaging-service angular2-jwt

    // or
    
    npm install @testeditor/workspace-navigator @testeditor/messaging-service angular2-jwt --save

Also the outer application must provide a singleton of `MessageService`. Additionally `angular2-jwt` needs to be setup.
In your root module add the following:

    import { HttpModule, Http, RequestOptions } from '@angular/http';
    
    import { MessagingModule } from '@testeditor/messaging-service';
    import { AuthHttp, AuthConfig } from 'angular2-jwt';

    // ...

    export function authHttpServiceFactory(http: Http, options: RequestOptions) {
        return new AuthHttp(new AuthConfig(), http, options);
    }

    @NgModule({
        // ...
        imports: [
            // ...
            HttpModule, // needed by AuthHttp
            MessagingModule.forRoot()
        ],
        providers: [
            { provide: AuthHttp, useFactory: authHttpServiceFactory, deps: [Http, RequestOptions] }
        ]
    })

### Events

An event of type with id `navigation.open` and payload of type `WorkspaceDocument` is thrown when the user double-clicks on a file in the tree viewer.

## Build

    yarn install
    npm run build

## Development

For developing the demo can be run using

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

### Adding a peer library 

Several locations (potentially) need to be touched when adding a peer library that should be provided by the application making use of this component.

Adding `angular2-jwt` for example resulted in the following adjustments:
```
integration/src/systemjs.config.js
  System.config.map: added 'angular2-jwt': 'npm:angular2-jwt/angular2-jwt.js'
integration/package.json
  dependencies: added "angular2-jwt": "^0.2.3"
integration/yarn.lock <-- automatically added through yarn install
integration/build.js
  rollupBaseConfig.plugins.commonjs: added  include: ['node_modules/angular2-jwt/angular2-jwt.js']
  
karma-test-shim.js
  System.config.map: added 'angular2-jwt': 'npm:angular2-jwt/angular2-jwt.js'
karma.conf.js 
  config.set.files: added { pattern: 'node_modules/angular2-jwt/**/*.js', included: false, watched: false }
package.json
  peerDependencies: added "angular2-jwt": "^0.2.3"
  devDependencies: added "angular2-jwt": "^0.2.3"
yarn.lock <-- automatically added through yarn install
build.js
  rollupBaseConfig.globals: added 'angular2-jwt': 'angular2-jwt'
  rollupBaseConfig.external: added 'angular2-jwt'
  
src/demo/systemjs.config.js
  System.config.map: added 'angular2-jwt': 'npm:angular2-jwt/angular2-jwt.js'
```
