import { Feature, Layer } from "react-mapbox-gl";
import React, { Component } from "react";

class TileLayer extends Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  render() {
    const { tiles, color, opacity } = this.props;
    if (tiles && tiles.length > 0) {
      const tileboundaries = tiles
        .filter((c) => c.zoom >= 0)
        .map((c) => (
          this.getBBox(c.x, c.y, c.zoom)
        ))

      if (tileboundaries.length === 0) {
        return null;
      }

      return (
        <React.Fragment>
          <Layer
            key={color}
            type="fill"
            paint={{
              "fill-color": color,
              "fill-opacity": opacity ? opacity : 0.5,
              "fill-outline-color": color,
            }}
          >
            <Feature coordinates={tileboundaries} />
          </Layer>
        </React.Fragment>
      )
    } else {
      return null;
    }
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
