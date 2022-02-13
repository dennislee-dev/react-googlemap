import React, { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import * as turf from "@turf/turf";

import "../styles/Mapbox.css";

mapboxgl.accessToken =
  "pk.eyJ1IjoiYmFuYXRvIiwiYSI6ImNreXczdmJoazA0c2oycW82NDFwdDNiOG8ifQ.Xi6SHeAEQTjP62JV1yz4jQ";

function Mapbox() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [lng, setLng] = useState(-82.659521999370077); // eslint-disable-line no-unused-vars
  const [lat, setLat] = useState(9.628698847753714); // eslint-disable-line no-unused-vars
  const [zoom, setZoom] = useState(17); // eslint-disable-line no-unused-vars
  const [flag, setFlag] = useState(false); // eslint-disable-line no-unused-vars

  useEffect(() => {
    if (map.current) return;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/satellite-streets-v11",
      center: [lng, lat],
      zoom: zoom,
      scrollZoom: true,
    });

    var grid;

    map.current.on("load", () => {

      const drawGrid = () => {
        const bounds = map.current.getBounds();
        console.log(`re bounds:`, bounds);

        const NE = bounds.getNorthEast();
        const SW = bounds.getSouthWest();

        if (NE.lng - SW.lng > 0.015) {
          if (map.current.getLayer("grid-layer")) {
            map.current.removeLayer("grid-layer");
            map.current.removeLayer("grid-layer-highlighted");
            map.current.removeSource("grid-source");
          }
          return;
        }

        let sLng = SW.lng;
        let sLat = SW.lat;

        sLng = Math.floor(sLng * 100) / 100;
        sLat = Math.floor(sLat * 100) / 100;

        var cellSide = 0.02;
        grid = turf.squareGrid(
          [sLng, sLat, NE.lng + 0.005, NE.lat + 0.005],
          cellSide,
          { units: "kilometers" }
        );
        console.log(`squareGrid - before:`, grid);

        var x1 = [-82.65937215806125, 9.62771659892618];
        var x2 = [-82.66137215806125, 9.62671659892618];

        // Set all features to highlighted == 'No'
        for (let i = 0; i < grid.features.length; i++) {
          grid.features[i].properties.highlighted = "No";
          grid.features[i].properties.id = i;
        //   grid.features[i].properties.master = Math.floor(Math.random() * 3);
          if(grid.features[i].geometry.coordinates[0][3][0] < x1[0] && grid.features[i].geometry.coordinates[0][3][1] < x1[1] && grid.features[i].geometry.coordinates[0][1][0] > x2[0] && grid.features[i].geometry.coordinates[0][1][1] > x2[1]){
            grid.features[i].properties.master = 1;
          } else {
            grid.features[i].properties.master = 2;
          }
        }
        console.log(`squareGrid - after:`, grid);

        if (map.current.getLayer("grid-layer")) {
          map.current.removeLayer("grid-layer");
          map.current.removeLayer("grid-layer-highlighted");
          map.current.removeSource("grid-source");
        }

        map.current.addSource("grid-source", {
          type: "geojson",
          data: grid,
          generateId: true,
        });
        map.current.addLayer({
          id: "grid-layer",
          type: "fill",
          source: "grid-source",
          paint: {
            "fill-outline-color": "rgb(2,210,23)",
            "fill-color": "rgba(0,0,0,0.1)",
          },
        });
        map.current.addLayer({
          id: "grid-layer-highlighted",
          type: "fill",
          source: "grid-source",
          paint: {
            "fill-outline-color": "#484896",
            "fill-color": "#6e599f",
            "fill-opacity": 0.3,
          },
          //'filter': ['==', ['get', 'highlighted'], 'Yes']
          filter: ["==", ["get", "id"], -1],
        });
      };

      drawGrid();

      //click action
      map.current.on("click", "grid-layer", function (e) {
        var selectIndex = e.features[0].id;
        var selectMaster = e.features[0].properties.master;
        grid.features[e.features[0].id].properties.highlighted = "Yes";
        // console.log(
        //   `highlighted before:`,
        //   e.features[0].properties.highlighted
        // );
        // e.features[0].properties.highlighted = "Yes";
        // console.log(`feature:`, e.features[0]);
        // console.log(`selectIndex:`, selectIndex);
        // console.log(`highlighted after:`, e.features[0].properties.highlighted);
        const filter = ["==", ["number", ["get", "id"]], selectIndex];
        map.current.setFilter("grid-layer-highlighted", filter);
        const fil = ["==", ["number", ["get", "master"]], selectMaster];
        map.current.setFilter("grid-layer-highlighted", fil);
        var count = 0;
        for (let i = 0; i < grid.features.length; i++) {
          grid.features[i].properties.highlighted = "No";
          if (grid.features[i].properties.master == selectMaster) {
            count++;
          }
        }
        alert("Size : " + count + " , master : " + selectMaster);

        // drawGrid();
      });

    //   map.current.on("moveend", function (e) {
        // drawGrid();
        // console.log('<<<<<');
    //   });
    });

    // Clean up on unmount
    return () => map.current.remove();
  });

  return (
    <div>
      <div className="sidebar">
        Longitude: {lng} | Latitude: {lat} | Zoom: {zoom} | click :{" "}
        {flag == true}
      </div>
      <div ref={mapContainer} className="map-container" />
    </div>
  );
}

export default Mapbox;
