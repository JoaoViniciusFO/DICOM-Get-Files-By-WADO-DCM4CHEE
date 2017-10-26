import { Component, ElementRef, OnInit, Renderer2, ViewChild } from '@angular/core';
import { Http } from '@angular/http';
import { NgZone } from '@angular/core';
import * as cornerstone from 'cornerstone-core';
import * as cornerstoneTools from 'cornerstone-tools';
import * as cornerstoneMath from 'cornerstone-math';
import * as cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader';
import $ from '../../node_modules/jquery/dist/jquery';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./cornerstone.min.css'],
})
export class AppComponent {
  title = 'app';
  public listEfects: any;
  @ViewChild('someVar') el: ElementRef;
  public itens: any[];
  public dcmFile: any;

  @ViewChild('tool') myTool;
  @ViewChild('action') action;
  constructor(private render: Renderer2, elementRef: ElementRef, private http: Http) {

    this.listEfects = cornerstone.colors.getColormapsList();
    this.itens = [
      { "id": "wwwc", "name": "WW/WC" },
      { "id": "pan", "name": "Pan" },
      { "id": "zoom", "name": "Zoom" },
      { "id": "length", "name": "Length" },
      { "id": "probe", "name": "Probe" },
      { "id": "ellipticalRoi", "name": "Elliptical ROI" },
      { "id": "rectangleRoi", "name": "Rectangle ROI" },
      { "id": "angle", "name": "Angle" },
      { "id": "highlight", "name": "HighLigth" },
      { "id": "freehand", "name": "Freehand" }
    ];
    let config = {
      webWorkerPath: './../assets/cornerstoneWADOImageLoaderWebWorker.js',
      taskConfiguration: {
        'decodeTask': {
          codecsPath: './cornerstoneWADOImageLoaderCodecs.js'
        }
      }
    };
    cornerstoneWADOImageLoader.webWorkerManager.initialize(config);

    this.wadoService();
  }

  public changeEfect(efect) {
    const element = document.getElementById('dicomImage');
    let image = cornerstone.getEnabledElement(element).image;
    image.cachedLut = undefined;
    image.render = undefined;

    let colormap = cornerstone.colors.getColormap(efect);

    cornerstone.convertToFalseColorImage(element, colormap);
    cornerstone.updateImage(element, true);
  }

  public disableAllTools() {
    const element = document.getElementById('dicomImage');
    cornerstoneTools.wwwc.disable(element);
    cornerstoneTools.pan.activate(element, 2);
    cornerstoneTools.zoom.activate(element, 4);
    cornerstoneTools.probe.deactivate(element, 1);
    cornerstoneTools.length.deactivate(element, 1);
    cornerstoneTools.ellipticalRoi.deactivate(element, 1);
    cornerstoneTools.rectangleRoi.deactivate(element, 1);
    cornerstoneTools.angle.deactivate(element, 1);
    cornerstoneTools.highlight.deactivate(element, 1);
    cornerstoneTools.freehand.deactivate(element, 1);
  }

  wadoService() {
    this.http.get("YOUR_WADO_URI/FILE_BYTE_ARRAY")
      .subscribe(
      response => this.getPixelData(response),
      err => console.log(err),
      () => this.startRead()
      )
  }

  getPixelData(base64PixelData) {
    let pixelData = this.str2ab(base64PixelData._body);
    this.dcmFile = pixelData;
  }

  str2ab(str) {
    let buf = new ArrayBuffer(str.length * 2);
    let bufView = new Uint16Array(buf);
    let index = 0;
    for (let i = 0, strLen = str.length; i < strLen; i += 2) {
      let lower = str.charCodeAt(i);
      let upper = str.charCodeAt(i + 1);
      bufView[index] = lower + (upper << 8);
      index++;
    }
    return bufView;
  }

  startRead() {
    let self = this;
    let getExampleImage = (imageId) => {
      let width = 512;
      let height = 512;

      let getPixelData = () => {
        return self.dcmFile;
      }

      console.log(self.dcmFile)
      let image = {
        imageId: imageId,
        minPixelValue: -950,
        maxPixelValue: 670,
        slope: 1.0,
        intercept: 0,
        windowCenter: 127,
        windowWidth: 556,
        getPixelData: getPixelData,
        rows: height,
        columns: width,
        height: height,
        width: width
      };

      let deferred = $.Deferred();
      deferred.resolve(image);
      return deferred;
    }

    cornerstone.registerImageLoader('example', getExampleImage);
    let imageId = 'example://2';
    let element = document.getElementById('dicomImage');
    cornerstone.enable(element);
    cornerstone.loadImage(imageId).then((image) => {
      cornerstone.displayImage(element, image);
      cornerstoneTools.touchInput.enable(element);

      cornerstoneTools.zoomTouchPinch.activate(element);
      cornerstoneTools.wwwcTouchDrag.activate(element);
      cornerstoneTools.panMultiTouch.activate(element);

      cornerstoneTools.mouseInput.enable(element);
      cornerstoneTools.mouseWheelInput.enable(element);
      cornerstoneTools.wwwc.activate(element, 1);
      cornerstoneTools.pan.activate(element, 2);
      cornerstoneTools.zoom.activate(element, 4);
      cornerstoneTools.zoomWheel.activate(element);
      cornerstoneTools.probe.enable(element);
      cornerstoneTools.length.enable(element);
      cornerstoneTools.ellipticalRoi.enable(element);
      cornerstoneTools.rectangleRoi.enable(element);
      cornerstoneTools.angle.enable(element);
      cornerstoneTools.highlight.enable(element);

      let disableAllTools = () => {
        cornerstoneTools.wwwc.disable(element);
        cornerstoneTools.pan.activate(element, 2);
        cornerstoneTools.zoom.activate(element, 4);
        cornerstoneTools.probe.deactivate(element, 1);
        cornerstoneTools.length.deactivate(element, 1);
        cornerstoneTools.ellipticalRoi.deactivate(element, 1);
        cornerstoneTools.rectangleRoi.deactivate(element, 1);
        cornerstoneTools.angle.deactivate(element, 1);
        cornerstoneTools.highlight.deactivate(element, 1);
        cornerstoneTools.freehand.deactivate(element, 1);
      }

      self.render.listen(self.myTool.nativeElement, 'click', (evt) => {
        disableAllTools();
        cornerstoneTools[evt.target.id].activate(element, 1);
      })

      self.render.listen(self.action.nativeElement, 'click', (event) => {
        cornerstoneTools.saveAs(element, event.target.id);
        return false;
      })

      let onViewportUpdated = (e) => {
        let viewport = cornerstone.getViewport(e.target)
      };

      $(element).on("CornerstoneImageRendered", onViewportUpdated);

      let config = {
        minScale: 0.25,
        maxScale: 20.0,
        preventZoomOutsideImage: true
      };

      cornerstoneTools.zoom.setConfiguration(config);

    });
  }

}
