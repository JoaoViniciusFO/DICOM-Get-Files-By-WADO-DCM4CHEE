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
  public endPoint: string;
  public elmt: any;

  @ViewChild('tool') myTool;
  @ViewChild('dicomImage') myElement;
  @ViewChild('action') action;
  constructor(private render: Renderer2, private elementRef: ElementRef, private http: Http ) {
    this.endPoint = "YOUR_WADO/URI";

    this.elmt = this.elementRef.nativeElement.querySelector('#dicomImage');
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
  }
  
  ngAfterViewInit() {
    this.sout();
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

  public sout(){
    console.log(this.elmt);
    
    let url = "wadouri:" + this.endPoint;
    cornerstoneWADOImageLoader.wadouri.dataSetCacheManager.load(this.endPoint);
    this.getExampleImage(url)
  }

  public getExampleImage(imageId) {
    try {
    let self = this;
    const element = document.getElementById('dicomImage');
    cornerstone.enable(element);
    cornerstone.loadAndCacheImage(imageId).then(function (image) {
      var viewport = cornerstone.getDefaultViewportForImage(element, image);
      cornerstone.displayImage(element, image, viewport);

      cornerstoneTools.touchInput.enable(element);

      // Enable all tools we want to use with this element
      cornerstoneTools.zoomTouchPinch.activate(element);
      //cornerstoneTools.rotateTouch.activate(element);
      cornerstoneTools.wwwcTouchDrag.activate(element);
      cornerstoneTools.panMultiTouch.activate(element);

      cornerstoneTools.mouseInput.enable(element);
      cornerstoneTools.mouseWheelInput.enable(element);
      // Enable all tools we want to use with this element
      cornerstoneTools.wwwc.activate(element, 1); // ww/wc is the default tool for left mouse button
      cornerstoneTools.pan.activate(element, 2); // pan is the default tool for middle mouse button
      cornerstoneTools.zoom.activate(element, 4); // zoom is the default tool for right mouse button
      cornerstoneTools.zoomWheel.activate(element); // zoom is the default tool for middle mouse wheel
      cornerstoneTools.probe.enable(element);
      cornerstoneTools.length.enable(element);
      cornerstoneTools.ellipticalRoi.enable(element);
      cornerstoneTools.rectangleRoi.enable(element);
      cornerstoneTools.angle.enable(element);
      cornerstoneTools.highlight.enable(element);

      function disableAllTools() {
        cornerstoneTools.wwwc.disable(element);
        cornerstoneTools.pan.activate(element, 2); // 2 is middle mouse button
        cornerstoneTools.zoom.activate(element, 4); // 4 is right mouse button
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

      function onViewportUpdated(e) {
        var viewport = cornerstone.getViewport(e.target)
      };

      $(element).on("CornerstoneImageRendered", onViewportUpdated);

      var config = {
        minScale: 0.25,
        maxScale: 20.0,
        preventZoomOutsideImage: true
      };

      cornerstoneTools.zoom.setConfiguration(config);

      $('#chkshadow').on('change', function () {
        cornerstoneTools.length.setConfiguration({ shadow: this.checked });
        cornerstoneTools.angle.setConfiguration({ shadow: this.checked });
        cornerstone.updateImage(element);
      });

    })
    } catch (err) {
      console.log(err)
    }
  }

}
