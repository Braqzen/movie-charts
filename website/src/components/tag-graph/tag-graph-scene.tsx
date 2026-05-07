import { useEffect, useMemo, useRef } from "react";
import { Billboard, Text } from "@react-three/drei";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as THREE from "three";

import type { TagGraphLayout, TagGraphMovieNode } from "lib/tag-graph-layout";

/** Warm amber tags; selected stays saturated (avoid pale yellow). */
const HUB_TAG_COLOR = "#f59e0b";
const HUB_TAG_COLOR_SELECTED = "#fbbf24";

function DampingOrbitControls() {
  const controlsRef = useRef<OrbitControls | null>(null);
  const { camera, gl } = useThree();

  useEffect(() => {
    const controls = new OrbitControls(camera, gl.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.rotateSpeed = 0.85;
    controls.minDistance = 5;
    controls.maxDistance = 56;
    controlsRef.current = controls;
    return () => controls.dispose();
  }, [camera, gl]);

  useFrame(() => {
    controlsRef.current?.update();
  });

  return null;
}

function buildLinkPositionBuffer(
  layout: TagGraphLayout,
  filter?: (link: TagGraphLinksItem) => boolean,
) {
  const positions: number[] = [];
  const positionsById = new Map<string, THREE.Vector3>();
  for (const h of layout.hubs) positionsById.set(`hub:${h.tag}`, h.position);
  for (const p of layout.movies) positionsById.set(p.id, p.position);

  for (const link of layout.links) {
    if (filter && !filter(link)) continue;
    const a = positionsById.get(link.fromId);
    const b = positionsById.get(link.toId);
    if (!a || !b) continue;
    positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
  }

  if (positions.length === 0) return null;

  const buffer = new Float32Array(positions);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(buffer, 3));
  return geo;
}

type TagGraphLinksItem = { fromId: string; toId: string };

function getHighlightFilter(selected: PickPayload): ((link: TagGraphLinksItem) => boolean) | null {
  if (!selected) return null;
  if (selected.kind === "hub") {
    const hid = `hub:${selected.tag}`;
    return (link: TagGraphLinksItem) => link.toId === hid;
  }
  if (selected.kind === "movie") {
    const mid = selected.node.id;
    return (link: TagGraphLinksItem) => link.fromId === mid;
  }
  return null;
}

function MutedLinks({ geometry }: { geometry: THREE.BufferGeometry }) {
  useEffect(() => {
    return () => geometry.dispose();
  }, [geometry]);

  return (
    <lineSegments geometry={geometry} renderOrder={0}>
      <lineBasicMaterial color="#a1b5c9" opacity={0.125} transparent depthWrite={false} />
    </lineSegments>
  );
}

function HighlightLinks({ geometry }: { geometry: THREE.BufferGeometry }) {
  useEffect(() => {
    return () => geometry.dispose();
  }, [geometry]);

  return (
    <lineSegments geometry={geometry} renderOrder={1}>
      <lineBasicMaterial
        color="#ffffff"
        opacity={1}
        transparent
        depthWrite={false}
        toneMapped={false}
        polygonOffset
        polygonOffsetFactor={-2}
        polygonOffsetUnits={-1}
      />
    </lineSegments>
  );
}

export type PickPayload =
  | { kind: "hub"; tag: string }
  | { kind: "movie"; node: TagGraphMovieNode }
  | null;

function hubDim(selected: PickPayload, tag: string): boolean {
  if (!selected) return false;
  if (selected.kind === "hub") return selected.tag !== tag;
  if (selected.kind === "movie") return !selected.node.tagsUniqueSorted.includes(tag);
  return false;
}

function movieDim(selected: PickPayload, node: TagGraphMovieNode): boolean {
  if (!selected) return false;
  if (selected.kind === "movie") return selected.node.id !== node.id;
  if (selected.kind === "hub") return !node.tagsUniqueSorted.includes(selected.tag);
  return false;
}

function hubIsConnected(selected: PickPayload, tag: string): boolean {
  if (!selected) return false;
  if (selected.kind === "hub") return selected.tag === tag;
  if (selected.kind === "movie") return selected.node.tagsUniqueSorted.includes(tag);
  return false;
}

function movieIsConnected(selected: PickPayload, node: TagGraphMovieNode): boolean {
  if (!selected) return false;
  if (selected.kind === "movie") return selected.node.id === node.id;
  if (selected.kind === "hub") return node.tagsUniqueSorted.includes(selected.tag);
  return false;
}

function hubLabelFontSizes(hubs: TagGraphLayout["hubs"]): Map<string, number> {
  const map = new Map<string, number>();
  if (hubs.length === 0) return map;
  const counts = hubs.map((h) => h.movieCount);
  const minC = Math.min(...counts);
  const maxC = Math.max(...counts);
  const floor = 0.19;
  const ceil = 0.58;
  for (const h of hubs) {
    const span = maxC - minC;
    const t = span <= 0 ? 0.5 : (h.movieCount - minC) / span;
    map.set(h.tag, floor + t * (ceil - floor));
  }
  return map;
}

