import type { RefObject } from "react";

// The SVG chart coordinates are the shared scene's design units. Orthographic
// projection keeps 3D meshes exactly aligned with the accessible SVG links.
export const HERO_VIEW = { width: 860, height: 680 };
export const LAUNCH_POINT = { x: 164, y: 642 };
export type ChartPoint = { x: number; y: number };
export type ChartPoint3D = ChartPoint & { z: number };
export type LaunchAnchorRef = RefObject<(() => ChartPoint3D | null) | null>;
export type SpaceDestination = ChartPoint & {
  id: string;
  r: number;
  featured?: boolean;
  far?: boolean;
};
export type SpaceFlight = {
  p0: ChartPoint3D;
  p1: ChartPoint;
  p2: ChartPoint;
  p3: ChartPoint;
  dest: SpaceDestination;
  progress: number;
};
export type SpaceState = {
  activeId: string | null;
  aim: ChartPoint | null;
  flight: SpaceFlight | null;
};
export type SpaceRef = { current: SpaceState };
export const destinationDepth = (dest: SpaceDestination) => dest.featured ? 25 : dest.far ? -45 : -15;
export const chartToWorld = (point: ChartPoint, depth = 0): [number, number, number] =>
  [point.x - HERO_VIEW.width / 2, HERO_VIEW.height / 2 - point.y, depth];
export const worldToChart = (point: ChartPoint3D, unit: number): ChartPoint3D => ({
  x: point.x / unit + HERO_VIEW.width / 2,
  y: HERO_VIEW.height / 2 - point.y / unit,
  z: point.z / unit,
});
