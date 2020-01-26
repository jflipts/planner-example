import {
    TravelMode,
    Catalog,
    CustomPlanner,
    ProfileTree,
} from "plannerjs";

export default function getPlanner(multilevel, tree) {

    let planner;

    if (!multilevel && !tree) {
        // One level
        const catalogNmbsTiledOneLevel = new Catalog();
        catalogNmbsTiledOneLevel.addStopsSource("https://irail.be/stations/NMBS");
        catalogNmbsTiledOneLevel.addConnectionsSource("http://localhost:3000/nmbs-tiled-onelevel-2h/connections/12/{x}/{y}",
            TravelMode.Train);
        catalogNmbsTiledOneLevel
            .addAvailablePublicTransportTilesSource("http://localhost:3000/nmbs-tiled-onelevel-2h/tiles", 12);

        planner = new CustomPlanner(catalogNmbsTiledOneLevel);

    } else if (!multilevel && tree) {
        // One level tree
        const catalogNmbsTiledOneLevelTree = new Catalog();
        catalogNmbsTiledOneLevelTree.addStopsSource("https://irail.be/stations/NMBS");
        catalogNmbsTiledOneLevelTree.addConnectionsSource("http://localhost:3000/nmbs-tiled-onelevel-tree-2h/connections/{zoom}/{x}/{y}",
            TravelMode.Train);
        catalogNmbsTiledOneLevelTree
            .addAvailablePublicTransportTilesSource("http://localhost:3000/nmbs-tiled-onelevel-tree-2h/connections");

        planner = new CustomPlanner(catalogNmbsTiledOneLevelTree, ProfileTree);

    } else if (multilevel && !tree) {
        // Multi level
        const catalogNmbsTiledMultiLevel = new Catalog();
        catalogNmbsTiledMultiLevel.addStopsSource("https://irail.be/stations/NMBS");
        catalogNmbsTiledMultiLevel.addConnectionsSource("http://localhost:3000/nmbs-tiled-multilevel-2h/connections/{zoom}/{x}/{y}",
            TravelMode.Train);
        catalogNmbsTiledMultiLevel
            .addAvailablePublicTransportTilesSource("http://localhost:3000/nmbs-tiled-multilevel-2h/tiles");

        planner = new CustomPlanner(catalogNmbsTiledMultiLevel);
    } else {
        // Multi level tree
        const catalogNmbsTiledMultiLevelTree = new Catalog();
        catalogNmbsTiledMultiLevelTree.addStopsSource("https://irail.be/stations/NMBS");
        catalogNmbsTiledMultiLevelTree.addConnectionsSource("http://localhost:3000/nmbs-tiled-multilevel-tree-2h/connections/{zoom}/{x}/{y}",
            TravelMode.Train);
        catalogNmbsTiledMultiLevelTree
            .addAvailablePublicTransportTilesSource("http://localhost:3000/nmbs-tiled-multilevel-tree-2h/connections");

        planner = new CustomPlanner(catalogNmbsTiledMultiLevelTree, ProfileTree);
    }

    return planner;

}


