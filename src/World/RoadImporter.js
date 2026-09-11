/**
 * Game FreeWorld - RoadImporter (v5.0)
 * Imports, builds, and manages road networks, street edges, lanes, and intersection junctions
 * from GIS geographic data and integrates them with the game's NavigationGraph.
 */

import * as THREE from 'three';

export class RoadImporter {
  constructor(coordinateTransformer) {
    this.transformer = coordinateTransformer;
  }

  /**
   * Process raw line edges and nodes into a structured road network
   */
  processRoadNetwork(rawNodes, rawEdges) {
    const roadNetwork = {
      nodes: new Map(),
      edges: [],
      intersections: [],
      stats: { totalLengthMeters: 0, intersectionCount: 0, roadCount: 0 }
    };

    // 1. Process Nodes & Intersection Identification
    const nodeConnectionCounts = new Map();

    rawEdges.forEach(edge => {
      const fromCount = (nodeConnectionCounts.get(edge.from) || 0) + 1;
      const toCount = (nodeConnectionCounts.get(edge.to) || 0) + 1;
      nodeConnectionCounts.set(edge.from, fromCount);
      nodeConnectionCounts.set(edge.to, toCount);
    });

    rawNodes.forEach(node => {
      const connections = nodeConnectionCounts.get(node.id) || 0;
      const isIntersection = connections > 2 || (node.tags && (node.tags.highway === 'traffic_signals' || node.tags.highway === 'crossing'));

      const roadNode = {
        id: node.id,
        position: node.position.clone(),
        isIntersection,
        connectionCount: connections,
        tags: node.tags || {}
      };

      roadNetwork.nodes.set(node.id, roadNode);

      if (isIntersection) {
        roadNetwork.intersections.push({
          id: `intersection_${node.id}`,
          nodeId: node.id,
          position: node.position.clone(),
          hasTrafficLight: node.tags && node.tags.highway === 'traffic_signals',
          connectedEdges: []
        });
      }
    });

    // 2. Process Edges & Calculate Road Metrics
    rawEdges.forEach(edge => {
      const fromNode = roadNetwork.nodes.get(edge.from);
      const toNode = roadNetwork.nodes.get(edge.to);

      if (!fromNode || !toNode) return;

      const fromPos = fromNode.position;
      const toPos = toNode.position;
      const length = fromPos.distanceTo(toPos);

      const highwayType = edge.highway || 'secondary';
      const lanes = edge.lanes || this._getDefaultLanes(highwayType);
      const width = lanes * 3.5; // ~3.5m per lane standard width

      const processedEdge = {
        id: edge.id || `road_${fromNode.id}_${toNode.id}`,
        from: fromNode.id,
        to: toNode.id,
        fromPos: fromPos.clone(),
        toPos: toPos.clone(),
        highway: highwayType,
        lanes,
        width,
        length,
        oneWay: edge.oneWay || false,
        speedLimit: this._getSpeedLimit(highwayType),
        isBridge: edge.tags && (edge.tags.bridge === 'yes' || edge.tags.bridge === 'true'),
        isTunnel: edge.tags && (edge.tags.tunnel === 'yes' || edge.tags.tunnel === 'true')
      };

      roadNetwork.edges.push(processedEdge);
      roadNetwork.stats.totalLengthMeters += length;

      // Register edge with intersections
      roadNetwork.intersections.forEach(inters => {
        if (inters.nodeId === edge.from || inters.nodeId === edge.to) {
          inters.connectedEdges.push(processedEdge.id);
        }
      });
    });

    roadNetwork.stats.roadCount = roadNetwork.edges.length;
    roadNetwork.stats.intersectionCount = roadNetwork.intersections.length;

    return roadNetwork;
  }

  /**
   * Populate runtime NavigationGraph from processed road network
   */
  populateNavigationGraph(navGraph, roadNetwork) {
    if (!navGraph) return;

    const nodeMap = new Map();

    roadNetwork.nodes.forEach(node => {
      const roadNode = {
        id: navGraph.roadNodes.length,
        position: node.position.clone(),
        direction: new THREE.Vector3(1, 0, 0),
        connections: [],
        isIntersection: node.isIntersection,
        speedLimit: 18,
        tags: node.tags || {}
      };
      navGraph.roadNodes.push(roadNode);
      nodeMap.set(node.id, roadNode);
    });

    roadNetwork.edges.forEach(edge => {
      const fromNode = nodeMap.get(edge.from);
      const toNode = nodeMap.get(edge.to);
      if (fromNode && toNode) {
        if (!fromNode.connections.includes(toNode)) {
          fromNode.connections.push(toNode);
        }
        if (!edge.oneWay && !toNode.connections.includes(fromNode)) {
          toNode.connections.push(fromNode);
        }
      }
    });
  }

  _getDefaultLanes(highwayType) {
    switch (highwayType) {
      case 'motorway': return 4;
      case 'trunk':
      case 'primary': return 3;
      case 'secondary': return 2;
      case 'tertiary':
      case 'residential': return 2;
      case 'service': return 1;
      default: return 2;
    }
  }

  _getSpeedLimit(highwayType) {
    switch (highwayType) {
      case 'motorway': return 100; // km/h
      case 'primary': return 70;
      case 'secondary': return 50;
      case 'residential': return 30;
      default: return 40;
    }
  }
}
