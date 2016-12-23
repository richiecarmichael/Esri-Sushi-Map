/* -----------------------------------------------------------------------------------
    Copyright 2016 Esri

    Licensed under the Apache License, Version 2.0 (the 'License');
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an 'AS IS' BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
----------------------------------------------------------------------------------- */

require([
    'esri/map',
    'esri/TimeExtent',
    'esri/layers/MosaicRule',
    'esri/layers/RasterFunction',
    'esri/layers/DimensionalDefinition',
    'esri/layers/RasterLayer',
    'esri/layers/ArcGISTiledMapServiceLayer',
    'dojo/domReady!'
],
function (
    Map,
    TimeExtent,
    MosaicRule, 
    RasterFunction,
    DimensionalDefinition,
    RasterLayer,
    ArcGISTiledMapServiceLayer
    ) {
    $(document).ready(function () {
        // Enforce strict mode
        'use strict';

        // Application constants
        var BASEMAP = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer';
        var SUSHI = 'https://maps2.esri.com/apl1/rest/services/rc/HYCOM_Sushi_cached/ImageServer';
        var BLUEFIN_FXN = 'habitat_suitability_bluefin';
        var MAHI_FXN = 'habitat_suitability_mahi';
        var YELLOWFIN_FXN = 'habitat_suitability_yellowfin';
        var BLUEFIN = [2, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
        var MAHI = [2, 6, 10, 20, 30, 40, 50, 60, 70, 80, 90];
        var YELLOWFIN = [2, 20, 40, 60, 80, 100, 125, 150, 200, 250];
        var LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        var DATES = [
            1397520000000,
            1400112000000,
            1402790400000,
            1405382400000,
            1408060800000,
            1410739200000,
            1413331200000,
            1416009600000,
            1418601600000,
            1421280000000,
            1423958400000,
            1426291200000
        ];

        // Create the image service layer
        var _rasterLayer = RasterLayer(SUSHI, {
            pixelFilter: function (pixelData) {
                if (pixelData == null || pixelData.pixelBlock == null) {
                    return;
                }

                var px = pixelData.pixelBlock.pixels[0];
                var pr = new Uint8Array(px.length);
                var pg = new Uint8Array(px.length);
                var pb = new Uint8Array(px.length);
                var pa = new Uint8Array(px.length);
                for (var i = 0; i < pixelData.pixelBlock.width * pixelData.pixelBlock.height; i++) {
                    var v = px[i]
                    if (v === 0 || v === pixelData.pixelBlock.statistics[0].noDataValue) {
                        pa[i] = 0;
                    }
                    else{
                        v = Math.min(v, 1);
                        v = Math.max(v, 0);
                        pr[i] = 34 + v * (255 - 34);
                        pg[i] = 35;
                        pb[i] = 39;
                        pa[i] = 1;
                    }
                }
                pixelData.pixelBlock.mask = pa;
                pixelData.pixelBlock.pixels = [pr, pg, pb];
                pixelData.pixelBlock.statistics = null;
                pixelData.pixelBlock.pixelType = 'U8';
                return pixelData;
            }
        });
        
        // Create the map and add the image service layer
        var _map = new Map('map', {
            zoom: 3,
            center: [0, 0],
            logo: true,
            showAttribution: false,
            slider: true,
            wrapAround180: true
        });
        _map.addLayers([
            new ArcGISTiledMapServiceLayer(BASEMAP)
        ]);
        _map.on('load', function () {
            updateImageServiceLayer();
            _map.addLayers([
                _rasterLayer
            ]);
        });
        
        // Toggle panel visiblity whenever the user clicks a fish button
        $('.rc-fish-button').click(function () {
            $(this).siblings().removeClass('active');
            $(this).addClass('active');
            var panel = '#' + this.id.replace('button-', 'panel-');
            $(panel).siblings('.rc-panel').hide();
            $(panel).slideDown();

            updateImageServiceLayer();
        });

        // Show the bluefin panel
        $('#panel-bluefin').slideDown();

        // Bluefin date slider
        $('#slider-bluefin1').slider({
            id: 'slider-bluefin1-internal',
            min: 0,
            max: LABELS.length - 1,
            range: false,
            tooltip: 'hide',
            formatter: function (value) {
                return LABELS[value];
            }
        }).on('change', function (e) {
            $('#slider-bluefin1-value').html(LABELS[e.value.newValue]);
        }).on('slideStop', function () {
            updateImageServiceLayer();
        });

        // Mahi date slider
        $('#slider-mahi1').slider({
            id: 'slider-mahi1-internal',
            min: 0,
            max: LABELS.length - 1,
            range: false,
            tooltip: 'hide',
            formatter: function (value) {
                return LABELS[value];
            }
        }).on('change', function (e) {
            $('#slider-mahi1-value').html(LABELS[e.value.newValue]);
        }).on('slideStop', function () {
            updateImageServiceLayer();
        });

        // Yellowfin date slider
        $('#slider-yellowfin1').slider({
            id: 'slider-yellowfin1-internal',
            min: 0,
            max: LABELS.length - 1,
            range: false,
            tooltip: 'hide',
            formatter: function (value) {
                return LABELS[value];
            }
        }).on('change', function (e) {
            $('#slider-yellowfin1-value').html(LABELS[e.value.newValue]);
        }).on('slideStop', function () {
            updateImageServiceLayer();
        });

        // Bluefin depth slider
        $('#slider-bluefin2').slider({
            id: 'slider-bluefin2-internal',
            min: 0,
            max: BLUEFIN.length - 1,
            range: false,
            tooltip: 'hide',
            formatter: function (value) {
                return BLUEFIN[value];
            }
        }).on('change', function (e) {
            $('#slider-bluefin2-value').html(BLUEFIN[e.value.newValue]);
        }).on('slideStop', function () {
            updateImageServiceLayer();
        });

        // Mahi depth slider
        $('#slider-mahi2').slider({
            id: 'slider-mahi2-internal',
            min: 0,
            max: MAHI.length - 1,
            range: false,
            tooltip: 'hide',
            formatter: function (value) {
                return MAHI[value];
            }
        }).on('change', function (e) {
            $('#slider-mahi2-value').html(MAHI[e.value.newValue]);
        }).on('slideStop', function () {
            updateImageServiceLayer();
        });

        // Yellowfin depth slider
        $('#slider-yellowfin2').slider({
            id: 'slider-yellowfin2-internal',
            min: 0,
            max: YELLOWFIN.length - 1,
            range: false,
            tooltip: 'hide',
            formatter: function (value) {
                return YELLOWFIN[value];
            }
        }).on('change', function (e) {
            $('#slider-yellowfin2-value').html(YELLOWFIN[e.value.newValue]);
        }).on('slideStop', function () {
            updateImageServiceLayer();
        });

        // Initialize all sliders
        $('#slider-bluefin1, #slider-mahi1, #slider-yellowfin1, #slider-bluefin2, #slider-mahi2, #slider-yellowfin2').slider('setValue', 0);

        // Update the image service layer and map time
        function updateImageServiceLayer() {
            // Retrieve settings from UI
            var rf = null;
            var time = null;
            var depth = null;

            if ($('#button-bluefin').hasClass('active')) {
                rf = BLUEFIN_FXN;
                time = DATES[$('#slider-bluefin1').slider('getValue')]
                depth = -1 * BLUEFIN[$('#slider-bluefin2').slider('getValue')];
            }
            if ($('#button-mahi').hasClass('active')) {
                rf = MAHI_FXN;
                time = DATES[$('#slider-mahi1').slider('getValue')]
                depth = -1 * MAHI[$('#slider-mahi2').slider('getValue')];
            }
            if ($('#button-yellowfin').hasClass('active')) {
                rf = YELLOWFIN_FXN;
                time = DATES[$('#slider-yellowfin1').slider('getValue')]
                depth = -1 * YELLOWFIN[$('#slider-yellowfin2').slider('getValue')];
            }

            _rasterLayer.setMosaicRule(new MosaicRule({
                mosaicMethod: 'esriMosaicAttribute',
                sortField: 'StdTime',
                sortValue: '0',
                ascending: true,
                mosaicOperation: 'MT_FIRST',
                multidimensionalDefinition: [
                    new DimensionalDefinition({
                        variableName: 'depth',
                        dimensionName: 'StdZ',
                        values: [depth],
                        isSlice: true
                    }),
                    new DimensionalDefinition({
                        variableName: 'salinity',
                        dimensionName: 'StdZ',
                        values: [depth],
                        isSlice: true
                    }),
                    new DimensionalDefinition({
                        variableName: 'water_temp',
                        dimensionName: 'StdZ',
                        values: [depth],
                        isSlice: true
                    })
                ]
            }), true);
            _rasterLayer.setRenderingRule(new RasterFunction({
                rasterFunction: rf
            }), true);
            var te = new TimeExtent(
                new Date(time),
                new Date(time)
            );
            _rasterLayer._params.time = te.toJson().join(',');
            _rasterLayer.refresh();
        }
    });
});