function HubNodes({
  hubs,
  selected,
  onPickHub,
}: {
  hubs: TagGraphLayout["hubs"];
  selected: PickPayload;
  onPickHub: (tag: string) => void;
}) {
  const fontByTag = useMemo(() => hubLabelFontSizes(hubs), [hubs]);

  return hubs.map((h) => {
    const selectedHere = selected?.kind === "hub" && selected.tag === h.tag;
    const connected = hubIsConnected(selected, h.tag);
    const dim = hubDim(selected, h.tag);
    const scale = selectedHere ? 1.12 : connected ? 1.08 : 1;
    const base = selectedHere ? HUB_TAG_COLOR_SELECTED : HUB_TAG_COLOR;
    const fontSize =
      (fontByTag.get(h.tag) ?? 0.34) * (selectedHere ? 1.02 : connected && selected ? 1.03 : 1);
    const outlineWidth = fontSize * 0.006;
    const fillOpacity = !selected ? 1 : connected && !dim ? (selectedHere ? 1 : 0.93) : 0.13;
    return (
      <group key={h.tag} position={[h.position.x, h.position.y, h.position.z]} scale={scale}>
        <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
          <Text
            fontSize={fontSize}
            maxWidth={10}
            anchorX="center"
            anchorY="middle"
            textAlign="center"
            lineHeight={1}
            color={base}
            fillOpacity={fillOpacity}
            outlineWidth={outlineWidth}
            outlineColor={selectedHere ? "#d97706" : "#fef3c7"}
            outlineOpacity={dim ? 0.22 : selectedHere ? 0.55 : connected && selected ? 0.74 : 0.68}
            depthOffset={selectedHere ? 6 : connected && selected ? 3 : 0}
            onClick={(event: ThreeEvent<MouseEvent>) => {
              event.stopPropagation();
              onPickHub(h.tag);
            }}
          >
            {h.tag}
          </Text>
        </Billboard>
      </group>
    );
  });
}

function MovieNodes({
  movies,
  selected,
  onPickMovie,
}: {
  movies: TagGraphLayout["movies"];
  selected: PickPayload;
  onPickMovie: (node: TagGraphMovieNode) => void;
}) {
  return movies.map((p) => {
    const selectedHere = selected?.kind === "movie" && selected.node.id === p.id;
    const connected = movieIsConnected(selected, p);
    const dim = movieDim(selected, p);
    const scale = selectedHere ? 1.18 : connected && selected ? 1.06 : 1;
    const fontSize = selectedHere ? 0.164 : connected && selected && !dim ? 0.142 : 0.126;
    const fillProj = !selected ? 1 : connected && !dim ? 1 : 0.12;
    const outlineProj = dim ? 0.26 : selectedHere ? 0.78 : connected && selected ? 0.73 : 0.66;
    return (
      <group key={p.id} position={[p.position.x, p.position.y, p.position.z]} scale={scale}>
        <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
          <Text
            fontSize={fontSize}
            maxWidth={3.4}
            anchorX="center"
            anchorY="middle"
            textAlign="center"
            lineHeight={1.06}
            color={selectedHere ? "#ffffff" : connected && selected ? "#f1f5f9" : "#c8d5e4"}
            fillOpacity={fillProj}
            outlineWidth={selectedHere ? 0.003 : 0.002}
            outlineColor="#e8edf6"
            outlineOpacity={outlineProj}
            depthOffset={selectedHere ? 6 : connected && selected ? 3 : 0}
            onClick={(event: ThreeEvent<MouseEvent>) => {
              event.stopPropagation();
              onPickMovie(p);
            }}
          >
            {p.label}
          </Text>
        </Billboard>
      </group>
    );
  });
}

function InnerScene({
  layout,
  selected,
  onPick,
}: {
  layout: TagGraphLayout;
  selected: PickPayload;
  onPick: (payload: PickPayload) => void;
}) {
  const mutedGeometry = useMemo(() => buildLinkPositionBuffer(layout), [layout]);
  const highlightGeometry = useMemo(() => {
    const filter = getHighlightFilter(selected);
    if (!filter) return null;
    return buildLinkPositionBuffer(layout, filter);
  }, [layout, selected]);

  return (
    <>
      <color attach="background" args={["#12151f"]} />
      <ambientLight intensity={0.42} />
      <directionalLight position={[10, 12, 6]} intensity={0.85} />
      <directionalLight position={[-8, -4, -10]} intensity={0.28} />

      {mutedGeometry ? <MutedLinks geometry={mutedGeometry} /> : null}
      {highlightGeometry ? <HighlightLinks geometry={highlightGeometry} /> : null}

      <HubNodes
        hubs={layout.hubs}
        selected={selected}
        onPickHub={(tag) => onPick({ kind: "hub", tag })}
      />
      <MovieNodes
        movies={layout.movies}
        selected={selected}
        onPickMovie={(node) => onPick({ kind: "movie", node })}
      />

      <DampingOrbitControls />
    </>
  );
}

export type TagGraphSceneProps = {
  layout: TagGraphLayout;
  selected: PickPayload;
  onPick: (payload: PickPayload) => void;
};

export function TagGraphScene({ layout, selected, onPick }: TagGraphSceneProps) {
  return (
    <Canvas
      className="h-full min-h-0 w-full flex-1 touch-none"
      camera={{ position: [0, 2, 16], fov: 50, near: 0.08, far: 160 }}
      gl={{ antialias: true, alpha: false }}
      onPointerMissed={() => onPick(null)}
    >
      <InnerScene layout={layout} selected={selected} onPick={onPick} />
    </Canvas>
  );
}
