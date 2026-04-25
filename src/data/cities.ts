import type { CityShortcut } from "../types/geography";

export const cityShortcuts: readonly CityShortcut[] = [
  {
    id: "italy",
    name: "Italy",
    center: [12.5674, 42.5],
    zoom: 5.2,
    pitch: 48,
    bearing: -8
  },
  {
    id: "roma",
    name: "Roma",
    center: [12.4964, 41.9028],
    zoom: 10.7,
    pitch: 56,
    bearing: -14
  },
  {
    id: "milano",
    name: "Milano",
    center: [9.19, 45.4642],
    zoom: 10.8,
    pitch: 56,
    bearing: -10
  },
  {
    id: "napoli",
    name: "Napoli",
    center: [14.2681, 40.8518],
    zoom: 11,
    pitch: 55,
    bearing: -12
  },
  {
    id: "torino",
    name: "Torino",
    center: [7.6869, 45.0703],
    zoom: 10.7,
    pitch: 55,
    bearing: -10
  },
  {
    id: "bologna",
    name: "Bologna",
    center: [11.3426, 44.4949],
    zoom: 11,
    pitch: 55,
    bearing: -10
  },
  {
    id: "firenze",
    name: "Firenze",
    center: [11.2558, 43.7696],
    zoom: 11,
    pitch: 55,
    bearing: -10
  }
];
