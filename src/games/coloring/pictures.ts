// Coloring pages as sets of SVG regions. Each region is a path the child taps to
// fill with the selected color. Original simple shapes (no third-party art).
export interface Region {
  id: string;
  d: string; // SVG path data
}
export interface Picture {
  id: string;
  name: { he: string; en: string };
  viewBox: string;
  regions: Region[];
  // decorative outlines drawn on top (not fillable)
  outlines?: string[];
}

export const PICTURES: Picture[] = [
  {
    id: "house",
    name: { he: "בית", en: "House" },
    viewBox: "0 0 200 200",
    regions: [
      { id: "sky", d: "M0 0 H200 V120 H0 Z" },
      { id: "grass", d: "M0 120 H200 V200 H0 Z" },
      { id: "roof", d: "M50 90 L100 45 L150 90 Z" },
      { id: "wall", d: "M60 90 H140 V160 H60 Z" },
      { id: "door", d: "M92 120 H112 V160 H92 Z" },
      { id: "window", d: "M68 100 H84 V116 H68 Z" },
      { id: "sun", d: "M165 30 m-16 0 a16 16 0 1 0 32 0 a16 16 0 1 0 -32 0" },
    ],
  },
  {
    id: "fish",
    name: { he: "דג", en: "Fish" },
    viewBox: "0 0 200 200",
    regions: [
      { id: "water", d: "M0 0 H200 V200 H0 Z" },
      { id: "body", d: "M40 100 C40 60 120 60 140 100 C120 140 40 140 40 100 Z" },
      { id: "tail", d: "M140 100 L180 70 L180 130 Z" },
      { id: "fin", d: "M80 70 L100 45 L110 72 Z" },
      { id: "eye", d: "M60 92 m-7 0 a7 7 0 1 0 14 0 a7 7 0 1 0 -14 0" },
    ],
  },
  {
    id: "flower",
    name: { he: "פרח", en: "Flower" },
    viewBox: "0 0 200 200",
    regions: [
      { id: "sky", d: "M0 0 H200 V200 H0 Z" },
      { id: "petal1", d: "M100 40 m-22 0 a22 22 0 1 0 44 0 a22 22 0 1 0 -44 0" },
      { id: "petal2", d: "M60 80 m-22 0 a22 22 0 1 0 44 0 a22 22 0 1 0 -44 0" },
      { id: "petal3", d: "M140 80 m-22 0 a22 22 0 1 0 44 0 a22 22 0 1 0 -44 0" },
      { id: "petal4", d: "M75 125 m-22 0 a22 22 0 1 0 44 0 a22 22 0 1 0 -44 0" },
      { id: "petal5", d: "M125 125 m-22 0 a22 22 0 1 0 44 0 a22 22 0 1 0 -44 0" },
      { id: "center", d: "M100 95 m-18 0 a18 18 0 1 0 36 0 a18 18 0 1 0 -36 0" },
      { id: "stem", d: "M96 150 H104 V195 H96 Z" },
    ],
  },
];

export const PALETTE = [
  "#ff7675",
  "#fdcb6e",
  "#ffeaa7",
  "#55efc4",
  "#00cec9",
  "#74b9ff",
  "#a29bfe",
  "#fd79a8",
  "#e17055",
  "#636e72",
  "#2d3436",
  "#ffffff",
];
