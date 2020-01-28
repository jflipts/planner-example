import {
  EventBus,
  EventType,
  Units,
  DelijnNmbsPlanner,
} from "plannerjs";
import getPlanner from "../PlannerMap/PlannerConfigurations"
import React, { Component } from "react";

import { Box } from "@material-ui/core";
import LogButton from "../LogButton/LogButton";
import LogModal from "../LogModal/LogModal";
import LogSummary from "../LogSummary/LogSummary";
import PointMarkerLayer from "../MapLayers/PointMarkerLayer";
import TileLayer from "../MapLayers/TileLayer";
import ReactMapboxGl from "react-mapbox-gl";
import ResetButton from "../ResetButton/ResetButton";
import ReloadButton from "../ReloadButton/ReloadButton";
import ResultBox from "../ResultBox/ResultBox";
import RouteLayer from "../MapLayers/RouteLayer";
import SettingsBox from "../SettingsBox/SettingsBox";
import StationMarkerLayer from "../MapLayers/StationMarkerLayer";

const Map = ReactMapboxGl({
  accessToken:
    "pk.eyJ1Ijoic3VzaGlsZ2hhbWJpciIsImEiOiJjazUyZmNvcWExM2ZrM2VwN2I5amVkYnF5In0.76xcCe3feYPHsDo8eXAguw"
});

class PlannerMap extends Component {
  constructor(props) {
    super(props);

    this.state = {
      // General
      center: [4.5118, 50.6282], //Belgium
      zoom: [8],
      start: null,
      destination: null,

      // State
      calculating: false,
      finished: false,

      // Results
      query: null,
      route: null,
      routeCoords: [],
      scannedConnections: 0,
      routeStations: [],
      stationPopup: null,
      fitBounds: null, // Bounds of the journey leg

      // Logs
      logs: [],
      isLogModalOpen: false,

      // Tiles
      tilesToFetch: [],
      fetchedInternalNodes: [],
      availableTiles: [],

      // Other
      profile: "walking", // Constant
      timeElapsed: 0,

      // Planner config
      tiled: false,
      multilevel: false,
      tree: false,
      fetchStrategy: "straight-line",
    };

    this.trainPlanner = new DelijnNmbsPlanner(); // Default configuration

    this.timer = null;

    EventBus
      .on(EventType.InvalidQuery, error => {
        console.log("InvalidQuery", error);
      })
      .on(EventType.AbortQuery, reason => {
        console.log("AbortQuery", reason);
      })
      .on(EventType.Query, query => {
        console.log("Query", query);
        this.setState({ query });
      })
      .on(EventType.LDFetchGet, (url, duration) => {
        console.log(`[GET] ${url} (${duration}ms)`);
        let { logs, scannedConnections } = this.state;
        this.setState({
          logs: [...logs, { url, duration }],
          scannedConnections: scannedConnections + 1
        });
      })
      .on(EventType.Warning, e => {
        console.warn(e);
      })
      .on(EventType.TilesToFetch, (tiles) => {
        this.setState({ tilesToFetch: [...tiles] })
      })
      .on(EventType.FetchInternalNode, (node) => {
        this.setState(prevState => ({
          fetchedInternalNodes: [...prevState.fetchedInternalNodes, node]
        }))
      })
      .on(EventType.AvailableTiles, (tiles) => {
        this.setState({ availableTiles: [...tiles] })
      })
  }



