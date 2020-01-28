import { Feature, Layer } from "react-mapbox-gl";
import React, { Component } from "react";

class TileLayer extends Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  render() {
    const { tiles, color, opacity} = this.props;
    return (
      <React.Fragment>
        {(tiles && tiles.length > 0)
          ? tiles
            .filter((c) => c.zoom >= 7)
            .map((c, index) => (
              <Layer
                key={index}
                type="fill"
                paint={{
                  "fill-color": color, //blue
                  "fill-opacity": opacity ? opacity : 0.5,
                  "fill-outline-color": color,//"#005eab",
                }}
              >
                <Feature coordinates={this.getBBox(c.x, c.y, c.zoom)} />
              </Layer>
            ))
          : null}
      </React.Fragment>
    );
  }

  tileToLon(tileX, zoom) {
    return (tileX / Math.pow(2, zoom) * 360 - 180);
  }

  tileToLat(tileY, zoom) {
    const n = Math.PI - 2 * Math.PI * tileY / Math.pow(2, zoom);
    return (180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))));
  }


  getBBox(tileX, tileY, zoom) {
    const lat1 = this.tileToLat(tileY, zoom);
    const lat2 = this.tileToLat(tileY + 1, zoom);
    const lon1 = this.tileToLon(tileX, zoom);
    const lon2 = this.tileToLon(tileX + 1, zoom);

    return [[
      [lon1, lat1], // TL
      [lon2, lat1], // TR
      [lon2, lat2], // BR
      [lon1, lat2], // BL
    ]];
  }
}

export default TileLayer;
