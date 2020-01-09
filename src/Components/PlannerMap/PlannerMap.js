import { BasicTrainPlanner, EventBus, EventType, Units } from "plannerjs";
import React, { Component } from "react";
import ReactMapboxGl, { Feature, Layer } from "react-mapbox-gl";

import { Box } from "@material-ui/core";
import LogButton from "../LogButton/LogButton";
import LogModal from "../LogModal/LogModal";
import QueryBox from "../QueryBox/QueryBox";
import ResultBox from "../ResultBox/ResultBox";

const Map = ReactMapboxGl({
  accessToken:
    "pk.eyJ1Ijoic3VzaGlsZ2hhbWJpciIsImEiOiJjazUyZmNvcWExM2ZrM2VwN2I5amVkYnF5In0.76xcCe3feYPHsDo8eXAguw"
});

class PlannerMap extends Component {
  constructor(props) {
    super(props);

    this.state = {
      center: [4.5118, 50.6282],
      zoom: [8],
      start: null,
      destination: null,
      routeCoords: [],
      route: null,
      calculating: false,
      finished: false,
      isLogModalOpen: false,
      logs: [],
      query: null
    };
    this.planner = new BasicTrainPlanner();
  }

  calculateRoute = () => {
    const { start, destination } = this.state;
    EventBus.on(EventType.InvalidQuery, error => {
      console.log("InvalidQuery", error);
    })
      .on(EventType.AbortQuery, reason => {
        console.log("AbortQuery", reason);
      })
      .on(EventType.Query, query => {
        console.log("Query", query);
        this.setState({query})
      })
      .on(EventType.LDFetchGet, (url, duration) => {
        console.log(`[GET] ${url} (${duration}ms)`);
        let { logs } = this.state;
        this.setState({
          logs: [...logs, {url, duration}]
        });
      })
      .on(EventType.Warning, e => {
        console.warn(e);
      });
    if (start && destination) {
      this.setState({
        calculating: true,
        finished: false,
        route: null,
        routeCoords: [],
        isLogModalOpen: true,
        logs: [],
        query: null
      });
      this.planner
        .query({
          from: { longitude: start.lng, latitude: start.lat },
          to: { longitude: destination.lng, latitude: destination.lat },
          minimumDepartureTime: new Date(),
          walkingSpeed: 3, // KmH
          minimumWalkingSpeed: 3, // KmH
          maximumWalkingDistance: 200, // meters
          minimumTransferDuration: Units.fromMinutes(1),
          maximumTransferDuration: Units.fromMinutes(30),
          maximumTravelDuration: Units.fromHours(1.5),
          maximumTransfers: 4
        })
        .take(3)
        .on("data", path => {
          console.log("this is a path");
          console.log(path);
          let routeCoords = [];
          path.legs.forEach(leg => {
            leg.steps.forEach(step => {
              routeCoords.push([
                step.startLocation.longitude,
                step.startLocation.latitude
              ]);
              routeCoords.push([
                step.stopLocation.longitude,
                step.stopLocation.latitude
              ]);
            });
          });
          this.setState({ route: path, routeCoords });
        })
        .on("end", () => {
          console.log("No more paths!");
          this.setState({
            calculating: false,
            finished: true,
            isLogModalOpen: false
          });
        })
        .on("error", error => {
          console.error(error);
          this.setState({ calculating: false });
        });
    }
  };

  onMapClick = (map, e) => {
    const coord = e.lngLat;
    if (!this.state.start) {
      this.setState({ start: coord }, () => {
        console.log(this.state);
      });
    } else if (!this.state.destination) {
      this.setState({ destination: coord }, () => {
        this.calculateRoute();
      });
    }
  };

  startDragEnd = e => {
    const newCoord = e.lngLat;
    this.setState({ start: newCoord }, () => {
      this.calculateRoute();
    });
  };

  destinationDragEnd = e => {
    const newCoord = e.lngLat;
    this.setState({ destination: newCoord }, () => {
      this.calculateRoute();
    });
  };

  openLogModal = () => {
    this.setState({ isLogModalOpen: true });
  };

  closeLogModal = () => {
    this.setState({ isLogModalOpen: false });
  };

  render() {
    const {
      center,
      zoom,
      start,
      destination,
      routeCoords,
      route,
      calculating,
      finished,
      isLogModalOpen,
      logs,
      query
    } = this.state;
    return (
      <Box boxShadow={2}>
        <QueryBox></QueryBox>
        <ResultBox
          calculating={calculating}
          route={route}
          finished={finished}
        ></ResultBox>
        <LogButton
          openLogs={this.openLogModal}
          isLogOpen={isLogModalOpen}
        ></LogButton>
        <LogModal
          open={isLogModalOpen}
          onClose={this.closeLogModal}
          calculating={calculating}
          logs={logs}
          query={query}
          response={route}
        ></LogModal>
        <Map
          // eslint-disable-next-line
          style="mapbox://styles/mapbox/streets-v9"
          containerStyle={{
            height: "90vh",
            width: "100vw"
          }}
          center={center}
          zoom={zoom}
          onClick={this.onMapClick}
        >
          {/* Start marker */}
          {start ? (
            <Layer
              type="circle"
              paint={{
                "circle-radius": 7,
                "circle-color": "#3887be"
              }}
            >
              <Feature
                coordinates={[start.lng, start.lat]}
                draggable
                onDragEnd={this.startDragEnd}
              ></Feature>
            </Layer>
          ) : null}
          {/* Destination marker */}
          {destination ? (
            <Layer
              type="circle"
              paint={{
                "circle-radius": 7,
                "circle-color": "#6b7cff"
              }}
            >
              <Feature
                coordinates={[destination.lng, destination.lat]}
                draggable
                onDragEnd={this.destinationDragEnd}
              ></Feature>
            </Layer>
          ) : null}
          <Layer
            type="line"
            layout={{
              "line-cap": "round",
              "line-join": "round"
            }}
            paint={{
              "line-color": "#28A987",
              "line-width": 4
            }}
          >
            <Feature coordinates={routeCoords} />
          </Layer>
        </Map>
      </Box>
    );
  }
}

export default PlannerMap;
