import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
// import * as cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader';
import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.log(err));

    //  var config = {
    //     webWorkerPath : './assets/cornerstoneWADOImageLoaderWebWorker.js',
    //     taskConfiguration: {
    //         'decodeTask' : {
    //             codecsPath: './cornerstoneWADOImageLoaderCodecs.js'
    //         }
    //     }
    // };
    // cornerstoneWADOImageLoader.webWorkerManager.initialize(config);