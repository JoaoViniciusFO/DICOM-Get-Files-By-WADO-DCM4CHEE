import { OnInit } from '@angular/core';
import * as cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader';
import * as cornerstone from 'cornerstone-core';
import * as $ from 'jquery';
import * as dicomParser from 'dicom-parser';

export class cornerstoneFileImageLoader implements OnInit {
    public multiFrameCacheHack: any;
    public files: any;
    constructor() {
        this.multiFrameCacheHack = {};
        this.files = [];
    }

    public isColorImage(photoMetricInterpretation) {
        if (photoMetricInterpretation === "RGB" ||
            photoMetricInterpretation === "PALETTE COLOR" ||
            photoMetricInterpretation === "YBR_FULL" ||
            photoMetricInterpretation === "YBR_FULL_422" ||
            photoMetricInterpretation === "YBR_PARTIAL_422" ||
            photoMetricInterpretation === "YBR_PARTIAL_420" ||
            photoMetricInterpretation === "YBR_RCT") {
            return true;
        }
        else {
            return false;
        }
    }

    public createImageObject(dataSet, imageId, frame) {
        if (frame === undefined) {
            frame = 0;
        }

        // make the image based on whether it is color or not
        let photometricInterpretation = dataSet.string('x00280004');
        let isColor = this.isColorImage(photometricInterpretation);
        if (isColor === false) {
            return cornerstoneWADOImageLoader.makeGrayscaleImage(imageId, dataSet, dataSet.byteArray, photometricInterpretation, frame);
        } else {
            return cornerstoneWADOImageLoader.makeColorImage(imageId, dataSet, dataSet.byteArray, photometricInterpretation, frame);
        }
    }

    public loadImage(imageId) {
        let self = this;
        let deferred = $.Deferred();

        // build a url by parsing out the url scheme and frame index from the imageId
        let url = imageId;
        url = url.substring(12);
        let frameIndex = url.indexOf('frame=');
        let frame;
        if (frameIndex !== -1) {
            let frameStr = url.substr(frameIndex + 6);
            frame = parseInt(frameStr);
            url = url.substr(0, frameIndex - 1);
        }

        // if multiframe and cached, use the cached data set to extract the frame
        if (frame !== undefined &&
            this.multiFrameCacheHack.hasOwnProperty(url)) {
            let dataSet = this.multiFrameCacheHack[url];
            let imagePromise = this.createImageObject(dataSet, imageId, frame);
            imagePromise.then(function (image) {
                deferred.resolve(image);
            }, function () {
                deferred.reject();
            });
            return deferred;
        }

        let fileIndex = parseInt(url);
        let file = this.getFile(fileIndex);
        if (file === undefined) {
            deferred.reject('unknown file index ' + url);
            return deferred;
        }

        // Read the DICOM Data
        let fileReader = new FileReader();
        fileReader.onloadend = function () {
            // Parse the DICOM File
            let dicomPart10AsArrayBuffer = fileReader.result;
            let byteArray = new Uint8Array(dicomPart10AsArrayBuffer);
            let dataSet = dicomParser.parseDicom(byteArray);

            // if multiframe, cache the parsed data set to speed up subsequent
            // requests for the other frames
            if (frame !== undefined) {
                self.multiFrameCacheHack[url] = dataSet;
            }

            let imagePromise = self.createImageObject(dataSet, imageId, frame);
            imagePromise.then(function (image) {
                deferred.resolve(image);
            }, function () {
                deferred.reject();
            });
        };
        fileReader.readAsArrayBuffer(file);

        return deferred;
    }

    public getFile(index) {
        return this.files[index];
    }

    public addFile(file) {
        let fileIndex = this.files.push(file);
    }

    public purge() {
        this.files = [];
    }

    ngOnInit(){
        
    }
}