  calculateRoute = () => {
    const { start, destination } = this.state;
    const { multilevel, tree, tiled, fetchStrategy } = this.state;

    if (start && destination) {
      this.resetRoute();
      this.startTimer();
      this.setState({
        calculating: true
      });

      let planner;
      if (tiled) {
        planner = getPlanner(multilevel, tree);
      } else {
        planner = this.trainPlanner;
      }

      let waiting = false;
      planner
        .setProfileID("https://hdelva.be/profile/pedestrian")
        .query({
          from: { longitude: start.lng, latitude: start.lat },
          to: { longitude: destination.lng, latitude: destination.lat },
          minimumDepartureTime: new Date(2019, 11, 1, 12, 34, 2),
          // walkingSpeed: 3, // KmH
          // minimumWalkingSpeed: 3, // KmH
          // maximumWalkingDistance: 200, // meters
          // minimumTransferDuration: Units.fromMinutes(1),
          maximumTransferDuration: Units.fromMinutes(30),
          tilesFetchStrategy: fetchStrategy,
          // maximumTravelDuration: Units.fromHours(1.5),
          // maximumTransfers: 4
        })
        .take(3)
        .on("data", async path => {
          console.log("this is a path");
          console.log(path);
          waiting = true;
          const completePath = await planner.completePath(path);
          console.log(completePath);
          let routeCoords = [];
          let routeStations = [];
          let westest =
            start.lng < destination.lng ? start.lng : destination.lng;
          let eastest =
            start.lng > destination.lng ? start.lng : destination.lng;
          let northest =
            start.lat > destination.lat ? start.lat : destination.lat;
          let southest =
            start.lat < destination.lat ? start.lat : destination.lat;
          completePath.legs.forEach((leg, index) => {
            let coords = [];
            const lngMin = Math.min(
              ...leg.steps.map(s => s.startLocation.longitude),
              ...leg.steps.map(s => s.stopLocation.longitude)
            );
            const lngMax = Math.max(
              ...leg.steps.map(s => s.startLocation.longitude),
              ...leg.steps.map(s => s.stopLocation.longitude)
            );
            const latMin = Math.min(
              ...leg.steps.map(s => s.startLocation.latitude),
              ...leg.steps.map(s => s.stopLocation.latitude)
            );
            const latMax = Math.max(
              ...leg.steps.map(s => s.startLocation.latitude),
              ...leg.steps.map(s => s.stopLocation.latitude)
            );
            if (lngMin < westest) {
              westest = lngMin;
            }
            if (lngMax > eastest) {
              eastest = lngMax;
            }
            if (latMin < southest) {
              southest = latMin;
            }
            if (latMax > northest) {
              northest = latMax;
            }
            leg.steps.forEach(step => {
              const startCoords = [
                step.startLocation.longitude,
                step.startLocation.latitude
              ];
              const stopCoords = [
                step.stopLocation.longitude,
                step.stopLocation.latitude
              ];
              coords.push(startCoords);
              coords.push(stopCoords);
              if (step.startLocation.name) {
                routeStations.push({
                  coords: startCoords,
                  name: step.startLocation.name
                });
              }
              if (step.stopLocation.name) {
                routeStations.push({
                  coords: stopCoords,
                  name: step.stopLocation.name
                });
              }
            });
            routeCoords.push({
              coords: [...coords],
              travelMode: leg.travelMode
            });
          });
          this.setState({
            route: completePath,
            routeCoords,
            fitBounds: [
              [westest, northest],
              [eastest, southest]
            ],
            routeStations
          });
          waiting = false;
          if (!this.state.calculating) {
            this.setState({ finished: true });
          }
        })
        .on("end", () => {
          console.log("No more paths!");
          this.setState({
            calculating: false,
            isLogModalOpen: false
          });
          if (!waiting) {
            this.setState({ finished: true });
          }
          this.stopTimer();
        })
        .on("error", error => {
          console.error(error);
          this.setState({ calculating: false });
        });
    }
  };

  resetRoute = complete => {
    this.setState({
      calculating: false,
      finished: false,

      query: null,
      route: null,
      routeCoords: [],
      scannedConnections: 0,
      routeStations: [],
      stationPopup: null,
      fitBounds: null,

      tilesToFetch: [],
      fetchedInternalNodes: [],
      availableTiles: [],

      logs: [],
    });
    if (complete) {
      this.setState({
        center: [4.5118, 50.6282],
        zoom: [8],
        start: null,
        destination: null,
      });
    }
  };

  reloadRoute = () => {
    this.resetRoute(false);
    this.calculateRoute();
  }

  startTimer = () => {
    this.timer = new Date();
  };

  stopTimer = () => {
    const millis = new Date() - this.timer;
    this.setState({ timeElapsed: millis });
  };

  onMapClick = (map, e) => {
    const coord = e.lngLat;
    if (!this.state.start) {
      this.setState({ start: coord });
    } else if (!this.state.destination) {
      this.setState({ destination: coord }, () => { this.calculateRoute(); });
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

  showPopup = station => {
    this.setState({ stationPopup: station });
  };

  hidePopup = () => {
    this.setState({ stationPopup: null });
  };

  setFitBounds = fitBounds => {
    this.setState({ fitBounds });
  };

  switchTiled = () => {
    this.setState({ tiled: !this.state.tiled }, () => { this.resetRoute(false); });
  }

  switchMultilevel = () => {
    this.setState({ multilevel: !this.state.multilevel }, () => { this.resetRoute(false); });
  }

  switchTree = () => {
    this.setState(
      {
        tree: !this.state.tree,
        fetchStrategy: this.state.tree ? "straight-line" : "tree",
      },
      () => { this.resetRoute(false); }
    );
  }

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
      query,
      scannedConnections,
      routeStations,
      stationPopup,
      fitBounds,
      profile,
      timeElapsed,
      tiled,
      multilevel,
      tree,
      tilesToFetch,
      fetchedInternalNodes,
      availableTiles,
    } = this.state;
    return (
      <Box boxShadow={2}>
        <ResultBox
          route={route}
          finished={finished}
          setFitBounds={this.setFitBounds}
          profile={profile}
          timeElapsed={timeElapsed}
        ></ResultBox>
        <LogButton
          openLogs={this.openLogModal}
          show={!isLogModalOpen && (calculating || finished)}
        ></LogButton>
        <LogSummary
          show={calculating || finished}
          scannedConnections={scannedConnections}
        ></LogSummary>
        <LogModal
          open={isLogModalOpen}
          onClose={this.closeLogModal}
          calculating={calculating}
          logs={logs}
          query={query}
          response={route}
        ></LogModal>
        <SettingsBox
          tiled={tiled}
          switchTiled={this.switchTiled}
          multilevel={multilevel}
          switchMultilevel={this.switchMultilevel}
          tree={tree}
          switchTree={this.switchTree}
          disabled={calculating}
        ></SettingsBox>
        <ResetButton show={finished} resetRoute={this.resetRoute}></ResetButton>
        <ReloadButton show={!finished} reloadRoute={this.reloadRoute}></ReloadButton>
        <Map
          // eslint-disable-next-line
          style="mapbox://styles/mapbox/streets-v9?optimize=true"
          containerStyle={{
            height: "100vh",
            width: "100vw"
          }}
          center={center}
          zoom={zoom}
          onClick={this.onMapClick}
          fitBounds={fitBounds}
          fitBoundsOptions={{
            padding: { top: 100, right: 150, bottom: 200, left: 470 }
          }}
        >
          <PointMarkerLayer
            startPoint={start}
            destinationPoint={destination}
            startDragEnd={this.startDragEnd}
            destinationDragEnd={this.destinationDragEnd}
            calculating={calculating}
          ></PointMarkerLayer>
          <RouteLayer routeCoords={routeCoords} profile={profile}></RouteLayer>
          <StationMarkerLayer
            routeStations={routeStations}
            showPopup={this.showPopup}
            hidePopup={this.hidePopup}
            stationPopup={stationPopup}
          ></StationMarkerLayer>
          <TileLayer tiles={tilesToFetch} color="#005eab"></TileLayer>
          <TileLayer
          tiles={fetchedInternalNodes}
          color="#FF8C00"
          opacity={0.08}
          ></TileLayer>
          <TileLayer tiles={availableTiles} color="#228B22"></TileLayer>
        </Map>
      </Box>
    );
  }
}

export default PlannerMap;
