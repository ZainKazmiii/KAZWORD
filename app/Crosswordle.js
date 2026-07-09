"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";



/**

 * WORDLE COLOURS (tuned brighter green/yellow to match your reference)

 */

const WORDLE = {

  green: "#50B334",

  yellow: "#E5B62E",

  // ✅ “absent” tiles are near-black (so your share emoji ⬛ matches)

  gray: "#3a3a3c",

  emptyBorder: "#d3d6da",

  emptyBg: "#ffffff",

  textDark: "#111827",

  textLight: "#ffffff",

  appBg: "#f6f7f8",

  selectionRing: "#3b82f6",

  focusRing: "#ef4444",

};

const MAX_SUBMISSIONS = 6;

const MAX_ACROSS_LEN = 16;

const MAX_DOWN_LEN = 10;

// NEW: bounding box limits (screen-fit)

const MAX_GRID_WIDTH = 15;   // tiles left-to-right

const MAX_GRID_HEIGHT = 9;  // tiles top-to-bottom



// ✅ easy positioning knobs

const CLUES_ANCHOR = {

  top: 92,     // px from top

  left: 28,    // px from left

  width: 280,  // optional

};



// ✅ NEW: help icon positioning knob (increase to push the ? left)

const HELP_ICON_SHIFT_LEFT = 0; // px (try 10, 20, 30...)

const HISTORY_PANEL_SHIFT_LEFT = 0; // px — increase to push panel further from grid

// ✅ Theme toggle (white <-> purple)

const PURPLE_BG = "#6C4BFF";

const THEME_ICON_SHIFT_LEFT = 56; // optional knob like the help icon











/**

 * =========================

 *  LAUNCH DATE (FOR SHARE)

 * =========================

 * Change this to whatever your real launch date is.

 * Months are 0-based: Jan = 0, Feb = 1, etc.

 */

function getLocalLaunchDate() {
  return new Date(2026, 2, 14); // March 14, 2026 in local time
}

function formatYMD(d) {

  const yyyy = d.getFullYear();

  const mm = String(d.getMonth() + 1).padStart(2, "0");

  const dd = String(d.getDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;

}

function daysSince(d0, d1) {
  const a = Date.UTC(d0.getFullYear(), d0.getMonth(), d0.getDate());
  const b = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
  return Math.floor((b - a) / 86400000);
}

const STATS_KEY = "cw_stats_v2";

const HELP_SEEN_KEY = "cw_help_seen_v2";

const LAST_PLAYED_KEY = "cw_last_played_ymd_v2";







function bucketForGuess(n) {

return String(Math.min(n, MAX_SUBMISSIONS));

}











function readStats() {

  try {

    const raw = localStorage.getItem(STATS_KEY);

    if (!raw) {

      return {

        played: 0,

        wins: 0,

        currentStreak: 0,

        maxStreak: 0,

        dist: {

		"1": 0,

"2": 0,

"3": 0,

"4": 0,

"5": 0,

"6": 0,







},

history: [],



};

}

const parsed = JSON.parse(raw);









    const legacy = parsed.dist || {};



    // ✅ Prefer new keys if they exist; otherwise best-effort map old ranges into new ones

    // ✅ Prefer new keys if they exist; otherwise best-effort map old ranges into new ones

const hasNew =

  legacy["1"] != null || legacy["2"] != null || legacy["5 and under"] != null || legacy["10 and under"] != null;



if (hasNew) {

  return {

    played: parsed.played ?? 0,

    wins: parsed.wins ?? 0,

    currentStreak: parsed.currentStreak ?? 0,

    maxStreak: parsed.maxStreak ?? 0,





    dist: {





"1": legacy["1"] ?? 0,

"2": legacy["2"] ?? 0,

"3": legacy["3"] ?? 0,

"4": legacy["4"] ?? 0,

"5": legacy["5"] ?? legacy["5 and under"] ?? legacy["10 and under"] ?? 0,





},

history: parsed.history ?? [],

};

}

// Otherwise: legacy → new











const dist = {

  "10 and under": (legacy["1-2"] ?? 0) + (legacy["3-5"] ?? legacy["1-5"] ?? 0) + (legacy["6-8"] ?? 0) + (legacy["6-10"] ?? 0),

  "Above 10": (legacy["9-11"] ?? legacy["11-15"] ?? 0) + (legacy["12"] ?? 0) + (legacy["16-20"] ?? 0),

  "Above 20": (legacy["21-25"] ?? 0) + (legacy["26-30"] ?? 0),

  "Above 30": (legacy["31-35"] ?? 0) + (legacy["36-40"] ?? 0),

};

return {

  played: parsed.played ?? 0,

  wins: parsed.wins ?? 0,

  currentStreak: parsed.currentStreak ?? 0,

  maxStreak: parsed.maxStreak ?? 0,

  dist,

  history: parsed.history ?? [],

};

















  } catch {

    return {

      played: 0,

      wins: 0,

      currentStreak: 0,

      maxStreak: 0,

      dist: {



	"1": 0,

"2": 0,

"3": 0,

"4": 0,

"5": 0,

"6": 0,



},



};

}

}

function writeStats(stats) {





  localStorage.setItem(STATS_KEY, JSON.stringify(stats));

}

/**

 * =========================

 *  DICTIONARY (YOU CONTROL)

 * =========================

 */

const VALID_WORDS = {

  3: [

    "SUN",

    "SKY",

    "NOW",

    "TOP",

    "CAT",

    "COW",

    "ANT",

    "DOG",

    "SEA",

    "AIR",

    "ICE",

    "OIL",

    "GAS",

    "MAP",

    "DAY",

    "NIT",

    "HIT",

    "SIT",

    "SAT",

    "RUN",

    "RAN",

    "FUN",

    "FAN",

    "PAN",

    "TAP",

    "CAP",

    "CAN",

    "MAN",

    "MEN",

    "HEN",

    "PEN",

    "DEN",

    "END",

    "AND",

    "ANY",

    "ALL",

    "ONE",

    "TWO",

    "TEN",

    "SIX",

    "ROW",

    "LOW",

    "HOW",

    "WHO",

    "WHY",

    "YES",

    "YET",

    "NOT",

    "NOR",

    "OUR",

    "OUT",

    "INN",

    "INK",

    "KIT",

    "KID",

    "LID",

    "LIP",

    "TIP",

    "TIE",

    "DIE",

    "DUE",

    "SUE",

    "USE",

    "YOU",

    "HIM",

    "HER",

    "THE",

    "THIS",

    "THY",

    "TOO",

    "OFF",

    "ON",

    "UP",

    "TO",

    "AS",

    "AT",

    "IT",

    "IS",

    "AM",

    "BE",

    "DO",

    "GO",

    "WE",

    "HE",

    "ME",

    "MY",

    "BY",

    "OR",

    "OF",

    "IF",

    "SO",

    "NO",

    "OK",

  ],

  4: [

    "BIRD",

    "WOLF",

    "BEAR",

    "FROG",

    "LION",

    "GOAT",

    "MULE",

    "DEER",

    "SEAL",

    "CRAB",

    "FISH",

    "DUCK",

    "NOTE",

    "TONE",

    "SAND",

    "LAND",

    "HAND",

    "BAND",

    "FIND",

    "KIND",

    "MIND",

    "WIND",

    "RING",

    "SING",

    "KING",

    "LONG",

    "SONG",

    "TREE",

    "SEED",

    "LEAF",

    "ROOT",

    "SOIL",

    "RAIN",

    "SNOW",

    "WARM",

    "COOL",

    "HEAT",

    "MOON",

    "STAR",

    "MARS",

    "TIME",

    "DATE",

    "HOUR",

    "YEAR",

    "EASY",

    "HARD",

    "SURE",

    "TRUE",

    "GAME",

    "PLAY",

    "WORD",

    "GRID",

    "WALK",

    "RUNS",

    "JUMP",

    "TURN",

    "HOME",

    "WORK",

    "SHOP",

    "PARK",

    "BLUE",

    "GRAY",

    "GOLD",

  ],

  5: [

    "PLANT",

    "STONE",

    "WATER",

    "EARTH",

    "NORTH",

    "SOUTH",

    "APPLE",

    "GRAPE",

    "BERRY",

    "MANGO",

    "LEMON",

    "SHEEP",

    "HORSE",

    "TIGER",

    "ZEBRA",

    "PANDA",

    "SMILE",

    "LAUGH",

    "HAPPY",

    "PEACE",

    "WORDS",

    "GUESS",

    "SOLVE",

    "CROSS",

    "TILES",

    "BRAVE",

    "CLEAN",

    "CLEAR",

    "SMART",

    "SHARP",

    "LIGHT",

    "NIGHT",

    "DREAM",

    "SLEEP",

    "RIVER",

    "OCEAN",

    "BEACH",

    "SHORE",

    "TRAIN",

    "PLANE",

    "TRUCK",

  ],

  6: ["PLANET", "PEOPLE", "FRIEND", "ANIMAL", "FLOWER", "BRIDGE", "PUZZLE", "SELECT", "SUBMIT", "SCREEN", "BUTTON"],

  7: ["PUZZLES", "CROSSING", "PLAYERS"],

};







// Keyboard rows: match Wordle layout + add UNDO key to the left of Q

const KEYBOARD_ROWS = [

  ["UNDO", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],

  ["GREENS", "A", "S", "D", "F", "G", "H", "J", "K", "L"],

  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "⌫"],

];



function getPuzzleNumberSinceLaunch(now = new Date()) {
  const launchLocal = getLocalLaunchDate();
  const launch = new Date(launchLocal.getFullYear(), launchLocal.getMonth(), launchLocal.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return daysSince(launch, today) + 1;
}








function tileKey(row, col) {

  return `${row}-${col}`;

}

function parseTileKey(k) {

  const m = /^(-?\d+)-(-?\d+)$/.exec(k);

  if (!m) return [0, 0];

  return [parseInt(m[1], 10), parseInt(m[2], 10)];

}

/**

 * ============================================================

 *  DAILY SHAPES (ONLY the shapes from your images)

 * ============================================================

 */

const SHAPES = [

 //Shape Maker



  // Shape 0

  [

    [0, 1],

    [1, 1],

    [2, 0], [2,1], [2,2],[2,3],

    [3,3],

    [4,0], [4,1], [4,2],[4,3], [4,4], [4,5],

	[5,3],

	[6,3], [6,4], [6,5],

  ],









  // Shape 1

[

[0,2],[0,3],[0,4],[0,5],[0,6],[0,7],

[1,5],[1,7],[2,3],[2,4],[2,5],[2,6],[2,7],

[3,3],[3,7],[4,0],[4,1],[4,2],[4,3],[4,4],[4,5],[4,6],[4,7],[5,3],[6,2],[6,3],[6,4],[6,5],[6,6],[6,7],[6,8],

 ],









// Shape 2

[

[0,5],[0,6],[0,7],[0,8],[0,9],[1,5],[2,4],[2,5],[2,6],[2,7],[2,8],[2,9],[2,13],[3,5],[3,13],[4,4],[4,5],[4,6],[4,7],[4,10],[4,13],[5,5],[5,10],[5,13],[6,5],[6,6],[6,7],[6,8],[6,9],[6,10],[6,11],[6,12],[6,13],

],







// Shape 3



[

 [0,2],[1,0],[1,1],[1,2],[2,2],[3,2],[3,3],[3,4],[3,5],[3,6],[4,2],[5,2],[6,0],[6,1],[6,2],[6,3],[6,4],

],









 // Shape 4



[

[2,3],[2,6],[2,8],[3,3],[3,6],[3,8],[4,2],[4,3],[4,4],[4,5],[4,6],[4,7],[4,8],[5,0],[5,3],[5,5],[5,8],[6,0],[6,1],[6,2],[6,3],[6,5],[6,8],[7,0],[7,5],[7,8],[8,0],[8,5],

],





// Shape 5







[

[2,11],[3,5],[3,7],[3,8],[3,9],[3,10],[3,11],[4,5],[4,7],[4,11],[4,12],[4,13],[4,14],[4,15],[5,5],[5,7],[5,11],[6,5],[6,6],[6,7],[6,8],[6,9],[6,11],[6,12],[6,13],[6,14],[6,15],[7,5],[7,11],

],





// Shape 6



[

[2,8],[2,9],[2,10],[2,11],[3,9],[4,6],[4,7],[4,8],[4,9],[4,10],[4,11],[5,6],[5,9],[6,2],[6,3],[6,4],[6,5],[6,6],[6,9],[6,10],[6,11],[6,12],[6,13],[7,3],[7,6],[8,3],[8,6],

],





// Shape 7



[

[3,7],[3,11],[3,14],[4,4],[4,7],[4,10],[4,11],[4,12],[4,13],[4,14],[5,4],[5,7],[5,11],[5,14],[6,3],[6,4],[6,5],[6,6],[6,7],[6,11],[6,14],[7,4],[7,7],[7,8],[7,9],[7,10],[7,11],[7,14],[8,4],

],







// Shape 8



[

[2,10],[3,10],[4,6],[4,7],[4,8],[4,9],[4,10],[4,12],[5,6],[5,10],[5,12],[6,3],[6,4],[6,5],[6,6],[6,7],[6,10],[6,11],[6,12],[6,13],[6,14],[7,6],[7,12],[8,6],[8,9],[8,10],[8,11],[8,12],[8,13],

],











//Shape 9



[

[2,12],[2,15],[3,9],[3,12],[3,15],[4,5],[4,9],[4,10],[4,11],[4,12],[4,13],[4,15],[5,5],[5,9],[5,12],[5,15],[6,5],[6,6],[6,7],[6,8],[6,9],[6,11],[6,12],[6,13],[6,14],[6,15],[7,5],[7,9],[8,5],

],









//Shape 10



[

[5,9],[6,9],[7,1],[7,4],[7,6],[7,7],[7,8],[7,9],[7,10],[8,1],[8,4],[8,6],[8,9],[9,1],[9,4],[9,6],[9,9],[10,1],[10,4],[10,5],[10,6],[10,7],[10,8],[11,0],[11,1],[11,2],[11,3],[11,4],[11,6],

],











//Shape 11



[

[4,7],[4,8],[4,9],[4,10],[4,11],[5,7],[6,5],[6,6],[6,7],[6,8],[6,9],[7,5],[7,7],[7,9],[8,3],[8,4],[8,5],[8,6],[8,7],[8,9],[9,5],[9,9],[10,3],[10,4],[10,5],[10,6],[10,7],[10,9],

],









//Shape 12



[

[4,10],[5,8],[5,9],[5,10],[5,11],[5,12],[6,4],[6,5],[6,6],[6,7],[6,8],[6,10],[6,13],[7,8],[7,10],[7,11],[7,12],[7,13],[7,14],[8,8],[8,10],[8,13],[9,8],[9,11],[9,12],[9,13],[9,14],[9,15],[10,13],

],











//Shape 13



[

[5,10],[5,11],[5,12],[5,13],[5,14],[6,7],[6,11],[7,5],[7,7],[7,8],[7,9],[7,10],[7,11],[8,5],[8,7],[8,11],[9,5],[9,7],[9,9],[9,10],[9,11],[9,12],[9,13],[10,4],[10,5],[10,6],[10,7],[10,8],[11,5],

],













//Shape 14



 [

 [2,9],[2,11],[2,12],[2,13],[2,14],[2,15],[3,7],[3,8],[3,9],[3,10],[3,11],[4,5],[4,9],[4,11],[5,5],[5,6],[5,7],[5,8],[5,9],[5,11],[6,5],[6,9],[6,11],[7,3],[7,4],[7,5],[7,6],[7,7],[8,5],

 ],







// Shape 15



[

[2,8],[3,8],[3,10],[3,12],[4,6],[4,8],[4,10],[4,12],[5,4],[5,5],[5,6],[5,7],[5,8],[5,10],[5,12],[6,6],[6,8],[6,9],[6,10],[6,11],[6,12],[7,6],[7,10],[7,12],[8,2],[8,3],[8,4],[8,5],[8,6],

],









// Shape 16



[

[3,3],[3,4],[3,5],[3,6],[3,7],[3,10],[4,7],[4,10],[5,0],[5,1],[5,2],[5,3],[5,4],[5,6],[5,7],[5,8],[5,9],[5,10],[6,4],[6,7],[6,10],[7,4],[7,5],[7,6],[7,7],[7,8],[7,10],[8,4],[9,4],

],











//Shape 17



[

[3,4],[3,9],[3,11],[4,2],[4,3],[4,4],[4,5],[4,6],[4,9],[4,11],[5,4],[5,7],[5,8],[5,9],[5,10],[5,11],[6,3],[6,4],[6,5],[6,6],[6,7],[6,9],[6,11],[7,4],[7,7],[7,9],[7,11],[8,7],[9,7],

],





//Shape 18

[

[2,8],[2,9],[2,10],[2,11],[2,12],[3,11],[4,2],[4,3],[4,4],[4,5],[4,6],[4,8],[4,11],[5,5],[5,8],[5,11],[6,5],[6,7],[6,8],[6,9],[6,10],[6,11],[7,5],[7,8],[8,4],[8,5],[8,6],[8,7],[8,8],

],





//Shape 19

[
[2,10],[2,11],[2,12],[2,13],[2,14],[3,10],[4,8],[4,9],[4,10],[4,11],[4,12],[5,8],[5,10],[5,12],[6,8],[6,10],[6,12],[7,8],[7,11],[7,12],[7,13],[7,14],[7,15],[8,5],[8,6],[8,7],[8,8],[8,9],[8,12],
],





//Shape 20
[
[4,10],[4,13],[4,15],[5,7],[5,9],[5,10],[5,11],[5,12],[5,13],[5,15],[6,7],[6,10],[6,13],[6,15],[7,7],[7,10],[7,13],[7,14],[7,15],[7,16],[7,17],[8,6],[8,7],[8,8],[8,9],[8,10],[8,13],[8,15],[9,7],
],




//Shape 21
[
[5,9],[6,6],[6,9],[7,6],[7,8],[7,9],[7,10],[7,11],[7,12],[7,14],[8,6],[8,9],[8,11],[8,14],[9,5],[9,6],[9,7],[9,8],[9,9],[9,11],[9,14],[10,6],[10,11],[10,12],[10,13],[10,14],[10,15],[11,11],[11,14],
],





//Shape 22
[
[3,14],[4,12],[4,14],[5,8],[5,10],[5,11],[5,12],[5,13],[5,14],[6,8],[6,10],[6,12],[6,14],[7,6],[7,7],[7,8],[7,9],[7,10],[7,12],[7,14],[8,8],[8,10],[8,12],[9,4],[9,5],[9,6],[9,7],[9,8],[9,10],
],







//Shape 23
[
[2,10],[3,8],[3,10],[4,6],[4,7],[4,8],[4,9],[4,10],[4,13],[5,8],[5,10],[5,13],[6,4],[6,5],[6,6],[6,7],[6,8],[6,10],[6,11],[6,12],[6,13],[6,14],[7,8],[7,13],[8,9],[8,10],[8,11],[8,12],[8,13],
],









//Shape 24
[
[3,11],[3,15],[4,9],[4,11],[4,15],[5,6],[5,8],[5,9],[5,10],[5,11],[5,12],[5,15],[6,6],[6,9],[6,11],[6,15],[7,6],[7,9],[7,11],[7,12],[7,13],[7,14],[7,15],[8,5],[8,6],[8,7],[8,8],[8,9],[9,6],
],




//Shape 25
[
[4,7],[4,10],[4,12],[5,7],[5,10],[5,12],[6,7],[6,9],[6,10],[6,11],[6,12],[6,13],[7,7],[7,10],[7,12],[8,6],[8,7],[8,8],[8,9],[8,10],[8,12],
],





//Shape 26

[
[4,8],[5,8],[5,10],[5,13],[6,6],[6,7],[6,8],[6,9],[6,10],[6,13],[7,8],[7,10],[7,13],[8,8],[8,10],[8,13],[9,10],[9,11],[9,12],[9,13],[9,14],
],



//Shape 27
[
[3,10],[4,6],[4,8],[4,10],[5,6],[5,8],[5,10],[6,6],[6,7],[6,8],[6,9],[6,10],[7,6],[7,8],[7,10],[7,11],[7,12],[7,13],[7,14],[8,6],[8,8],
],





//Shape 28
[
[3,13],[4,9],[4,13],[5,9],[5,11],[5,13],[6,9],[6,11],[6,13],[7,9],[7,10],[7,11],[7,12],[7,13],[8,5],[8,6],[8,7],[8,8],[8,9],[8,11],[9,11],
],




//Shape 29
[
[5,5],[5,6],[5,7],[5,8],[5,9],[6,6],[7,6],[7,10],[8,6],[8,7],[8,8],[8,9],[8,10],[9,6],[9,10],[10,10],[11,9],[11,10],[11,11],[11,12],[11,13],
],





//Shape 30
[
[5,13],[6,7],[6,10],[6,11],[6,12],[6,13],[6,14],[7,7],[7,10],[7,13],[8,6],[8,7],[8,8],[8,9],[8,10],[8,13],[9,7],[9,10],[9,13],[10,7],[10,10],
],



//Shape 31
[
[6,7],[7,7],[7,10],[8,6],[8,7],[8,8],[8,9],[8,10],[8,12],[9,7],[9,10],[9,12],[10,7],[10,10],[10,12],[11,9],[11,10],[11,11],[11,12],[11,13],[12,12],
],





//Shape 32
[
[4,6],[5,6],[6,5],[6,6],[6,7],[6,8],[6,9],[6,11],[7,6],[7,8],[7,11],[8,6],[8,8],[8,11],[9,8],[9,11],[10,7],[10,8],[10,9],[10,10],[10,11],
],



//Shape 33
[
[3,12],[4,12],[5,10],[5,11],[5,12],[5,13],[5,14],[6,10],[6,12],[7,8],[7,9],[7,10],[7,11],[7,12],[8,10],[9,6],[9,7],[9,8],[9,9],[9,10],
],





//Shape 34
[
[3,7],[4,7],[4,11],[5,7],[5,10],[5,11],[5,12],[5,13],[5,14],[6,7],[6,11],[7,7],[7,8],[7,9],[7,10],[7,11],[8,11],[8,12],[8,13],[8,14],[8,15],
],



//Shape 35
[
[4,8],[5,6],[5,7],[5,8],[5,9],[5,10],[5,12],[6,8],[6,10],[6,12],[7,8],[7,10],[7,11],[7,12],[7,13],[7,14],[8,8],[8,10],[8,12],[9,10],[9,12],
],




//Shape 36
[
[4,11],[4,12],[4,13],[4,14],[4,15],[5,9],[5,11],[5,14],[6,7],[6,8],[6,9],[6,10],[6,11],[6,14],[7,9],[7,11],[7,14],[8,9],[8,11],[8,14],[9,9],
],







//Shape 37
[
[3,9],[3,10],[3,11],[3,12],[3,13],[4,6],[4,9],[4,12],[5,6],[5,9],[5,12],[6,6],[6,7],[6,8],[6,9],[6,10],[6,12],[7,6],[7,9],[7,12],[8,6],
],




//Shape 38
[
[5,5],[5,6],[5,7],[5,8],[5,9],[5,12],[6,8],[6,12],[7,8],[7,9],[7,10],[7,11],[7,12],[8,8],[8,12],[9,5],[9,6],[9,7],[9,8],[9,9],[9,12],
],



//Shape 39
[
[3,13],[4,13],[5,7],[5,10],[5,11],[5,12],[5,13],[5,14],[6,7],[6,10],[6,13],[7,7],[7,10],[7,13],[8,7],[8,10],[9,6],[9,7],[9,8],[9,9],[9,10],
],






//Shape 40
[
[5,10],[5,11],[5,12],[5,13],[5,14],[6,10],[7,8],[7,10],[8,8],[8,10],[9,6],[9,7],[9,8],[9,9],[9,10],[10,8],[11,8],[11,9],[11,10],[11,11],[11,12],
],




//Shape 41
[
[5,8],[6,8],[6,10],[7,6],[7,7],[7,8],[7,9],[7,10],[7,12],[8,8],[8,10],[8,11],[8,12],[8,13],[8,14],[9,8],[9,10],[9,12],[10,10],[10,12],[11,12],
],





//Shape 42
[
[4,8],[4,9],[4,10],[4,11],[4,12],[5,11],[6,8],[6,9],[6,10],[6,11],[6,12],[7,8],[7,11],[8,8],[8,11],[9,8],[10,6],[10,7],[10,8],[10,9],[10,10],
],




//Shape 43
[
[4,13],[5,13],[6,7],[6,10],[6,13],[7,7],[7,10],[7,11],[7,12],[7,13],[7,14],[8,6],[8,7],[8,8],[8,9],[8,10],[8,13],[9,7],[9,10],[10,7],[10,10],
],





//Shape 44
[
[3,7],[3,11],[3,13],[4,7],[4,11],[4,13],[5,7],[5,11],[5,12],[5,13],[5,14],[5,15],[6,7],[6,8],[6,9],[6,10],[6,11],[6,13],[7,7],[7,11],[7,13],
],









//Shape 45
[
[4,5],[4,6],[4,7],[4,8],[4,9],[5,7],[5,11],[6,7],[6,8],[6,9],[6,10],[6,11],[7,7],[7,9],[7,11],[8,7],[8,9],[8,11],[9,9],[9,11],[10,9],
],



//Shape 46
[
[3,10],[3,12],[4,10],[4,12],[5,8],[5,10],[5,12],[6,8],[6,9],[6,10],[6,11],[6,12],[7,8],[7,10],[7,12],[8,5],[8,6],[8,7],[8,8],[8,9],[9,8],
],





//Shape 47
[
[3,10],[3,13],[4,7],[4,10],[4,13],[5,7],[5,9],[5,10],[5,11],[5,12],[5,13],[6,7],[6,10],[6,13],[7,7],[7,8],[7,9],[7,10],[7,11],[7,13],[8,7],
],





//Shape 48
[
[2,6],[3,2],[3,6],[4,2],[4,3],[4,4],[4,5],[4,6],[5,2],[5,6],[5,8],[6,2],[6,5],[6,6],[6,7],[6,8],[6,9],[7,2],[7,8],[8,8],[9,8],
],




//Shape 49
[
[4,4],[4,6],[4,7],[4,8],[4,9],[4,10],[5,0],[5,1],[5,2],[5,3],[5,4],[5,6],[6,4],[6,6],[7,4],[7,6],[8,2],[8,3],[8,4],[8,5],[8,6],
],





//Shape 50
[
[1,0],[1,1],[1,2],[1,3],[1,4],[2,4],[2,6],[3,2],[3,3],[3,4],[3,5],[3,6],[4,4],[4,6],[5,4],[5,6],[5,7],[5,8],[5,9],[5,10],[6,6],
],






];

const CLUES = [



  "Animals", //Theme 0

  "UNDER PRESSURE!",  //Theme 1

  "MIXED UP!",  //Theme 2

  "PLAYING VIDEO GAMES", //Theme 3

  "ROAD TRIP!", //Theme 4

  "Going Shopping!", //Theme 5

  "A Nice Summer Day!", //Theme 6

  "Time", //Theme 7

  "Mind", //Theme 8

  "Positive Emotions", //Theme 9

  "Space/Universe", //Theme 10













];









 /**

 * ✅ OPTION A (TARGET LETTERS PER TILE) — DAILY_OVERRIDES EXAMPLES

 */

const PUZZLE_CREDITS = {

// Add a credit here whenever you use a community submission

// Format: puzzleNumber: { name: "First Last", solvedOn: puzzleNumber, attempts: number }

 1: { name: "Crimson Sardine", solvedOn: 0, attempts: 4 },


 5: { name: "Michael K", solvedOn: 0, attempts: 4 },


 9: { name: "Crimson Sardine", solvedOn: 3, attempts: 4 },


 10: { name: "JoKe", solvedOn: 4, attempts: 4 },


 11: { name: "Crimson Sardine", solvedOn: 5, attempts: 5 },


 27: { name: "Defne", solvedOn: 18, attempts: 5 }, //theme: Numbers




 31: { name: "Faren", solvedOn: 27, attempts: 3 }, //theme: Tennis











};

const DAILY_OVERRIDES = {



 //Shape 11   //inspired by Crimson Sardine



   1: {

   shapeIdx: 11,

   clueIdx: 11,

   theme: "Campfire",



   tileLetters: {

 // 1A — SMOKE (across row 4, cols 7-11)

  "4-7":  "S", // also intersects SPARK

  "4-8":  "M",

  "4-9":  "O",

  "4-10": "K",

  "4-11": "E",



  // 1D — SPARK (down col 7, rows 4-8)

  // "4-7" is already S from SMOKE

  "5-7": "P",

  "6-7": "A", // also intersects FLAME

  "7-7": "R",

  "8-7": "K", // also intersects STICK



  // 2A — FLAME (across row 6, cols 5-9)

  "6-5": "F", // also starts FLINT

  "6-6": "L",

  // "6-7" is already A from SPARK

  "6-8": "M",

  "6-9": "E", // also intersects EMBER



  // 2D — FLINT (down col 5, rows 6-10)

  // "6-5" is already F from FLAME

  "7-5":  "L",

  "8-5":  "I", // also intersects STICK

  "9-5":  "N",

  "10-5": "T", // also intersects MATCH



  // 3D — EMBER (down col 9, rows 6-10)

  // "6-9" is already E from FLAME

  "7-9":  "M",

  "8-9":  "B",

  "9-9":  "E",

  "10-9": "R",



  // 4A — STICK (across row 8, cols 3-7)

  "8-3": "S",

  "8-4": "T",

  // "8-5" is already I from FLINT

  "8-6": "C",

  // "8-7" is already K from SPARK



  // 5A — MATCH (across row 10, cols 3-7)

  "10-3": "M",

  "10-4": "A",

  // "10-5" is already T from FLINT

  "10-6": "C",

  "10-7": "H",



    },

  },





   //Shape 13



 2: {

   shapeIdx: 13,

   clueIdx: 13,

   theme: "Animals",



   tileLetters: {

   // 1A — SHEEP (across row 5, cols 10-14)

  "5-10": "S",

  "5-11": "H", // also starts HYENA

  "5-12": "E",

  "5-13": "E",

  "5-14": "P",



  // 2D — HYENA (down col 11, rows 5-9)

  // "5-11" is already H from SHEEP

  "6-11": "Y",

  "7-11": "E", // also last letter of HORSE

  "8-11": "N",

  "9-11": "A", // also 3rd letter of SNAKE



  // 3D — WHALE (down col 7, rows 6-10)

  "6-7":  "W",

  "7-7":  "H", // also first letter of HORSE

  "8-7":  "A",

  "9-7":  "L",

  "10-7": "E", // also 4th letter of TIGER



  // 4D — SNAIL (down col 5, rows 7-11)

  "7-5":  "S", // also starts TIGER row below

  "8-5":  "N",

  "9-5":  "A",

  "10-5": "I", // also 2nd letter of TIGER

  "11-5": "L",



  // 5A — HORSE (across row 7, cols 7-11)

  // "7-7" is already H from WHALE

  "7-8":  "O",

  "7-9":  "R",

  "7-10": "S",

  // "7-11" is already E from HYENA



  // 6A — SNAKE (across row 9, cols 9-13)

  "9-9":  "S",

  "9-10": "N",

  // "9-11" is already A from HYENA

  "9-12": "K",

  "9-13": "E",



  // 7A — TIGER (across row 10, cols 4-8)

  "10-4": "T",

  // "10-5" is already I from SNAIL

  "10-6": "G",

  // "10-7" is already E from WHALE

  "10-8": "R",



    },

  },















  //things connected to time

   3: {

   shapeIdx: 7,

   clueIdx: 7,

   theme: "Time",





   tileLetters: {



	    // 1D — NIGHT (down col 7, rows 3-7)

    "3-7": "N",

    "4-7": "I",

    "5-7": "G",

    "6-7": "H",

    "7-7": "T", // also the first letter of TODAY



    // 2D — EARLY (down col 11, rows 3-7)

    "3-11": "E",

    // "4-11" is already A from WATCH

    "5-11": "R",

    "6-11": "L",

    "7-11": "Y", // also the last letter of TODAY



    // 3D — PHONE (down col 14, rows 3-7)

    "3-14": "P",

    // "4-14" is already H from WATCH

    "5-14": "O",

    "6-14": "N",

    "7-14": "E",



    // 4D — CLOCK (down col 4, rows 4-8)

    "4-4": "C",

    "5-4": "L",

    "6-4": "O", // also intersects MONTH

    "7-4": "C",

    "8-4": "K",



    // 5A — WATCH (across row 4, cols 10-14)

    "4-10": "W",

    "4-11": "A",

    "4-12": "T",

    "4-13": "C",

    "4-14": "H",



    // 6A — MONTH (across row 6, cols 3-7)

    "6-3": "M",

    // "6-4" is already O from CLOCK

    "6-5": "N",

    "6-6": "T",

    // "6-7" is already H from NIGHT



    // 7A — TODAY (across row 7, cols 7-11)

    // "7-7" is already T from NIGHT

    "7-8": "O",

    "7-9": "D",

    "7-10": "A",

    // "7-11" is already Y from EARLY





    },

  },











  //Shape 8



  4: {

   shapeIdx: 8,

   clueIdx: 8,

   theme: "Related to the mind",

   tileLetters: {

// 1D — FOCUS (down col 10, rows 2-6)

  "2-10": "F",

  "3-10": "O",

  "4-10": "C", // also last letter of LOGIC

  "5-10": "U",

  "6-10": "S", // also first letter of SMART



  // 2A — LOGIC (across row 4, cols 6-10)

  "4-6": "L",

  "4-7": "O",

  "4-8": "G",

  "4-9": "I",

  // "4-10" is already C from FOCUS



  // 7D — LEARN (down col 6, rows 4-8)

  // "4-6" is already L from LOGIC

  "5-6": "E",

  "6-6": "A", // also intersects IDEAS

  "7-6": "R",

  "8-6": "N",



  // 4A — IDEAS (across row 6, cols 3-7)

  "6-3": "I",

  "6-4": "D",

  "6-5": "E",

  // "6-6" is already A from LEARN

  "6-7": "S",



  // 3D — BRAIN (down col 12, rows 4-8)

  "4-12": "B",

  "5-12": "R",

  "6-12": "A", // also intersects SMART

  "7-12": "I",

  "8-12": "N", // also intersects THINK



  // 5A — SMART (across row 6, cols 10-14)

  // "6-10" is already S from FOCUS

  "6-11": "M",

  // "6-12" is already A from BRAIN

  "6-13": "R",

  "6-14": "T",



  // 6A — THINK (across row 8, cols 9-13)

  "8-9":  "T",

  "8-10": "H",

  "8-11": "I",

  // "8-12" is already N from BRAIN

  "8-13": "K",



    },

  },











    //Shape 15



 5: {

   shapeIdx: 15,

   clueIdx: 15,

   theme: "In the Kitchen",



   tileLetters: {

  // 1D — GLASS (down col 8, rows 2-6)

  "2-8": "G",

  "3-8": "L",

  "4-8": "A",

  "5-8": "S", // also intersects TONGS

  "6-8": "S", // also intersects STOVE



  // 2D — SPOON (down col 10, rows 3-7)

  "3-10": "S",

  "4-10": "P",

  "5-10": "O", // also intersects STOVE

  "6-10": "O",

  "7-10": "N",



  // 3D — MIXER (down col 12, rows 3-7)

  "3-12": "M",

  "4-12": "I",

  "5-12": "X",

  "6-12": "E", // also intersects STOVE

  "7-12": "R",



  // 4D — KNIFE (down col 6, rows 4-8)

  "4-6": "K",

  "5-6": "N", // also intersects TONGS

  "6-6": "I",

  "7-6": "F",

  "8-6": "E", // also intersects PLATE



  // 5A — TONGS (across row 5, cols 4-8)

  "5-4": "T",

  "5-5": "O",

  // "5-6" is already N from KNIFE

  "5-7": "G",

  // "5-8" is already S from GLASS



  // 6A — STOVE (across row 6, cols 8-12)

  // "6-8" is already S from GLASS

  "6-9": "T",

  // "6-10" is already O from SPOON

  "6-11": "V",

  // "6-12" is already E from MIXER



  // 7A — PLATE (across row 8, cols 2-6)

  "8-2": "P",

  "8-3": "L",

  "8-4": "A",

  "8-5": "T",

  // "8-6" is already E from KNIFE



    },

  },











  //Shape 10



  6: {

   shapeIdx: 10,

   clueIdx: 10,

   theme: "Space/Astronomy",



   tileLetters: {

 // 1D — SPACE (down col 9, rows 5-9)

  "5-9": "S",

  "6-9": "P",

  "7-9": "A", // also intersects SOLAR

  "8-9": "C",

  "9-9": "E",



  // 2D — LUNAR (down col 1, rows 7-11)

  "7-1":  "L",

  "8-1":  "U",

  "9-1":  "N",

  "10-1": "A",

  "11-1": "R", // also intersects ORBIT



  // 3D — COMET (down col 4, rows 7-11)

  "7-4":  "C",

  "8-4":  "O",

  "9-4":  "M",

  "10-4": "E", // also intersects EARTH

  "11-4": "T", // also intersects ORBIT



  // 4D — STARS (down col 6, rows 7-11)

  // "7-6" is already S from SOLAR

  "8-6":  "T",

  "9-6":  "A",

  "10-6": "R", // also intersects EARTH

  "11-6": "S",



  // 4A — SOLAR (across row 7, cols 6-10)

  "7-6":  "S",

  "7-7":  "O",

  "7-8":  "L",

  // "7-9" is already A from SPACE

  "7-10": "R",



  // 5A — EARTH (across row 10, cols 4-8)

  // "10-4" is already E from COMET

  "10-5": "A",

  // "10-6" is already R from STARS

  "10-7": "T",

  "10-8": "H",



  // 6A — ORBIT (across row 11, cols 0-4)

  "11-0": "O",

  // "11-1" is already R from LUNAR

  "11-2": "B",

  "11-3": "I",

  // "11-4" is already T from COMET



    },

  },

























  //Shape 12



 7: {

   shapeIdx: 12,

   clueIdx: 12,

   theme: "Pirate",

   tileLetters: {

   // 1D — BOOTY (down col 10, rows 4-8)

  "4-10": "B",

  "5-10": "O", // also intersects SWORD

  "6-10": "O",

  "7-10": "T", // also intersects THIEF

  "8-10": "Y", // also intersects CHEST



  // 2A — SWORD (across row 5, cols 8-12)

  "5-8":  "S", // also intersects SKULL

  "5-9":  "W",

  // "5-10" is already O from BOOTY

  "5-11": "R",

  "5-12": "D",



  // 3A — PLANK (across row 6, cols 4-8)

  "6-4": "P",

  "6-5": "L",

  "6-6": "A",

  "6-7": "N",

  "6-8": "K", // also intersects SKULL



  // 4D — SKULL (down col 8, rows 5-9)

  // "5-8" is already S from SWORD

  // "6-8" is already K from PLANK

  "7-8": "U",

  "8-8": "L",

  "9-8": "L",



  // 5A — THIEF (across row 7, cols 10-14)

  // "7-10" is already T from BOOTY

  "7-11": "H",

  "7-12": "I",

  "7-13": "E", // also intersects JEWEL

  "7-14": "F",



  // 4D — JEWEL (down col 13, rows 6-10)

  "6-13":  "J",

  // "7-13" is already E from THIEF

  "8-13":  "W",

  "9-13":  "E", // also intersects CHEST

  "10-13": "L",



  // 6A — CHEST (across row 9, cols 11-15)

  "9-11": "C",

  "9-12": "H",

  // "9-13" is already E from JEWEL

  "9-14": "S",

  "9-15": "T",



    },

  },











   //Shape 16



 8: {

   shapeIdx: 16,

   clueIdx: 16,

   theme: "OVER_____",

   tileLetters: {

  // 1A — BOARD (across row 3, cols 3-7)

  "3-3": "B",

  "3-4": "O",

  "3-5": "A",

  "3-6": "R",

  "3-7": "D", // also starts DRIVE



  // 2D — DRIVE (down col 7, rows 3-7)

  // "3-7" is already D from BOARD

  "4-7": "R",

  "5-7": "I", // also intersects SIGHT

  "6-7": "V",

  "7-7": "E", // also intersects RULED



  // 3D — RATED (down col 10, rows 3-7)

  "3-10": "R",

  "4-10": "A",

  "5-10": "T", // also intersects SIGHT

  "6-10": "E",

  "7-10": "D",



  // 4A — NIGHT (across row 5, cols 0-4)

  "5-0": "N",

  "5-1": "I",

  "5-2": "G",

  "5-3": "H",

  "5-4": "T", // also intersects THROW



  // 5D — THROW (down col 4, rows 5-9)

  // "5-4" is already T from NIGHT

  "6-4": "H",

  "7-4": "R", // also intersects RULED

  "8-4": "O",

  "9-4": "W",



  // 6A — SIGHT (across row 5, cols 6-10)

  "5-6": "S",

  // "5-7" is already I from DRIVE

  "5-8": "G",

  "5-9": "H",

  // "5-10" is already T from RATED



  // 7A — RULED (across row 7, cols 4-8)

  // "7-4" is already R from THROW

  "7-5": "U",

  "7-6": "L",

  // "7-7" is already E from DRIVE

  "7-8": "D",



    },

  },













  //Shape 17

  9: {

  shapeIdx: 17,

  clueIdx: 17,

  theme: "SURFSIDE",

  tileLetters: {

    // 1D — TOWEL (Down col 4, rows 3-7)

    "3-4": "T",

    "4-4": "O", // Intersects SHORE

    "5-4": "W",

    "6-4": "E", // Intersects BEACH

    "7-4": "L",



    // 2D — CHAIR (Down col 9, rows 3-7)

    "3-9": "C",

    "4-9": "H",

    "5-9": "A", // Intersects SHADE

    "6-9": "I",

    "7-9": "R",



    // 3D — OCEAN (Down col 11, rows 3-7)

    "3-11": "O",

    "4-11": "C",

    "5-11": "E", // Intersects SHADE

    "6-11": "A",

    "7-11": "N",



    // 4A — SHORE (Across row 4, cols 2-6)

    "4-2": "S",

    "4-3": "H",

    // "4-4" is already O from TOWEL

    "4-5": "R",

    "4-6": "E",



    // 5A — SHADE (Across row 5, cols 7-11)

    "5-7": "S", // Intersects SHELL

    "5-8": "H",

    // "5-9" is already A from CHAIR

    "5-10": "D",

    // "5-11" is already E from OCEAN



    // 5D — SHELL (Down col 7, rows 5-9)

    // "5-7" is already S from SHADE

    "6-7": "H", // Intersects BEACH

    "7-7": "E",

    "8-7": "L",

    "9-7": "L",



    // 6A — BEACH (Across row 6, cols 3-7)

    "6-3": "B",

    // "6-4" is already E from TOWEL

    "6-5": "A",

    "6-6": "C",

    // "6-7" is already H from SHELL

  },

},





  //Shape 19

  10: {

  shapeIdx: 19,

  clueIdx: 19,

  theme: "Chemistry",

  tileLetters: {

     // 1A — ATOMS (Across row 2, cols 10-14)
    "2-10": "A", // Intersects ALLOY
    "2-11": "T",
    "2-12": "O",
    "2-13": "M",
    "2-14": "S",

    // 1D — ALLOY (Down col 10, rows 2-6)
    // "2-10" is already A from ATOMS
    "3-10": "L",
    "4-10": "L", // Intersects POLAR
    "5-10": "O",
    "6-10": "Y",

    // 2A — POLAR (Across row 4, cols 8-12)
    "4-8":  "P", // Intersects PHASE
    "4-9":  "O",
    // "4-10" is already L from ALLOY
    "4-11": "A",
    "4-12": "R", // Intersects REDOX

    // 2D — PHASE (Down col 8, rows 4-8)
    // "4-8" is already P from POLAR
    "5-8":  "H",
    "6-8":  "A",
    "7-8":  "S",
    "8-8":  "E", // Intersects WATER

    // 3D — REDOX (Down col 12, rows 4-8)
    // "4-12" is already R from POLAR
    "5-12": "E",
    "6-12": "D",
    "7-12": "O", // Intersects IONIC
    "8-12": "X",

    // 4A — IONIC (Across row 7, cols 11-15)
    "7-11": "I",
    // "7-12" is already O from REDOX
    "7-13": "N",
    "7-14": "I",
    "7-15": "C",

    // 5A — WATER (Across row 8, cols 5-9)
    "8-5":  "W",
    "8-6":  "A",
    "8-7":  "T",
    // "8-8" is already E from PHASE
    "8-9":  "R",
  },

},





 // Shape 20
11: {
  shapeIdx: 20,
  clueIdx: 20,
  theme: "OUTER SPACE",
  tileLetters: {
     // 1D — COMET (Down col 10, rows 4-8)
    "4-10": "C",
    "5-10": "O", // Intersects SOLAR
    "6-10": "M",
    "7-10": "E",
    "8-10": "T", // Intersects ORBIT

    // 2D — PROBE (Down col 13, rows 4-8)
    "4-13": "P",
    "5-13": "R", // Intersects SOLAR
    "6-13": "O",
    "7-13": "B", // Intersects BLACK
    "8-13": "E",

    // 3D — LUNAR (Down col 15, rows 4-8)
    "4-15": "L",
    "5-15": "U",
    "6-15": "N",
    "7-15": "A", // Intersects BLACK
    "8-15": "R",

    // 4D — DWARF (Down col 7, rows 5-9)
    "5-7":  "D",
    "6-7":  "W",
    "7-7":  "A",
    "8-7":  "R", // Intersects ORBIT
    "9-7":  "F",

    // 5A — SOLAR (Across row 5, cols 9-13)
    "5-9":  "S",
    // "5-10" is already O from COMET
    "5-11": "L",
    "5-12": "A",
    // "5-13" is already R from PROBE

    // 6A — BLACK (Across row 7, cols 13-17)
    // "7-13" is already B from PROBE
    "7-14": "L",
    // "7-15" is already A from LUNAR
    "7-16": "C",
    "7-17": "K",

    // 7A — ORBIT (Across row 8, cols 6-10)
    "8-6":  "O",
    // "8-7" is already R from DWARF
    "8-8":  "B",
    "8-9":  "I",
    // "8-10" is already T from COMET
  },
},





// Shape 21
12: {
  shapeIdx: 21,
  clueIdx: 21,
  theme: "Medieval Monarchy",

  tileLetters: {
    // 1D — QUEEN (Down col 9, rows 5-9)
    "5-9": "Q",
    "6-9": "U",
    "7-9": "E", // Intersects REIGN
    "8-9": "E",
    "9-9": "N", // Intersects CROWN

    // 2D — SWORD (Down col 6, rows 6-10)
    "6-6": "S",
    "7-6": "W",
    "8-6": "O",
    "9-6": "R", // Intersects CROWN
    "10-6": "D",

    // 3A — REIGN (Across row 7, cols 8-12)
    "7-8": "R",
    // "7-9" is already E from QUEEN
    "7-10": "I",
    "7-11": "G", // Intersects GUARD
    "7-12": "N",

    // 4D — GUARD (Down col 11, rows 7-11)
    // "7-11" is already G from REIGN
    "8-11": "U",
    "9-11": "A",
    "10-11": "R", // Intersects REALM
    "11-11": "D",

    // 5D — NOBLE (Down col 14, rows 7-11)
    "7-14": "N",
    "8-14": "O",
    "9-14": "B",
    "10-14": "L", // Intersects REALM
    "11-14": "E",

    // 6A — CROWN (Across row 9, cols 5-9)
    "9-5": "C",
    // "9-6" is already R from SWORD
    "9-7": "O",
    "9-8": "W",
    // "9-9" is already N from QUEEN

    // 7A — REALM (Across row 10, cols 11-15)
    // "10-11" is already R from GUARD
    "10-12": "E",
    "10-13": "A",
    // "10-14" is already L from NOBLE
    "10-15": "M",
  },
},






//Shape 22
13: {
  shapeIdx: 22,
  clueIdx: 22,
  theme: "Detective",
  tileLetters: {
    // 1D — SCENE (Down col 14, rows 3-7)
    "3-14": "S",
    "4-14": "C",
    "5-14": "E", // Intersects CHASE
    "6-14": "N",
    "7-14": "E",

    // 4A — CHASE (Across row 5, cols 10-14)
    "5-10": "C", // Intersects CRIME
    "5-11": "H",
    "5-12": "A", // Intersects BADGE
    "5-13": "S",
    // "5-14" is already E from SCENE

    // 2D — BADGE (Down col 12, rows 4-8)
    "4-12": "B",
    // "5-12" is already A from CHASE
    "6-12": "D",
    "7-12": "G",
    "8-12": "E",

    // 4D — CRIME (Down col 10, rows 5-9)
    // "5-10" is already C from CHASE
    "6-10": "R",
    "7-10": "I", // Intersects ALIBI
    "8-10": "M",
    "9-10": "E",

    // 5A — ALIBI (Across row 7, cols 6-10)
    "7-6":  "A",
    "7-7":  "L",
    "7-8":  "I", // Intersects THIEF
    "7-9":  "B",
    // "7-10" is already I from CRIME

    // 3D — THIEF (Down col 8, rows 5-9)
    "5-8":  "T",
    "6-8":  "H",
    // "7-8" is already I from ALIBI
    "8-8":  "E",
    "9-8":  "F", // Intersects PROOF

    // 6A — PROOF (Across row 9, cols 4-8)
    "9-4":  "P",
    "9-5":  "R",
    "9-6":  "O",
    "9-7":  "O",
    // "9-8" is already F from THIEF
  },
},








//Shape 23 Hospital
14: {
  shapeIdx: 23,
  clueIdx: 23,
  theme: "HOSPITAL",
  tileLetters: {
    // 1D — MEDIC (Down col 10, rows 2-6)
    "2-10": "M",
    "3-10": "E",
    "4-10": "D", // Intersects BLOOD
    "5-10": "I",
    "6-10": "C", // Intersects CHART

    // 2D — WOUND (Down col 8, rows 3-7)
    "3-8":  "W",
    "4-8":  "O", // Intersects BLOOD
    "5-8":  "U",
    "6-8":  "N", // Intersects ORGAN
    "7-8":  "D",

    // 3A — BLOOD (Across row 4, cols 6-10)
    "4-6":  "B",
    "4-7":  "L",
    // "4-8" is already O from WOUND
    "4-9":  "O",
    // "4-10" is already D from MEDIC

    // 4D — NURSE (Down col 13, rows 4-8)
    "4-13": "N",
    "5-13": "U",
    "6-13": "R", // Intersects CHART
    "7-13": "S",
    "8-13": "E", // Intersects PULSE

    // 5A — ORGAN (Across row 6, cols 4-8)
    "6-4":  "O",
    "6-5":  "R",
    "6-6":  "G",
    "6-7":  "A",
    // "6-8" is already N from WOUND

    // 6A — CHART (Across row 6, cols 10-14)
    // "6-10" is already C from MEDIC
    "6-11": "H",
    "6-12": "A",
    // "6-13" is already R from NURSE
    "6-14": "T",

    // 7A — PULSE (Across row 8, cols 9-13)
    "8-9":  "P",
    "8-10": "U",
    "8-11": "L",
    "8-12": "S",
    // "8-13" is already E from NURSE
  },
},








 //Shape 25 Library
15: {
  shapeIdx: 25,
  clueIdx: 25,
  theme: "Library",

  tileLetters: {
    // 1D — QUIET (Down col 7, rows 4-8)
    "4-7": "Q",
    "5-7": "U",
    "6-7": "I",
    "7-7": "E",
    "8-7": "T", // Intersects STUDY

    // 2D — STORY (Down col 10, rows 4-8)
    "4-10": "S",
    "5-10": "T",
    "6-10": "O", // Intersects NOVEL
    "7-10": "R",
    "8-10": "Y", // Intersects STUDY

    // 3D — SHELF (Down col 12, rows 4-8)
    "4-12": "S",
    "5-12": "H",
    "6-12": "E", // Intersects NOVEL
    "7-12": "L",
    "8-12": "F",

    // 4A — NOVEL (Across row 6, cols 9-13)
    "6-9":  "N",
    // "6-10" is already O from STORY
    "6-11": "V",
    // "6-12" is already E from SHELF
    "6-13": "L",

    // 5A — STUDY (Across row 8, cols 6-10)
    "8-6":  "S",
    // "8-7" is already T from QUIET
    "8-8":  "U",
    "8-9":  "D",
    // "8-10" is already Y from STORY
  },
},







// Shape 27 Courtroom
16: {
  shapeIdx: 27,
  clueIdx: 27,
  theme: "Courtroom",
  tileLetters: {
    // 1D — COURT (Down col 10, rows 3-7)
    "3-10": "C",
    "4-10": "O",
    "5-10": "U",
    "6-10": "R", // Intersects ORDER
    "7-10": "T", // Intersects TRIAL

    // 2D — PROOF (Down col 6, rows 4-8)
    "4-6":  "P",
    "5-6":  "R",
    "6-6":  "O", // Intersects ORDER
    "7-6":  "O",
    "8-6":  "F",

    // 3D — JUDGE (Down col 8, rows 4-8)
    "4-8":  "J",
    "5-8":  "U",
    "6-8":  "D", // Intersects ORDER
    "7-8":  "G",
    "8-8":  "E",

    // 4A — ORDER (Across row 6, cols 6-10)
    // "6-6" is already O from PROOF
    "6-7":  "R",
    // "6-8" is already D from JUDGE
    "6-9":  "E",
    // "6-10" is already R from COURT

    // 5A — TRIAL (Across row 7, cols 10-14)
    // "7-10" is already T from COURT
    "7-11": "R",
    "7-12": "I",
    "7-13": "A",
    "7-14": "L",
  },
},





// Shape 26  OFFICE

17: {
  shapeIdx: 26,
  clueIdx: 26,
  theme: "At the Office",

  tileLetters: {
    // 1D — STAFF (Down col 8, rows 4-8)
    "4-8":  "S",
    "5-8":  "T",
    "6-8":  "A", // Intersects CHAIR
    "7-8":  "F",
    "8-8":  "F",

    // 2D — PRINT (Down col 10, rows 5-9)
    "5-10": "P",
    "6-10": "R", // Intersects CHAIR
    "7-10": "I",
    "8-10": "N",
    "9-10": "T", // Intersects TABLE

    // 3D — EMAIL (Down col 13, rows 5-9)
    "5-13": "E",
    "6-13": "M",
    "7-13": "A",
    "8-13": "I",
    "9-13": "L", // Intersects TABLE

    // 4A — CHAIR (Across row 6, cols 6-10)
    "6-6":  "C",
    "6-7":  "H",
    // "6-8" is already A from STAFF
    "6-9":  "I",
    // "6-10" is already R from PRINT

    // 5A — TABLE (Across row 9, cols 10-14)
    // "9-10" is already T from PRINT
    "9-11": "A",
    "9-12": "B",
    // "9-13" is already L from EMAIL
    "9-14": "E",
  },
},



// Shape 28 Soccer

18: {
  shapeIdx: 28,
  clueIdx: 28,
  theme: "Football/Soccer Game",
  tileLetters: {
    // 1D — FIELD (Down col 13, rows 3-7)
    "3-13": "F",
    "4-13": "I",
    "5-13": "E",
    "6-13": "L",
    "7-13": "D", // Intersects CROWD

    // 2D — COACH (Down col 9, rows 4-8)
    "4-9":  "C",
    "5-9":  "O",
    "6-9":  "A",
    "7-9":  "C", // Intersects CROWD
    "8-9":  "H", // Intersects MATCH

    // 3D — SCORE (Down col 11, rows 5-9)
    "5-11": "S",
    "6-11": "C",
    "7-11": "O", // Intersects CROWD
    "8-11": "R",
    "9-11": "E",

    // 5A — CROWD (Across row 7, cols 9-13)
    // "7-9" is already C from COACH
    "7-10": "R",
    // "7-11" is already O from SCORE
    "7-12": "W",
    // "7-13" is already D from FIELD

    // 6A — MATCH (Across row 8, cols 5-9)
    "8-5":  "M",
    "8-6":  "A",
    "8-7":  "T",
    "8-8":  "C",
    // "8-9" is already H from COACH
  },
},






// Shape 29 Coffee Shop

19: {
  shapeIdx: 29,
  clueIdx: 29,
  theme: "Coffee Shop",
  tileLetters: {
    // 1A — CREAM (Across row 5, cols 5-9)
    "5-5": "C",
    "5-6": "R", // Intersects ROAST
    "5-7": "E",
    "5-8": "A",
    "5-9": "M",

    // 2D — ROAST (Down col 6, rows 5-9)
    // "5-6" is already R from CREAM
    "6-6": "O",
    "7-6": "A",
    "8-6": "S", // Intersects SUGAR
    "9-6": "T",

    // 4A — SUGAR (Across row 8, cols 6-10)
    // "8-6" is already S from ROAST
    "8-7": "U",
    "8-8": "G",
    "8-9": "A",
    "8-10": "R", // Intersects ORDER

    // 3D — ORDER (Down col 10, rows 7-11)
    "7-10": "O",
    // "8-10" is already R from SUGAR
    "9-10": "D",
    "10-10": "E",
    "11-10": "R", // Intersects DRINK

    // 5A — DRINK (Across row 11, cols 9-13)
    "11-9":  "D",
    // "11-10" is already R from ORDER
    "11-11": "I",
    "11-12": "N",
    "11-13": "K",
  },
},





// Shape 30 Aviation
20: {
  shapeIdx: 30,
  clueIdx: 30,
  theme: "Aviation",
  tileLetters: {
    // 1D — PILOT (Down col 13, rows 5-9)
    "5-13": "P",
    "6-13": "I", // Intersects CABIN
    "7-13": "L",
    "8-13": "O",
    "9-13": "T",

    // 2D — PLANE (Down col 7, rows 6-10)
    "6-7":  "P",
    "7-7":  "L",
    "8-7":  "A", // Intersects RADAR
    "9-7":  "N",
    "10-7": "E",

    // 3D — CARGO (Down col 10, rows 6-10)
    "6-10": "C", // Intersects CABIN
    "7-10": "A",
    "8-10": "R", // Intersects RADAR
    "9-10": "G",
    "10-10": "O",

    // 3A — CABIN (Across row 6, cols 10-14)
    // "6-10" is already C from CARGO
    "6-11": "A",
    "6-12": "B",
    // "6-13" is already I from PILOT
    "6-14": "N",

    // 4A — RADAR (Across row 8, cols 6-10)
    "8-6":  "R",
    // "8-7" is already A from PLANE
    "8-8":  "D",
    "8-9":  "A",
    // "8-10" is already R from CARGO
  },
},






// Shape 31 Classroom

21: {
  shapeIdx: 31,
  clueIdx: 31,
  theme: "Classroom",
  tileLetters: {
    // 1D — STUDY (Down col 7, rows 6-10)
    "6-7":  "S",
    "7-7":  "t",
    "8-7":  "u", // Intersects RULER
    "9-7":  "d",
    "10-7": "y",

    // 3A — RULER (Across row 8, cols 6-10)
    "8-6":  "R",
    // "8-7" is already u from STUDY
    "8-8":  "l",
    "8-9":  "e",
    "8-10": "r", // Intersects GRADE

    // 2D — GRADE (Down col 10, rows 7-11)
    "7-10": "G",
    // "8-10" is already r from RULER
    "9-10": "a",
    "10-10": "d",
    "11-10": "e", // Intersects LEARN

    // 5A — LEARN (Across row 11, cols 9-13)
    "11-9":  "L",
    // "11-10" is already e from GRADE
    "11-11": "a",
    "11-12": "r", // Intersects BOARD
    "11-13": "n",

    // 4D — BOARD (Down col 12, rows 8-12)
    "8-12":  "B",
    "9-12":  "o",
    "10-12": "a",
    // "11-12" is already r from LEARN
    "12-12": "d",
  },
},







// Shape 32
22: {
  shapeIdx: 32,
  clueIdx: 32,
  theme: "Dentist",
  tileLetters: {
    // 1D — FLOSS (Down col 6, rows 4-8)
    "4-6":  "f",
    "5-6":  "l",
    "6-6":  "o", // Intersects MOUTH
    "7-6":  "s",
    "8-6":  "s",

    // 2A — MOUTH (Across row 6, cols 5-9)
    "6-5":  "m",
    // "6-6" is already o from FLOSS
    "6-7":  "u",
    "6-8":  "t", // Intersects TOOTH
    "6-9":  "h",

    // 3D — TOOTH (Down col 8, rows 6-10)
    // "6-8" is already t from MOUTH
    "7-8":  "o",
    "8-8":  "o",
    "9-8":  "t",
    "10-8": "h", // Intersects WHITE

    // 5A — WHITE (Across row 10, cols 7-11)
    "10-7": "w",
    // "10-8" is already h from TOOTH
    "10-9": "i",
    "10-10": "t",
    "10-11": "e", // Intersects RINSE

    // 4D — RINSE (Down col 11, rows 6-10)
    "6-11": "r",
    "7-11": "i",
    "8-11": "n",
    "9-11": "s",
    // "10-11" is already e from WHITE
  },
},





// Shape 33 (-ace Rhyme Theme)
23: {
  shapeIdx: 33,
  clueIdx: 33,
  theme: "Words that end with \"ACE\"",
  tileLetters: {
    // 1B — Brace (Down col 12, rows 3-7)
    "3-12": "B",
    "4-12": "r",
    "5-12": "a", // Intersects place
    "6-12": "c",
    "7-12": "e", // Intersects Space

    // 2p — place (Across row 5, cols 10-14)
    "5-10": "p", // Intersects peace
    "5-11": "l",
    // "5-12" is already a from Brace
    "5-13": "c",
    "5-14": "e",

    // peace (Down col 10, rows 5-9)
    // "5-10" is already p from place
    "6-10": "e",
    "7-10": "a", // Intersects Space
    "8-10": "c",
    "9-10": "e", // Intersects Trace

    // 3S — Space (Across row 7, cols 8-12)
    "7-8":  "S",
    "7-9":  "p",
    // "7-10" is already a from peace
    "7-11": "c",
    // "7-12" is already e from Brace

    // 4T — Trace (Across row 9, cols 6-10)
    "9-6":  "T",
    "9-7":  "r",
    "9-8":  "a",
    "9-9":  "c",
    // "9-10" is already e from peace
  },
},







// Shape 34 (Double-Letter Theme)
24: {
  shapeIdx: 34,
  clueIdx: 34,
  theme: "Double-Letters",
  tileLetters: {
    // 1D — BLOOD (Down col 7, rows 3-7)
    "3-7":  "B",
    "4-7":  "l",
    "5-7":  "o",
    "6-7":  "o",
    "7-7":  "D", // Intersects DRESS

    // 2D — GLASS (Down col 11, rows 4-8)
    "4-11": "G",
    "5-11": "l", // Intersects FLOOR
    "6-11": "a",
    "7-11": "s", // Intersects DRESS
    "8-11": "S", // Intersects SPEED

    // 3A — FLOOR (Across row 5, cols 10-14)
    "5-10": "F",
    // "5-11" is already l from GLASS
    "5-12": "o",
    "5-13": "o",
    "5-14": "r",

    // 4A — DRESS (Across row 7, cols 7-11)
    // "7-7" is already D from BLOOD
    "7-8":  "r",
    "7-9":  "e",
    "7-10": "s",
    // "7-11" is already s from GLASS

    // 5A — SPEED (Across row 8, cols 11-15)
    // "8-11" is already S from GLASS
    "8-12": "p",
    "8-13": "e",
    "8-14": "e",
    "8-15": "d",
  },
},





// Shape 35 (Speed Theme - Final Mapping)
25: {
  shapeIdx: 35,
  clueIdx: 35,
  theme: "Words related to 'Fast'",
  tileLetters: {
    // 1R — RAPID (Down col 8, rows 4-8)
    "4-8":  "R",
    "5-8":  "a", // Intersects FLASH
    "6-8":  "p",
    "7-8":  "i",
    "8-8":  "d",

    // 2F — FLASH (Across row 5, cols 6-10)
    "5-6":  "F",
    "5-7":  "l",
    // "5-8" is already a from RAPID
    "5-9":  "s",
    "5-10": "H", // Intersects HASTE

    // 3H — HASTE (Down col 10, rows 5-9)
    // "5-10" is already H from FLASH
    "6-10": "a",
    "7-10": "s", // Intersects SWIFT
    "8-10": "t",
    "9-10": "e",

    // 5S — SWIFT (Across row 7, cols 10-14)
    // "7-10" is already s from HASTE
    "7-11": "w",
    "7-12": "i", // Intersects QUICK
    "7-13": "f",
    "7-14": "t",

    // 4Q — QUICK (Down col 12, rows 5-9)
    "5-12": "Q",
    "6-12": "u",
    // "7-12" is already i from SWIFT
    "8-12": "c",
    "9-12": "k",
  },
},











// Shape 36 (Painting Theme)
26: {
  shapeIdx: 36,
  clueIdx: 36,
  theme: "Canvas",
  tileLetters: {
    // 1A — brush (Across row 4, cols 11-15)
    "4-11": "b", // Intersects blend
    "4-12": "r",
    "4-13": "u",
    "4-14": "s", // Intersects shade
    "4-15": "h",

    // 1D — blend (Down col 11, rows 4-8)
    // "4-11" is already b
    "5-11": "l",
    "6-11": "e", // Intersects frame
    "7-11": "n",
    "8-11": "d",

    // 2D — shade (Down col 14, rows 4-8)
    // "4-14" is already s
    "5-14": "h",
    "6-14": "a",
    "7-14": "d",
    "8-14": "e",

    // 4A — frame (Across row 6, cols 7-11)
    "6-7": "f",
    "6-8": "r",
    "6-9": "a", // Intersects paint
    "6-10": "m",
    // "6-11" is already e

    // 3D — paint (Down col 9, rows 5-9)
    "5-9": "p",
    // "6-9" is already a
    "7-9": "i",
    "8-9": "n",
    "9-9": "t",
  },
},





// Shape 37 (Numbers Theme)
27: {
  shapeIdx: 37,
  clueIdx: 37,
  theme: "Numbers",
  tileLetters: {
    // 1A — SEVEN (Across row 3, cols 9-13)
    "3-9":  "S", // Intersects SIXTY
    "3-10": "E",
    "3-11": "V",
    "3-12": "E", // Intersects EIGHT
    "3-13": "N",

    // 1D — SIXTY (Down col 9, rows 3-7)
    // "3-9" is already S from SEVEN
    "4-9":  "I",
    "5-9":  "X",
    "6-9":  "T", // Intersects FORTY
    "7-9":  "Y",

    // 2D — EIGHT (Down col 12, rows 3-7)
    // "3-12" is already E from SEVEN
    "4-12": "I",
    "5-12": "G",
    "6-12": "H",
    "7-12": "T",

    // 4A — FORTY (Across row 6, cols 6-10)
    "6-6":  "F", // Intersects FIFTY
    "6-7":  "O",
    "6-8":  "R",
    // "6-9" is already T from SIXTY
    "6-10": "Y",

    // 3D — FIFTY (Down col 6, rows 4-8)
    "4-6":  "F",
    "5-6":  "I",
    // "6-6" is already F from FORTY
    "7-6":  "T",
    "8-6":  "Y",
  },
},






// Shape 38
28: {
  shapeIdx: 38,
  clueIdx: 38,
  theme: "Starts and Ends with the Same Letter",
  tileLetters: {
    // 1L — LEVEL (Across row 5, cols 5-9)
    "5-5":  "L",
    "5-6":  "e",
    "5-7":  "v",
    "5-8":  "E", // Intersects ERASE
    "5-9":  "l",

    // 2E — ERASE (Down col 8, rows 5-9)
    // "5-8" is already E from LEVEL
    "6-8":  "r",
    "7-8":  "A", // Intersects ALPHA
    "8-8":  "s",
    "9-8":  "e", // Intersects DRIED

    // 4A — ALPHA (Across row 7, cols 8-12)
    // "7-8" is already A from ERASE
    "7-9":  "L",
    "7-10": "P",
    "7-11": "H",
    "7-12": "A", // Intersects TOAST

    // 3T — TOAST (Down col 12, rows 5-9)
    "5-12": "T",
    "6-12": "o",
    // "7-12" is already A from ALPHA
    "8-12": "s",
    "9-12": "t",

    // 5D — DRIED (Across row 9, cols 5-9)
    "9-5":  "D",
    "9-6":  "r",
    "9-7":  "i",
    // "9-8" is already e from ERASE
    "9-9":  "d",
  },
},





// Shape 39
29: {
  shapeIdx: 39,
  clueIdx: 39,
  theme: "Things that are Round",
  tileLetters: {
    // 1D — DONUT (Down col 13, rows 3-7)
    "3-13": "D",
    "4-13": "o",
    "5-13": "n", // Intersects PENNY
    "6-13": "u",
    "7-13": "t",

    // 3P — PENNY (Across row 5, cols 10-14)
    "5-10": "P",
    "5-11": "e",
    "5-12": "n",
    // "5-13" is already n from DONUT
    "5-14": "y",

    // 3P — PLATE (Down col 10, rows 5-9)
    // "5-10" is already P from PENNY
    "6-10": "l",
    "7-10": "a",
    "8-10": "t",
    "9-10": "e", // Intersects GLOBE

    // 4G — GLOBE (Across row 9, cols 6-10)
    "9-6":  "G",
    "9-7":  "l", // Intersects WHEEL
    "9-8":  "o",
    "9-9":  "b",
    // "9-10" is already e from PLATE

    // 2W — WHEEL (Down col 7, rows 5-9)
    "5-7":  "W",
    "6-7":  "h",
    "7-7":  "e",
    "8-7":  "e",
    // "9-7" is already l from GLOBE
  },
},









// Shape 40
30: {
  shapeIdx: 40,
  clueIdx: 40,
  theme: "Silent First Letter",
  tileLetters: {
    // 1W — WRIST (Across row 5, cols 10-14)
    "5-10": "W",
    "5-11": "r",
    "5-12": "i",
    "5-13": "s",
    "5-14": "t",

    // 1W — WRITE (Down col 10, rows 5-9)
    // "5-10" is already W from WRIST
    "6-10": "r",
    "7-10": "i",
    "8-10": "t",
    "9-10": "e", // Intersects GNOME

    // 3G — GNOME (Across row 9, cols 6-10)
    "9-6":  "G",
    "9-7":  "n",
    "9-8":  "o", // Intersects KNOCK
    "9-9":  "m",
    // "9-10" is already e from WRITE

    // 2K — KNOCK (Down col 8, rows 7-11)
    "7-8":  "K",
    "8-8":  "n",
    // "9-8" is already o from GNOME
    "10-8": "c",
    "11-8": "k", // Intersects KNEEL

    // 4K — KNEEL (Across row 11, cols 8-12)
    // "11-8" is already k from KNOCK
    "11-9":  "n",
    "11-10": "e",
    "11-11": "e",
    "11-12": "l",
  },
},




// Shape 41
31: {
  shapeIdx: 41,
  clueIdx: 41,
  theme: "Tennis",
  tileLetters: {
    // 1F — FAULT (Down col 8, rows 5-9)
    "5-8":  "F",
    "6-8":  "A",
    "7-8":  "U", // Intersects DEUCE
    "8-8":  "L", // Intersects RALLY
    "9-8":  "T",

    // 3D — DEUCE (Across row 7, cols 6-10)
    "7-6":  "D",
    "7-7":  "E",
    // "7-8" is already U from FAULT
    "7-9":  "C",
    "7-10": "E", // Intersects SERVE

    // 2S — SERVE (Down col 10, rows 6-10)
    "6-10": "S",
    // "7-10" is already E from DEUCE
    "8-10": "R", // Intersects RALLY
    "9-10": "V",
    "10-10": "E",

    // 5R — RALLY (Across row 8, cols 10-14)
    // "8-10" is already R from SERVE
    "8-11": "A",
    "8-12": "L", // Intersects SLICE
    "8-13": "L",
    "8-14": "Y",

    // 4S — SLICE (Down col 12, rows 7-11)
    "7-12": "S",
    // "8-12" is already L from RALLY
    "9-12": "I",
    "10-12": "C",
    "11-12": "E",
  },
},





// Shape 42
32: {
  shapeIdx: 42,
  clueIdx: 42,
  theme: "Places of Residence",
  tileLetters: {
    // 1V — VILLA (Across row 4, cols 8-12)
    "4-8":  "V",
    "4-9":  "I",
    "4-10": "L",
    "4-11": "L", // Intersects LODGE
    "4-12": "A",

    // 2L — LODGE (Down col 11, rows 4-8)
    // "4-11" is already L from VILLA
    "5-11": "O",
    "6-11": "D", // Intersects CONDO
    "7-11": "G",
    "8-11": "E",

    // 3C — CONDO (Across row 6, cols 8-12)
    "6-8":  "C", // Intersects CABIN
    "6-9":  "O",
    "6-10": "N",
    // "6-11" is already D from LODGE
    "6-12": "O",

    // 3C — CABIN (Down col 8, rows 6-10)
    // "6-8" is already C from CONDO
    "7-8":  "A",
    "8-8":  "B",
    "9-8":  "I",
    "10-8": "N", // Intersects MANOR

    // 4M — MANOR (Across row 10, cols 6-10)
    "10-6": "M",
    "10-7": "A",
    // "10-8" is already N from CABIN
    "10-9": "O",
    "10-10": "R",
  },
},




// Shape 43
33: {
  shapeIdx: 43,
  clueIdx: 43,
  theme: "Small Amounts",
  tileLetters: {
    // 1O — OUNCE (Down col 13, rows 4-8)
    "4-13": "O",
    "5-13": "U",
    "6-13": "N", // Intersects PINCH
    "7-13": "C", // Intersects TRACE
    "8-13": "E",

    // 4P — PINCH (Across row 7, cols 10-14)
    "7-10": "P", // Intersects SPECK
    "7-11": "I",
    "7-12": "N",
    // "7-13" is already C from OUNCE
    "7-14": "H",

    // 5T — TRACE (Across row 8, cols 6-10)
    "8-6":  "T",
    "8-7":  "R", // Intersects SHRED
    "8-8":  "A",
    "8-9":  "C",
    // "8-10" is already E from SPECK

    // 2S — SHRED (Down col 7, rows 6-10)
    "6-7":  "S",
    "7-7":  "H",
    // "8-7" is already R from TRACE
    "9-7":  "E",
    "10-7": "D",

    // 3S — SPECK (Down col 10, rows 6-10)
    "6-10": "S",
    // "7-10" is already P from PINCH
    "8-10": "E", // Intersects TRACE
    "9-10": "C",
    "10-10": "K",
  },
},






// Shape 44
34: {
  shapeIdx: 44,
  clueIdx: 44,
  theme: "Emotions",
  tileLetters: {
    // 1B — BLISS (Down col 7, rows 3-7)
    "3-7":  "B",
    "4-7":  "L",
    "5-7":  "I", // Intersects SHAME
    "6-7":  "S",
    "7-7":  "S",

    // 5S — SHAME (Across row 6, cols 7-11)
    // "6-7" is already S from BLISS
    "6-8":  "H",
    "6-9":  "A",
    "6-10": "M",
    "6-11": "E", // Intersects ANGER

    // 2A — ANGER (Down col 11, rows 3-7)
    "3-11": "A",
    "4-11": "N",
    "5-11": "G", // Intersects GRIEF
    // "6-11" is already E from SHAME
    "7-11": "R",

    // 4G — GRIEF (Across row 5, cols 11-15)
    // "5-11" is already G from ANGER
    "5-12": "R",
    "5-13": "I", // Intersects PRIDE
    "5-14": "E",
    "5-15": "F",

    // 3P — PRIDE (Down col 13, rows 3-7)
    "3-13": "P",
    "4-13": "R",
    // "5-13" is already I from GRIEF
    "6-13": "D",
    "7-13": "E",
  },
},







// Shape 45
35: {
  shapeIdx: 45,
  clueIdx: 45,
  theme: "Story Elements",
  tileLetters: {
    // 1T — TWIST (Across row 4, cols 5-9)
    "4-5":  "T",
    "4-6":  "W",
    "4-7":  "I", // Intersects INTRO
    "4-8":  "S",
    "4-9":  "T",

    // 2I — INTRO (Down col 7, rows 4-8)
    // "4-7" is already I from TWIST
    "5-7":  "N",
    "6-7":  "T", // Intersects TITLE
    "7-7":  "R",
    "8-7":  "O",

    // 4T — TITLE (Across row 6, cols 7-11)
    // "6-7" is already T from INTRO
    "6-8":  "I",
    "6-9":  "T", // Intersects THEME
    "6-10": "L",
    "6-11": "E", // Intersects GENRE

    // 5T — THEME (Down col 9, rows 6-10)
    // "6-9" is already T from TITLE
    "7-9":  "H",
    "8-9":  "E",
    "9-9":  "M",
    "10-9": "E",

    // 3G — GENRE (Down col 11, rows 5-9)
    "5-11": "G",
    // "6-11" is already E from TITLE
    "7-11": "N",
    "8-11": "R",
    "9-11": "E",
  },
},







// Shape 46
36: {
  shapeIdx: 46,
  clueIdx: 46,
  theme: "Financial Terms",
  tileLetters: {
    // 1T — TOTAL (Down col 10, rows 3-7)
    "3-10": "T",
    "4-10": "O",
    "5-10": "T",
    "6-10": "A", // Intersects TRADE
    "7-10": "L",

    // 2M — MONEY (Down col 12, rows 3-7)
    "3-12": "M",
    "4-12": "O",
    "5-12": "N",
    "6-12": "E", // Intersects TRADE
    "7-12": "Y",

    // 4T — TRADE (Across row 6, cols 8-12)
    "6-8":  "T", // Intersects STOCK
    "6-9":  "R",
    // "6-10" is already A from TOTAL
    "6-11": "D",
    // "6-12" is already E from MONEY

    // 3S — STOCK (Down col 8, rows 5-9)
    "5-8":  "S",
    // "6-8" is already T from TRADE
    "7-8":  "O",
    "8-8":  "C", // Intersects PRICE
    "9-8":  "K",

    // 5P — PRICE (Across row 8, cols 5-9)
    "8-5":  "P",
    "8-6":  "R",
    "8-7":  "I",
    // "8-8" is already C from STOCK
    "8-9":  "E",
  },
},




// Shape 47
37: {
  shapeIdx: 47,
  clueIdx: 47,
  theme: "Speaking",
  tileLetters: {
    // 1Q — QUOTE (Down col 10, rows 3-7)
    "3-10": "Q",
    "4-10": "U",
    "5-10": "O", // Intersects VOICE
    "6-10": "T",
    "7-10": "E", // Intersects UTTER

    // 2P — PLEAD (Down col 13, rows 3-7)
    "3-13": "P",
    "4-13": "L",
    "5-13": "E", // Intersects VOICE
    "6-13": "A",
    "7-13": "D",

    // 4V — VOICE (Across row 5, cols 9-13)
    "5-9":  "V",
    // "5-10" is already O from QUOTE
    "5-11": "I",
    "5-12": "C",
    // "5-13" is already E from PLEAD

    // 3S — SHOUT (Down col 7, rows 4-8)
    "4-7":  "S",
    "5-7":  "H",
    "6-7":  "O",
    "7-7":  "U", // Intersects UTTER
    "8-7":  "T",

    // 5U — UTTER (Across row 7, cols 7-11)
    // "7-7" is already U from SHOUT
    "7-8":  "T",
    "7-9":  "T",
    // "7-10" is already E from QUOTE
    "7-11": "R",
  },
},




// Shape 48
42: {
  shapeIdx: 48,
  clueIdx: 48,
  theme: "Units of Measurement",
  tileLetters: {
    // 1M — METER (Down col 6, rows 2-6)
    "2-6":  "M",
    "3-6":  "E",
    "4-6":  "T", // Intersects CUBIT
    "5-6":  "E",
    "6-6":  "R", // Intersects GRAIN

    // 3C — CUBIT (Across row 4, cols 2-6)
    "4-2":  "C", // Intersects SCALE
    "4-3":  "U",
    "4-4":  "B",
    "4-5":  "I",
    // "4-6" is already T from METER

    // 2S — SCALE (Down col 2, rows 3-7)
    "3-2":  "S",
    // "4-2" is already C from CUBIT
    "5-2":  "A",
    "6-2":  "L",
    "7-2":  "E",

    // 5G — GRAIN (Across row 6, cols 5-9)
    "6-5":  "G",
    // "6-6" is already R from METER
    "6-7":  "A",
    "6-8":  "I", // Intersects LITER
    "6-9":  "N",

    // 4L — LITER (Down col 8, rows 5-9)
    "5-8":  "L",
    // "6-8" is already I from GRAIN
    "7-8":  "T",
    "8-8":  "E",
    "9-8":  "R",
  },
},










// Shape 49
41: {
  shapeIdx: 49,
  clueIdx: 49,
  theme: "Car Parts",
  tileLetters: {
    // 1B — BRAKE (Down col 4, rows 4-8)
    "4-4":  "B",
    "5-4":  "R", // Intersects MOTOR
    "6-4":  "A",
    "7-4":  "K",
    "8-4":  "E", // Intersects WHEEL

    // 3M — MOTOR (Across row 5, cols 0-4)
    "5-0":  "M",
    "5-1":  "O",
    "5-2":  "T",
    "5-3":  "O",
    // "5-4" is already R from BRAKE

    // 2P — PANEL (Across row 4, cols 6-10)
    "4-6":  "P",
    "4-7":  "A",
    "4-8":  "N",
    "4-9":  "E",
    "4-10": "L",

    // 2P — PEDAL (Down col 6, rows 4-8)
    // "4-6" is already P from PANEL
    "5-6":  "E",
    "6-6":  "D",
    "7-6":  "A",
    "8-6":  "L", // Intersects WHEEL

    // 4W — WHEEL (Across row 8, cols 2-6)
    "8-2":  "W",
    "8-3":  "H",
    // "8-4" is already E from BRAKE
    "8-5":  "E",
    // "8-6" is already L from PEDAL
  },
},




// Shape 50
40: {
  shapeIdx: 50,
  clueIdx: 50,
  theme: "At School",
  tileLetters: {
    // 1P — PUPIL (Across row 5, cols 0-4)
    "5-0":  "P",
    "5-1":  "U",
    "5-2":  "P",
    "5-3":  "I",
    "5-4":  "L", // Intersects LEARN

    // 2L — LEARN (Down col 4, rows 4-8)
    "4-4":  "L",
    // "5-4" is already L from PUPIL
    "6-4":  "A", // Intersects GRADE
    "7-4":  "R",
    "8-4":  "N",

    // 4G — GRADE (Across row 8, cols 2-6)
    "8-2":  "G",
    "8-3":  "R",
    // "8-4" is already A from LEARN
    "8-5":  "D",



  },
},

// Shape 49
41: {
  shapeIdx: 49,
  clueIdx: 49,
  theme: "Car Parts",
  tileLetters: {
    // 1B — BRAKE (Down col 4, rows 4-8)
    "4-4":  "B",
    "5-4":  "R", // Intersects MOTOR
    "6-4":  "A",
    "7-4":  "K",
    "8-4":  "E", // Intersects WHEEL

    // 3M — MOTOR (Across row 5, cols 0-4)
    "5-0":  "M",
    "5-1":  "O",
    "5-2":  "T",
    "5-3":  "O",
    // "5-4" is already R from BRAKE

    // 2P — PANEL (Across row 4, cols 6-10)
    "4-6":  "P",
    "4-7":  "A",
    "4-8":  "N",
    "4-9":  "E",
    "4-10": "L",

    // 2P — PEDAL (Down col 6, rows 4-8)
    // "4-6" is already P from PANEL
    "5-6":  "E",
    "6-6":  "D",
    "7-6":  "A",
    "8-6":  "L", // Intersects WHEEL

    // 4W — WHEEL (Across row 8, cols 2-6)
    "8-2":  "W",
    "8-3":  "H",
    // "8-4" is already E from BRAKE
    "8-5":  "E",
    // "8-6" is already L from PEDAL
  },
},





};

// deterministic PRNG (so everyone gets the same daily puzzle)

function mulberry32(seed) {

  let a = seed >>> 0;

  return function () {

    a |= 0;

    a = (a + 0x6d2b79f5) | 0;

    let t = Math.imul(a ^ (a >>> 15), 1 | a);

    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;

  };

}

function buildTileSetFromCoords(coords) {

  const tileSet = new Set();

  for (const [r, c] of coords) tileSet.add(tileKey(r, c));

  return tileSet;

}

/**

 * ✅ NEW: Compact render grid

 * - Removes empty “gap columns” so the grid never wraps or looks cut off.

 * - Also helps enforce “max 5 columns worth of actual tiles” visually (no wasted columns).

 */

function buildRenderGridMetaFromTileSet(tileSet) {

  const rowsUsed = new Set();

  const colsUsed = new Set();

  for (const k of tileSet) {

    const [r, c] = parseTileKey(k);

    rowsUsed.add(r);

    colsUsed.add(c);

  }

  const rowVals = Array.from(rowsUsed).sort((a, b) => a - b);

  const colVals = Array.from(colsUsed).sort((a, b) => a - b);

  const rowIndex = new Map(rowVals.map((v, i) => [v, i]));

  const colIndex = new Map(colVals.map((v, i) => [v, i]));

  const grid = Array.from({ length: rowVals.length }, () => Array(colVals.length).fill(false));

  for (const k of tileSet) {

    const [r, c] = parseTileKey(k);

    const rr = rowIndex.get(r);

    const cc = colIndex.get(c);

    if (rr != null && cc != null) grid[rr][cc] = true;

  }

  return {

    grid,

    rowVals, // displayRow -> realRow

    colVals, // displayCol -> realCol

  };

}

// Derive word tiles by walking from the start until the next tile is missing from tileSet.

function deriveWordTiles(word, tileSet) {

  const tiles = [];

  let r = word.row;

  let c = word.col;

  if (!tileSet.has(tileKey(r, c))) return [];

  while (tileSet.has(tileKey(r, c))) {

    tiles.push({ row: r, col: c, key: tileKey(r, c) });

    if (word.dir === "across") c += 1;

    else r += 1;

  }

  return tiles;

}

/**

 * Build crossword word-clues automatically:

 */

function deriveWordsFromShape(tileSet) {

  const tiles = Array.from(tileSet).map((k) => {

    const [r, c] = parseTileKey(k);

    return { r, c, k };

  });

  const has = (r, c) => tileSet.has(tileKey(r, c));

  let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity;

for (const t of tiles) {

  if (t.r < minR) minR = t.r;

  if (t.r > maxR) maxR = t.r;

  if (t.c < minC) minC = t.c;

  if (t.c > maxC) maxC = t.c;

}

  const starts = [];

  for (let r = minR; r <= maxR; r++) {

   for (let c = minC; c <= maxC; c++) {

      if (!has(r, c)) continue;

      const leftMissing = !has(r, c - 1);

      const upMissing = !has(r - 1, c);

      const acrossLen = leftMissing ? countRun(has, r, c, 0, 1) : 0;

      const downLen = upMissing ? countRun(has, r, c, 1, 0) : 0;

      const hasAcross = acrossLen >= 3;

      const hasDown = downLen >= 3;

      if (hasAcross || hasDown) {

        starts.push({ r, c, hasAcross, acrossLen, hasDown, downLen });

      }

    }

  }

  starts.sort((a, b) => (a.r !== b.r ? a.r - b.r : a.c - b.c));

  const words = {};

  let number = 0;

  for (const s of starts) {

    number += 1;

    if (s.hasAcross) {

      const id = `${number}A`;

      words[id] = {

        id,

        number,

        dir: "across",

        row: s.r,

        col: s.c,

        length: s.acrossLen,

        answer: "",

      };

    }

    if (s.hasDown) {

      const id = `${number}D`;

      words[id] = {

        id,

        number,

        dir: "down",

        row: s.r,

        col: s.c,

        length: s.downLen,

        answer: "",

      };

    }

  }

  return words;

}

function countRun(hasFn, r, c, dr, dc) {

  let L = 0;

  let rr = r;

  let cc = c;

  while (hasFn(rr, cc)) {

    L += 1;

    rr += dr;

    cc += dc;

  }

  return L;

}

function getShapeBounds(tileSet) {

  let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity;

  for (const k of tileSet) {

    const [r, c] = parseTileKey(k);

    if (r < minR) minR = r;

    if (r > maxR) maxR = r;

    if (c < minC) minC = c;

    if (c > maxC) maxC = c;

  }

  return { width: maxC - minC + 1, height: maxR - minR + 1 };

}

function isShapeAllowed(tileSet) {

  // 1) word length rules

  const words = deriveWordsFromShape(tileSet);

  for (const w of Object.values(words)) {

    if (w.dir === "across" && w.length > MAX_ACROSS_LEN) return false;

    if (w.dir === "down" && w.length > MAX_DOWN_LEN) return false;

  }

  // 2) screen-fit rule (bounding box)

  const { width, height } = getShapeBounds(tileSet);

  if (width > MAX_GRID_WIDTH) return false;

  if (height > MAX_GRID_HEIGHT) return false;

  return true;

}







function getDailyPuzzle(now = new Date()) {

  const day = getPuzzleNumberSinceLaunch(now);

  const override = DAILY_OVERRIDES[day] || null;

  const rng = mulberry32(day * 1337 + 42);





  // Theme (unchanged)

  const clueIdx = override?.clueIdx ?? Math.floor(rng() * CLUES.length);

  // Build list of allowed shapes

  const allowedShapeIdxs = [];

  for (let i = 0; i < SHAPES.length; i++) {

    const ts = buildTileSetFromCoords(SHAPES[i]);

    if (isShapeAllowed(ts)) allowedShapeIdxs.push(i);

  }

  // Choose shape:

  // - If override forces a shape, we use it ONLY if it passes rules

  // - Otherwise pick randomly from allowed shapes only

  let shapeIdx;

  if (override?.shapeIdx != null) {

    shapeIdx = override.shapeIdx;

    const forcedSet = buildTileSetFromCoords(SHAPES[shapeIdx]);

    if (!isShapeAllowed(forcedSet)) {

      shapeIdx = allowedShapeIdxs.length ? allowedShapeIdxs[0] : 0;

    }

  } else {

    if (allowedShapeIdxs.length) {

      shapeIdx = allowedShapeIdxs[Math.floor(rng() * allowedShapeIdxs.length)];

    } else {

      shapeIdx = 0; // fallback if somehow all shapes are invalid

    }

  }

  const coords = SHAPES[shapeIdx];

  const tileSet = buildTileSetFromCoords(coords);

  const words = deriveWordsFromShape(tileSet);

  return {

    day,

    clue: `Clue: ${CLUES[clueIdx]}`,

    maxSubmissions: MAX_SUBMISSIONS,

    words,

    tileSet,

    forcedTileLetters: override?.tileLetters || null,

	clueAllowance: override?.clueAllowance ?? 4, // ✅ NEW



  };

}

/**

 * FEEDBACK (duplicate-letter behavior)

 */

function computeFeedback(answerChars, guessChars) {

  const out = Array(guessChars.length).fill("absent");

  // Count letters in answer (ignore null/empty)

  const remaining = {};

  for (let i = 0; i < answerChars.length; i++) {

    const a = (answerChars[i] || "").toUpperCase();

    if (!a) continue;

    remaining[a] = (remaining[a] || 0) + 1;

  }

  // 1) First pass: mark greens and "spend" those letters

  for (let i = 0; i < guessChars.length; i++) {

    const a = (answerChars[i] || "").toUpperCase();

    const g = (guessChars[i] || "").toUpperCase();

    if (!a) continue; // safety

    if (g === a) {

      out[i] = "correct";

      remaining[g] -= 1; // spend one

    }

  }

  // 2) Second pass: mark yellows only if letter still remains

  for (let i = 0; i < guessChars.length; i++) {

    if (out[i] === "correct") continue;

    const g = (guessChars[i] || "").toUpperCase();

    if (!g) continue;

    if ((remaining[g] || 0) > 0) {

      out[i] = "present";

      remaining[g] -= 1; // spend one yellow

    } else {

      out[i] = "absent";

    }

  }

  return out;

}



// =========================

//  MERGE STATE (global best color)

// =========================

const STATE_RANK = {

  empty: 0,

  absent: 1,

  present: 2,

  correct: 3,

};



function mergeState(a, b) {

  const ca = a ?? "empty";

  const cb = b ?? "empty";

  return STATE_RANK[cb] > STATE_RANK[ca] ? cb : ca;

}



function computeGlobalCellState(feedbackByWord) {

  const out = {}; // tileKey -> best state

  for (const wId of Object.keys(feedbackByWord || {})) {

    const map = feedbackByWord[wId] || {};

    for (const k of Object.keys(map)) {

      out[k] = mergeState(out[k], map[k]);

    }

  }

  return out;

}



/**

 * Display state for a tile

 */





function pickDisplayState({

  tileKey: k,

  feedbackByWord,

  selectedWord,

  latestTouch,

  lastViewed,

  wordsAtTileCount,

  derivedWordsById,

  globalCellState,





}) {

  const isIntersecting = (wordsAtTileCount[k] || 0) > 1;



  const selectedHasTile =

    selectedWord &&

    (derivedWordsById[selectedWord]?.tiles || []).some(t => t.key === k);



  const selectedDir = selectedWord

    ? derivedWordsById[selectedWord]?.dir

    : null;



  // Helper to render arrow only when meaningful

  const arrowFor = (wordId, state) => {

    if (!isIntersecting) return null;

    if (state === "correct") return null;

    return derivedWordsById[wordId]?.dir ?? null;

  };



  // 1️ Selected word always wins if it uses this tile

  if (selectedWord && selectedHasTile) {

    const st = feedbackByWord[selectedWord]?.[k] ?? null;

    return {

      state: st,

      arrow: arrowFor(selectedWord, st),

    };

  }









   // 2️ Last viewed word should win (your “last selected word” rule)

  const viewed = lastViewed?.[k];

  if (viewed && feedbackByWord[viewed.wordId]?.[k]) {

    return {

      state: feedbackByWord[viewed.wordId][k],

      arrow: arrowFor(viewed.wordId, feedbackByWord[viewed.wordId][k]),

    };

  }



  // 3️ Otherwise fall back to last submitted / touched word

  const touch = latestTouch?.[k];

  if (touch && feedbackByWord[touch.wordId]?.[k]) {

    return {

      state: feedbackByWord[touch.wordId][k],

      arrow: arrowFor(touch.wordId, feedbackByWord[touch.wordId][k]),

    };

  }





  // 4️ Global best-known state (never downgrade)

  const g = globalCellState?.[k];

  if (g && g !== "empty") {

    return { state: g, arrow: null };

  }



  return { state: null, arrow: null };

}













/**

 * ===== Crossword solution generator (kept) =====

 */

function generateCrosswordSolution(derivedWordsById, tileToWords, tileSet) {

  const wordIds = Object.keys(derivedWordsById);

  const wordsMeta = wordIds.map((id) => {

    const w = derivedWordsById[id];

    const L = w.tiles.length;

    const provided = (w.answer || "").toUpperCase();

    return {

      id,

      L,

      provided,

      constraintScore: w.tiles.reduce((acc, t) => acc + ((tileToWords[t.key] || []).length > 1 ? 1 : 0), 0),

    };

  });

  wordsMeta.sort((a, b) => {

    if (b.constraintScore !== a.constraintScore) return b.constraintScore - a.constraintScore;

    return a.L - b.L;

  });

  const dictForLen = (L) => {

    const arr = VALID_WORDS[L] || [];

    return arr.map((x) => x.toUpperCase()).filter((x) => x.length === L);

  };

  const assignedWord = {};

  const assignedTile = {};

  const fitsWord = (wId, candidate) => {

    const tiles = derivedWordsById[wId].tiles;

    for (let i = 0; i < tiles.length; i++) {

      const k = tiles[i].key;

      const need = assignedTile[k];

      const ch = candidate[i];

      if (need && need !== ch) return false;

    }

    return true;

  };

  const placeWord = (wId, candidate) => {

    const tiles = derivedWordsById[wId].tiles;

    const touched = [];

    for (let i = 0; i < tiles.length; i++) {

      const k = tiles[i].key;

      if (!assignedTile[k]) {

        assignedTile[k] = candidate[i];

        touched.push(k);

      }

    }

    assignedWord[wId] = candidate;

    return touched;

  };

  const unplaceWord = (wId, touchedKeys) => {

    delete assignedWord[wId];

    for (const k of touchedKeys) delete assignedTile[k];

  };

  const buildCandidates = (meta) => {

    const { L, provided } = meta;

    const dict = dictForLen(L);

    const out = [];

    if (provided && provided.length === L) {

      const inDict = dict.length === 0 ? true : dict.includes(provided);

      if (inDict) out.push(provided);

    }

    for (const w of dict) {

      if (w !== out[0]) out.push(w);

    }

    return out;

  };

  const backtrack = (i) => {

    if (i >= wordsMeta.length) return true;

    const meta = wordsMeta[i];

    const wId = meta.id;

    if (assignedWord[wId]) return backtrack(i + 1);

    const candidates = buildCandidates(meta).filter((cand) => fitsWord(wId, cand));

    for (const cand of candidates) {

      const touched = placeWord(wId, cand);

      if (backtrack(i + 1)) return true;

      unplaceWord(wId, touched);

    }

    return false;

  };

  const ok = backtrack(0);

  if (!ok) {

    const fallbackAnswerByWord = {};

    const fallbackTileMap = {};

    for (const k of tileSet) fallbackTileMap[k] = null;

    for (const wId of wordIds) {

      const w = derivedWordsById[wId];

      const L = w.tiles.length;

      const provided = (w.answer || "").toUpperCase();

      let ans = provided.length === L ? provided : (provided + "AAAAAAA").slice(0, L);

      const chars = ans.split("");

      for (let i = 0; i < w.tiles.length; i++) {

        const k = w.tiles[i].key;

        if (fallbackTileMap[k] && fallbackTileMap[k] !== chars[i]) {

          chars[i] = fallbackTileMap[k];

        } else if (!fallbackTileMap[k]) {

          fallbackTileMap[k] = chars[i];

        }

      }

      ans = chars.join("");

      fallbackAnswerByWord[wId] = ans;

      for (let i = 0; i < w.tiles.length; i++) {

        fallbackTileMap[w.tiles[i].key] = ans[i];

      }

    }

    return {

      ok: false,

      answerByWord: fallbackAnswerByWord,

      tileAnswerMap: fallbackTileMap,

    };

  }

  const tileAnswerMap = {};

  for (const k of tileSet) tileAnswerMap[k] = null;

  for (const wId of wordIds) {

    const w = derivedWordsById[wId];

    const ans = assignedWord[wId];

    for (let i = 0; i < w.tiles.length; i++) {

      tileAnswerMap[w.tiles[i].key] = ans[i];

    }

  }

  return { ok: true, answerByWord: { ...assignedWord }, tileAnswerMap };

}

// ---- UI-only helper for flip reveal animation ----

function stateToBg(state) {

  if (state === "correct") return WORDLE.green;

  if (state === "present") return WORDLE.yellow;

  if (state === "absent") return WORDLE.gray;

  return WORDLE.emptyBg;

}

function stateToBorder(state) {

  if (state === "correct") return WORDLE.green;

  if (state === "present") return WORDLE.yellow;

  if (state === "absent") return WORDLE.gray;

  return WORDLE.emptyBorder;

}

function stateToText(state) {

  if (state === "correct" || state === "present" || state === "absent") return WORDLE.textLight;

  return WORDLE.textDark;

}

// UI constants for reveal timing

const REVEAL_INTERVAL_MS = 350; // slower stagger between flips to match Wordle feel









// =========================

//  DAILY CLUES (fixed amount per puzzle/day)

// =========================



// per-day keys (no carryover)

const dayTokensKey = (dayNum) => `cw_clues_remaining_day_${dayNum}_v2`;

const dayUnlocksKey = (dayNum) => `cw_clues_unlocked_day_${dayNum}_v2`;

const daySpentKey  = (dayNum) => `cw_clues_spent_day_${dayNum}_v2`; // ✅ NEW

const daySaveKey = (dayNum) => `cw_save_day_${dayNum}_v2`;





// Per-day word clues (only defining Day 18 for now: Road Trip!)

const WORD_CLUES_BY_DAY = {





   //Animals



  1: {

    "2D": "Laughing African carnivore",

    "1A": "Someone who blindly follows the crowd",

    "6A": "A deceitful person",

    "4D": "It moves slow as shell",

	"7A": "Largest wild cat",

    "3D": "Killer or gray",

	"5A": "\"I'm so hungry i could eat a _____\"",

  },









    //Things to do with Time

  2: {

    "4D": "\"Even a broken _____ is right twice a day\"",

    "1D": "The time from sunset to sunrise",

    "6A": "February",

    "7A": "Comes before tomorrow but after yesterday",

    "2D": "Arriving with time to spare",

    "5A": "Time on the go",

	"3D": "Mobile",

  },







     //thinking

  3: {

    "4A": "Lightbulbs in cartoons",

    "1D": "Center of attention",

    "6A": "Give it some thought",

    "2A": "Using Reason over vibes",

	"2D": "Go from confused to capable",

    "5A": "Big-brain",

	"3D": "Your mental CPU",

  },









     //Positive emotions

  4: {

    "4D": "Kids meal at McDonald's",

    "1D": "Far from cowardice",

    "6A": "Pleased with oneself",   //maybe good maybe bad, might change idk

    "7A": "Gesture made with a V",

	"2D": "Picture day at school",

    "5A": "\"Chill, dude\"",

	"3D": "A group of lions",

  },











      //Universe/space



  5: {

    "4D": "Lights on stage",

    "1D": "Goes between words",

    "4A": "Determined by seasons, not crescents",

    "5A": "Home to over eight billion people",

	"2D": "Islamic calendar",

    "6A": "Circular path in space",

	"3D": "Cosmic Snowball",

  },









      //Pirate



 6: {

    "4D": "Crown piece",

    "1D": "Spoils of war",

    "2A": "Medieval weapon",

    "5A": "Man of steal",

	"2D": "Case for the brain",

    "6A": "Upper body",

	"3A": "Core exercise that feels like the longest minute",

  },







   //Campfire



  7: {

    "2D": "Rock used to make sparks",

    "1A": "Something that can set off alarms",

    "4A": "Attach with glue",

    "5A": "Dress alike",

	"2A": "Blaze of fire",

    "3D": "Glowing coal",

	"1D": "Flash of electricity",

  },

























};


function WordHistoryRow({ snap, tiles, size = 24, gap = 3 }) {
  return (
    <div style={{ display: "flex", gap, alignItems: "center" }}>
      {(tiles || []).map((t) => {
        const letter = (snap?.cells?.[t.key] || "").toUpperCase();
        const fb = snap?.feedback?.[t.key];
        let bg = WORDLE.emptyBg;
        let color = WORDLE.textDark;
        if (fb === "correct") { bg = WORDLE.green; color = WORDLE.textLight; }
        else if (fb === "present") { bg = WORDLE.yellow; color = WORDLE.textLight; }
        else if (fb === "absent") { bg = WORDLE.gray; color = WORDLE.textLight; }
        return (
          <div key={t.key} style={{
            width: size, height: size,
            borderRadius: Math.max(3, Math.round(size * 0.18)),
            background: bg, color,
            fontSize: Math.round(size * 0.52),
            fontWeight: 800,
            display: "flex", alignItems: "center", justifyContent: "center",
            border: fb ? "none" : `1px solid ${WORDLE.emptyBorder}`,
            flexShrink: 0, boxSizing: "border-box",
          }}>{letter}</div>
        );
      })}
    </div>
  );
}




function HoldToUnlockSlot({

  locked,

  disabled,

  unlockedLabel = "Unlocked",

  holdMs = 700,

  startDelayMs = 120,

  onUnlock,

  _capture,

  dimWhenUnlocked = true, // ✅ NEW (defaults to current behavior)

}) {







  const HOLD_MS = holdMs;

  const START_DELAY_MS = startDelayMs;

















  const rafRef = React.useRef(null);

  const startRef = React.useRef(0);

  const delayRef = React.useRef(null);

  const [p, setP] = React.useState(0);









  const stop = React.useCallback(() => {

    setP(0);

    if (delayRef.current) clearTimeout(delayRef.current);

    delayRef.current = null;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    rafRef.current = null;

    startRef.current = 0;

  }, []);



  const tick = React.useCallback(

    function tickFrame(t) {

      if (!startRef.current) startRef.current = t;

      const elapsed = t - startRef.current;

      const next = Math.min(1, elapsed / HOLD_MS);

      setP(next);



      if (next >= 1) {

        stop();

        onUnlock?.();

        return;

      }

      rafRef.current = requestAnimationFrame(tickFrame);

    },

    [HOLD_MS, onUnlock, stop]

  );



  const begin = React.useCallback(() => {

    if (!locked || disabled) return;

    delayRef.current = setTimeout(() => {

      startRef.current = 0;

      rafRef.current = requestAnimationFrame(tick);

    }, START_DELAY_MS);

  }, [START_DELAY_MS, locked, disabled, tick]);



  // ✅ expose begin/stop to parent so holding on the whole row works

  React.useEffect(() => {

    _capture?.(begin, stop);

  }, [begin, stop, _capture]);



  React.useEffect(() => () => stop(), [stop]);



  return (

<div

  className={`unlockSlot ${disabled ? "disabled" : ""} ${locked ? "" : "unlocked"} ${

    !locked && dimWhenUnlocked ? "dimUnlocked" : ""

  }`}

>

      {locked && <div className="unlockFill" style={{ transform: `scaleX(${p})` }} />}

      <div className="unlockText">

        {!locked ? (

          <div>{unlockedLabel}</div>

        ) : (

          <>

            <div>Hold to</div>

            <div>Unlock</div>

          </>

        )}

      </div>

    </div>

  );

}







function UndoGlyph({ size = 22 }) {

  return (

    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">

      <path

        d="M26 18 L14 30 L26 42"

        fill="none"

        stroke="currentColor"

        strokeWidth="6"

        strokeLinecap="round"

        strokeLinejoin="round"

      />

      <path

        d="M16 30 H36 C48 30 54 36 54 46"

        fill="none"

        stroke="currentColor"

        strokeWidth="6"

        strokeLinecap="round"

        strokeLinejoin="round"

      />

    </svg>

  );

}









export default function Kazwordi() {



// ✅ deterministic initial puzzle (same on server + client)

// BUT: we do NOT show it. We show a loading shell until client computes the real day.



const [PUZZLE, setPUZZLE] = useState(() => {
  if (typeof window === "undefined") return getDailyPuzzle(getLocalLaunchDate());
  return getDailyPuzzle(new Date());
});

const [puzzleReady, setPuzzleReady] = useState(false);





// ✅ on mount, compute puzzle using the player's device timezone (Wordle-like local midnight)

useEffect(() => {

  setPUZZLE(getDailyPuzzle(new Date()));

  setPuzzleReady(true);

}, []);









  // ✅ Wordle-like: refresh at next local midnight (NO early return above this!)

  useEffect(() => {

    const now = new Date();

    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    const ms = nextMidnight.getTime() - now.getTime() + 250;



    const t = window.setTimeout(() => {

      window.location.reload();

    }, ms);



    const onVis = () => {

      if (document.visibilityState !== "visible") return;

      const currentDay = getPuzzleNumberSinceLaunch(new Date());

      if (currentDay !== PUZZLE.day) window.location.reload();

    };



    document.addEventListener("visibilitychange", onVis);

    return () => {

      clearTimeout(t);

      document.removeEventListener("visibilitychange", onVis);

    };

  }, [PUZZLE.day]);



  const WORDS_DECLARED = PUZZLE.words;







  // ✅ puzzle number comes from PUZZLE.day (already “since launch” now)

	const puzzleNumber = PUZZLE.day;

	const CLUE_ALLOWANCE = PUZZLE.clueAllowance ?? 4;



  const tileSet = useMemo(() => PUZZLE.tileSet, [PUZZLE.tileSet]);

  // ✅ render meta (compact grid)

  const renderMeta = useMemo(() => buildRenderGridMetaFromTileSet(tileSet), [tileSet]);

  const renderGrid = renderMeta.grid;

  const derivedWordsById = useMemo(() => {

    const out = {};

    for (const [id, w] of Object.entries(WORDS_DECLARED)) {

      out[id] = { ...w, tiles: deriveWordTiles(w, tileSet) };

    }

    return out;

  }, [WORDS_DECLARED, tileSet]);





















  const tileToWords = useMemo(() => {

    const map = {};

    for (const [id, w] of Object.entries(derivedWordsById)) {

      for (const t of w.tiles) {

        map[t.key] = map[t.key] || [];

        map[t.key].push(id);

      }

    }

    for (const k of Object.keys(map)) {

      map[k].sort((a, b) => {

        const wa = derivedWordsById[a];

        const wb = derivedWordsById[b];

        if (wa.dir === wb.dir) return 0;

        return wa.dir === "across" ? -1 : 1;

      });

    }

    return map;

  }, [derivedWordsById]);

  const wordsAtTileCount = useMemo(() => {

    const counts = {};

    for (const [k, arr] of Object.entries(tileToWords)) counts[k] = arr.length;

    return counts;

  }, [tileToWords]);

  /**

   * ✅ Solution:

   */

  const solution = useMemo(() => {

    if (PUZZLE.forcedTileLetters) {

      const tileAnswerMap = {};

      for (const k of tileSet) tileAnswerMap[k] = null;

      for (const [k, ch] of Object.entries(PUZZLE.forcedTileLetters)) {

        if (tileSet.has(k)) tileAnswerMap[k] = (ch || "").toUpperCase();

      }

      const answerByWord = {};

      for (const [id, w] of Object.entries(derivedWordsById)) {

        const letters = w.tiles.map((t) => tileAnswerMap[t.key] || "");

        answerByWord[id] = letters.join("");

      }

      return { ok: true, answerByWord, tileAnswerMap };

    }

    return generateCrosswordSolution(derivedWordsById, tileToWords, tileSet);

  }, [PUZZLE.forcedTileLetters, derivedWordsById, tileToWords, tileSet]);

  const tileAnswerMap = solution.tileAnswerMap;

  const answerCharsByWord = useMemo(() => {

    const out = {};

    for (const [id, w] of Object.entries(derivedWordsById)) {

      out[id] = w.tiles.map((t) => tileAnswerMap[t.key] || null);

    }

    return out;

  }, [derivedWordsById, tileAnswerMap]);

  // ===== State =====

  const [cells, setCells] = useState(() => {

    const init = {};

    for (const k of tileSet) init[k] = { letter: "" };

    return init;

  });







  const [feedbackByWord, setFeedbackByWord] = useState({});

  // =========================

// ✅ SAVE/LOAD GAME (per puzzle day)

// =========================

useEffect(() => {

  if (!puzzleReady) return;



 const dayNum = puzzleNumber;

  // ----- ONE-TIME MIGRATION: fix puzzle number offset -----
  const MIGRATION_FLAG_KEY = 'kzw_migrated_to_local_date_v1';
  try {
    const migrated = localStorage.getItem(MIGRATION_FLAG_KEY);
    if (!migrated) {
      const possibleOldNumbers = [dayNum - 1, dayNum + 1];
      for (const old of possibleOldNumbers) {
        const oldRaw = localStorage.getItem(daySaveKey(old));
        if (oldRaw) {
          try {
            const oldData = JSON.parse(oldRaw);
            if (!localStorage.getItem(daySaveKey(dayNum))) {
              localStorage.setItem(daySaveKey(dayNum), JSON.stringify(oldData));
            }
            localStorage.removeItem(daySaveKey(old));
          } catch {}
          break;
        }
      }
      localStorage.setItem(MIGRATION_FLAG_KEY, '1');
    }
  } catch {}
  // ----- end migration -----

  try {
    const raw = localStorage.getItem(daySaveKey(dayNum));
    if (raw) {

const saved = JSON.parse(raw);

// ✅ Guard: if the saved cells don’t match today’s puzzle shape, it’s stale data
// from a different day (timezone migration side-effect) — ignore it entirely.
if (saved?.cells) {
  const savedKeys = Object.keys(saved.cells);
  const allBelong = savedKeys.every(k => tileSet.has(k));
  const sameCount = savedKeys.length === tileSet.size;
  if (!allBelong || !sameCount) throw new Error('stale save – shape mismatch');
}

// restore what matters for "refresh keeps your progress"
if (saved?.cells) setCells(saved.cells);
if (saved?.feedbackByWord) setFeedbackByWord(saved.feedbackByWord);

      if (saved?.latestTouch) setLatestTouch(saved.latestTouch);

      if (saved?.lastViewed) setLastViewed(saved.lastViewed);

      if (saved?.submitHistoryByWord) setSubmitHistoryByWord(saved.submitHistoryByWord);

      if (saved?.keyStatesByWord) setKeyStatesByWord(saved.keyStatesByWord);

      if (saved?.submissions != null) setSubmissions(saved.submissions);

      if (saved?.wordAttempts) setWordAttempts(saved.wordAttempts);

      if (saved?.wordSolvedEver) setWordSolvedEver(saved.wordSolvedEver);

      if (saved?.editedSinceSubmit) setEditedSinceSubmit(saved.editedSinceSubmit);

      if (saved?.greenEverTiles) setGreenEverTiles(saved.greenEverTiles);

      if (saved?.gameOver != null) setGameOver(saved.gameOver);

      if (saved?.didWin != null) setDidWin(saved.didWin);



      // optional (safe): restore selection

      if (saved?.selectedWord !== undefined) setSelectedWord(saved.selectedWord);

      if (saved?.focusedKey !== undefined) setFocusedKey(saved.focusedKey);



      return;

    }

  } catch {

    // ignore parse errors

  }



  // no save found → initialize blank for THIS tileSet

  const init = {};

  for (const k of tileSet) init[k] = { letter: "" };

  setCells(init);

  setFeedbackByWord({});

  setLatestTouch({});

  setLastViewed({});

  setSubmitHistoryByWord({});

  setKeyStatesByWord({});

  setSelectedWord(null);

  setFocusedKey(null);

  setSubmissions(0);

  setWordAttempts({});

  setWordSolvedEver({});

  setEditedSinceSubmit({});

  setGreenEverTiles({});

  setGameOver(false);

  setDidWin(false);

}, [puzzleReady, puzzleNumber, tileSet]);



  // ✅ Global best-known state for each tile across ALL words

const globalCellState = useMemo(() => {

  return computeGlobalCellState(feedbackByWord);

}, [feedbackByWord]);











  const retypeCacheRef = useRef({});

  const [latestTouch, setLatestTouch] = useState({});

  const [lastViewed, setLastViewed] = useState({});

  const [submitHistoryByWord, setSubmitHistoryByWord] = useState({});

  const [keyStatesByWord, setKeyStatesByWord] = useState({});

  const [selectedWord, setSelectedWord] = useState(null);

  const [focusedKey, setFocusedKey] = useState(null);





  // ===== Loaded dictionary from public/words.txt =====

  const MAX_DICT_LEN = Math.max(MAX_ACROSS_LEN, MAX_DOWN_LEN);



  const [dictByLen, setDictByLen] = useState(() => {

  const obj = {};

  for (let L = 3; L <= MAX_DICT_LEN; L++) obj[L] = new Set();

  return obj;

});



  const [dictLoaded, setDictLoaded] = useState(false);

    // ✅ Refs so keyboard Enter always uses the latest dictionary (fixes stale closure bug)

  const dictByLenRef = useRef(dictByLen);

  const dictLoadedRef = useRef(dictLoaded);

  useEffect(() => {

    dictByLenRef.current = dictByLen;

    dictLoadedRef.current = dictLoaded;

  }, [dictByLen, dictLoaded]);

  // put this INSIDE Kazwordi(), after dictByLen + dictLoaded

    // ✅ Dictionary validation (uses refs so keyboard Enter always sees latest dict)

  const isValidWord = (word, answerOverride = null) => {

   const W = (word || "").toUpperCase();

    const L = W.length;

    // Always allow the true answer (even if not in list)

    if (answerOverride && W === String(answerOverride).toUpperCase()) return true;

    // If dictionary isn't loaded yet, block guesses (so it doesn't accept random words)

    if (!dictLoadedRef.current) return false;

    const set = dictByLenRef.current?.[L];

    if (!set) return false;

    return set.has(W);

  };





	useEffect(() => {

	  let cancelled = false;

	  async function loadWords() {

		try {

	  const res = await fetch("/words.txt");

	  const text = await res.text();



	  const next = {};

	  for (let L = 3; L <= MAX_DICT_LEN; L++) next[L] = new Set();



	  // Bulletproof parsing: splits on ANY non-letter

	  const parts = text.toUpperCase().split(/[^A-Z]+/);

	  for (const raw of parts) {

		const w = raw.trim();

		if (!w) continue;

		const L = w.length;

		if (L >= 3 && L <= MAX_DICT_LEN) next[L].add(w);

	  }



	  if (!cancelled) {

		setDictByLen(next);

		setDictLoaded(true);

	  }

	} catch (err) {

	  console.error("Failed to load words.txt", err);

	}



  }





  loadWords();

  return () => {

    cancelled = true;

  };

}, []);

  const [submissions, setSubmissions] = useState(0);

  const [wordAttempts, setWordAttempts] = useState({});

  const [wordSolvedEver, setWordSolvedEver] = useState({});



  const [editedSinceSubmit, setEditedSinceSubmit] = useState({});

  const [greenEverTiles, setGreenEverTiles] = useState({}); // tileKey -> correctLetter









  const [gameOver, setGameOver] = useState(false);

  const [didWin, setDidWin] = useState(false);





  useEffect(() => {

  if (!puzzleReady) return;



  const dayNum = puzzleNumber;

  const payload = {

    cells,

    feedbackByWord,

    latestTouch,

    lastViewed,

    submitHistoryByWord,

    keyStatesByWord,

    submissions,

    wordAttempts,

    wordSolvedEver,

    editedSinceSubmit,

    greenEverTiles,

    gameOver,

    didWin,

    selectedWord,

    focusedKey,

  };



  try {

    localStorage.setItem(daySaveKey(dayNum), JSON.stringify(payload));

  } catch {}

}, [

  puzzleReady,

  puzzleNumber,

  cells,

  feedbackByWord,

  latestTouch,

  lastViewed,

  submitHistoryByWord,

  keyStatesByWord,

  submissions,

  wordAttempts,

  wordSolvedEver,

  editedSinceSubmit,

  greenEverTiles,

  gameOver,

  didWin,

  selectedWord,

  focusedKey,

]);





const [showResults, setShowResults] = useState(false); //

const [showPartialWarning, setShowPartialWarning] = useState(false);

const [showThemeBanner, setShowThemeBanner] = useState(false);



  const [stats, setStats] = useState(null);

		useEffect(() => {

		  setStats(readStats());

		}, []);



  const [lastShareText, setLastShareText] = useState("");

  const [revealAnim, setRevealAnim] = useState({ runId: 0, tiles: {} });

  const revealTimerRef = useRef(null);

  const cluesScrollRef = useRef(null);

  const suppressClueAutoScrollRef = useRef(false);

  const allowClueAutoScrollRef = useRef(false); // ✅ NEW (shared gate)





const mobileUnlockBeginRef = useRef(null);

  const mobileUnlockStopRef  = useRef(null);

  const mobilePressRef = useRef(false);

  const mobileNoClueTimerRef = useRef(null);



  /**

   * ✅ UPDATED TOAST SYSTEM

   */

  const [toasts, setToasts] = useState([]);

  const toastTimerRef = useRef(null);

  const toastSwipeStartY = useRef(null);

const toastSwipeOffset = useRef(0);

  const showToasts = (msgs) => {

  const arr = (Array.isArray(msgs) ? msgs : [msgs]).filter(Boolean);

  if (!arr.length) return;

  setToasts(arr);

  if (toastTimerRef.current) clearTimeout(toastTimerRef.current);







// ✅ Give more time if there are multiple messages (DESKTOP ONLY)

const base = 5200; // 1 toast

const perExtra = 2200; // extra time per additional toast



// ✅ MOBILE: always use the single-toast time

const duration = isMobile ? base : base + (arr.length - 1) * perExtra;



toastTimerRef.current = setTimeout(() => {

  setToasts([]);

}, duration);









};











// ✅ Results modal toast (does NOT affect layout)

const [resultToast, setResultToast] = useState("");

const resultToastTimerRef = useRef(null);

const showResultToast = (msg) => {

  if (!msg) return;

  setResultToast(msg);

  if (resultToastTimerRef.current) clearTimeout(resultToastTimerRef.current);

  resultToastTimerRef.current = setTimeout(() => {

    setResultToast("");

  }, 1800); // tweak duration if you want

};

  const [showHelp, setShowHelp] = useState(false);













// =========================

//  DAILY CLUES STATE (per puzzle day)

// =========================

const [clueTokens, setClueTokens] = useState(0);



const [unlockedCluesByDay, setUnlockedCluesByDay] = useState({}); // keep same shape

const [spentCluesByDay, setSpentCluesByDay] = useState({}); // ✅ NEW (only what you actually spent)





// Load remaining clues + unlocks for THIS puzzle day

useEffect(() => {

  const dayNum = puzzleNumber;

  try {

    const rawTokens = localStorage.getItem(dayTokensKey(dayNum));

    const rawUnlocks = localStorage.getItem(dayUnlocksKey(dayNum));

	const rawSpent = localStorage.getItem(daySpentKey(dayNum)); // ✅ NEW





	const t = rawTokens == null ? 0 : parseInt(rawTokens, 10);

	setClueTokens(Number.isFinite(t) ? t : 0);





    const u = rawUnlocks ? JSON.parse(rawUnlocks) : {};

    // store under { [dayNum]: {...} } to match your existing helpers

    setUnlockedCluesByDay({ [dayNum]: (u && typeof u === "object") ? u : {} });



	const s = rawSpent ? JSON.parse(rawSpent) : {}; // ✅ NEW

setSpentCluesByDay({ [dayNum]: (s && typeof s === "object") ? s : {} }); // ✅ NEW





  } catch {

	setClueTokens(0);

    setUnlockedCluesByDay({ [dayNum]: {} });

	  setSpentCluesByDay({ [dayNum]: {} }); // ✅ NEW



  }

}, [puzzleNumber]);



// Persist remaining clues for THIS puzzle day

useEffect(() => {

  const dayNum = puzzleNumber;

  try {

    localStorage.setItem(dayTokensKey(dayNum), String(clueTokens));

  } catch {}

}, [clueTokens, puzzleNumber]);



// Persist unlocks for THIS puzzle day

useEffect(() => {

  const dayNum = puzzleNumber;

  try {

    const dayMap = unlockedCluesByDay?.[dayNum] || {};

    localStorage.setItem(dayUnlocksKey(dayNum), JSON.stringify(dayMap));

  } catch {}

}, [unlockedCluesByDay, puzzleNumber]);





useEffect(() => {

  const dayNum = puzzleNumber;

  try {

    const dayMap = unlockedCluesByDay?.[dayNum] || {};

    localStorage.setItem(dayUnlocksKey(dayNum), JSON.stringify(dayMap));

  } catch {}

}, [unlockedCluesByDay, puzzleNumber]);



useEffect(() => {

  const dayNum = puzzleNumber;

  try {

    const spentMap = spentCluesByDay?.[dayNum] || {};

    localStorage.setItem(daySpentKey(dayNum), JSON.stringify(spentMap));

  } catch {}

}, [spentCluesByDay, puzzleNumber]);









useEffect(() => {

  if (!gameOver) return;



  const dayNum = puzzleNumber;



  // Build all word IDs from derivedWordsById (safe + always accurate)

  const allIds = Object.keys(derivedWordsById || {});



  setUnlockedCluesByDay((prev) => {

    const next = { ...(prev || {}) };

    const dayMap = { ...(next[dayNum] || {}) };



    let changed = false;

    for (const id of allIds) {

      const hasClue = Boolean(getClueTextForDay(dayNum, id));

      if (hasClue && !dayMap[id]) {

        dayMap[id] = true;

        changed = true;

      }

    }



    if (!changed) return prev;

    next[dayNum] = dayMap;

    return next;

  });



  setClueTokens(0);

}, [gameOver, puzzleNumber, derivedWordsById]);



















const getDayUnlockMap = (dayNum) => {

  const m = unlockedCluesByDay?.[dayNum];

  return m && typeof m === "object" ? m : {};

};



const isClueUnlockedForDay = (dayNum, wordId) => {

  const m = getDayUnlockMap(dayNum);

  return Boolean(m?.[wordId]);

};



const getClueTextForDay = (dayNum, wordId) => {

  return WORD_CLUES_BY_DAY?.[dayNum]?.[wordId] || "";

};











  const unlockClueForWord = (wId) => {

  const dayNum = puzzleNumber;

  if (!wId) return;



  const clueText = getClueTextForDay(dayNum, wId);

  if (!clueText) {

    showToasts("No clue available for this word yet");

    return;

  }



  if (wordSolvedEver?.[wId]) {

    showToasts("That word is already solved");

    return;

  }



  if (isClueUnlockedForDay(dayNum, wId)) {

    showToasts("Clue already unlocked");

    return;

  }



  if (clueTokens <= 0) {

    showToasts("No clues available");

    return;

  }



  setClueTokens((prev) => Math.max(0, prev - 1));

  setUnlockedCluesByDay((prev) => {

    const next = { ...(prev || {}) };

    const dayMap = { ...(next[dayNum] || {}) };

    dayMap[wId] = true;

    next[dayNum] = dayMap;

    return next;

  });





  // ✅ NEW: track what you actually spent (never auto-fill this on gameOver)

setSpentCluesByDay((prev) => {

  const next = { ...(prev || {}) };

  const dayMap = { ...(next[dayNum] || {}) };

  dayMap[wId] = true;

  next[dayNum] = dayMap;

  return next;

});





  showToasts(`Clue unlocked for ${wId}`);

};





  useEffect(() => {

  try {

    const seen = localStorage.getItem(HELP_SEEN_KEY);

    if (!seen) {

      setShowHelp(true);

      localStorage.setItem(HELP_SEEN_KEY, "1");

    }

  } catch {

    // ignore

  }

}, []);









  // ===== Helpers =====

  const getWordsAtTile = (k) => (tileToWords[k] || []).map((id) => derivedWordsById[id]);

  const getSelectedTiles = (wId) => (wId ? derivedWordsById[wId]?.tiles || [] : []);







const cycleWordOnTileClick = (k) => {

const wordsAt = getWordsAtTile(k);

if (wordsAt.length === 0) return;

allowClueAutoScrollRef.current = true; // ✅ NEW: grid click should scroll panel



if (!selectedWord) {





setSelectedWord(wordsAt[0].id);

setFocusedKey(k);













const S0 = stateRef.current;

if (S0) recomputeWordFeedbackLive(S0, wordsAt[0].id);

syncGlobalGreensToWord(wordsAt[0].id);

restoreWordFeedbackOnSelect(wordsAt[0].id);

return;

}



const idx = wordsAt.findIndex((w) => w.id === selectedWord);

const next = idx === -1 ? wordsAt[0] : wordsAt[(idx + 1) % wordsAt.length];



setSelectedWord(next.id);

setFocusedKey(k);

const S0 = stateRef.current;

if (S0) recomputeWordFeedbackLive(S0, next.id);

syncGlobalGreensToWord(next.id);

restoreWordFeedbackOnSelect(next.id);















};





  const clearFeedbackAtTileForAllWords = (k) => {

    const wordIds = tileToWords[k] || [];

    if (wordIds.length === 0) return;

    setFeedbackByWord((prev) => {

      const next = { ...prev };

      for (const wId of wordIds) {

        if (!next[wId] || !next[wId][k]) continue;

        next[wId] = { ...next[wId] };

        delete next[wId][k];

      }

      return next;

    });

    setLatestTouch((prev) => {

      if (!prev[k]) return prev;

      const next = { ...prev };

      delete next[k];

      return next;

    });

    setLastViewed((prev) => {

      if (!prev[k]) return prev;

      const next = { ...prev };

      delete next[k];

      return next;

    });

  };

  const setLetterAt = (k, letter) => {

    setCells((prev) => ({

      ...prev,

      [k]: { letter },

    }));

  };

  const allTilesGreenFromFeedback = (fbByWord) => {

    const isTileGreen = (k) => {

      for (const id of Object.keys(fbByWord)) {

        if (fbByWord[id]?.[k] === "correct") return true;

      }

      return false;

    };

    return Object.values(derivedWordsById).every((wd) => wd.tiles.every((t) => isTileGreen(t.key)));

  };

















  const wordIsEmptyInCells = (S, wId) => {

  const tiles = derivedWordsById[wId]?.tiles || [];

  if (!tiles.length) return true;

  return tiles.every((t) => !(S.cells[t.key]?.letter || "").trim());

};

const wordIsCompleteInCells = (S, wId) => {

  const tiles = derivedWordsById[wId]?.tiles || [];

  if (!tiles.length) return false;

  return tiles.every((t) => (S.cells[t.key]?.letter || "").trim());

};

const wordIsPartialBeyondAllowedKeys = (S, wId, allowedKeysSet) => {

  if (wordIsEmptyInCells(S, wId)) return false;

  if (wordIsCompleteInCells(S, wId)) return false;

  const tiles = derivedWordsById[wId]?.tiles || [];

  for (const t of tiles) {

    const k = t.key;

    const hasLetter = (S.cells[k]?.letter || "").trim();

    if (hasLetter && !allowedKeysSet.has(k)) return true;

  }

  return false;

};











	 const getLastSubmittedSnap = (S, wId) => {

	  const hist = S.submitHistoryByWord?.[wId];

	  if (!hist || hist.length === 0) return null;

	  return hist[hist.length - 1];

	};



	const getPrevSubmittedSnap = (S, wId) => {

const hist = S.submitHistoryByWord?.[wId];

if (!hist || hist.length < 2) return null;

return hist[hist.length - 2];

};







const getBestSnapForTile = (S, wId, k, nextLetter) => {

const hist = S.submitHistoryByWord?.[wId];

if (!hist || hist.length === 0) return null;

for (let i = hist.length - 1; i >= 0; i--) {

const snap = hist[i];

const snapLetter = (snap.cells?.[k] || "").toUpperCase();

if (snapLetter !== nextLetter) continue;

if (!snap.feedback?.[k]) continue;

return snap;

}

return null;

};






const restoreWordFeedbackOnSelect = (wId) => {
const S = stateRef.current;
if (!S) return;
const tiles = derivedWordsById[wId]?.tiles || [];
if (!tiles.length) return;
const wordHasHistory = (S.submitHistoryByWord?.[wId]?.length || 0) > 0;
setFeedbackByWord((prev) => {
let next = prev;
for (const t of tiles) {
const k = t.key;
const currentLetter = (S.cells?.[k]?.letter || "").toUpperCase();
if (!currentLetter) continue;
if (prev[wId]?.[k]) continue; // already has feedback, skip
if (wordHasHistory) {
const snap = getBestSnapForTile(S, wId, k, currentLetter);
if (snap?.feedback?.[k]) {
if (next === prev) next = { ...prev };
next[wId] = { ...(next[wId] || {}) };
next[wId][k] = snap.feedback[k];
continue;
}
}


// For intersection tiles: only copy from sharing words if this word has no history.
// If this word was submitted, its own snap is authoritative — sharing word colors don't apply.
if ((wordsAtTileCount[k] || 0) > 1 && !wordHasHistory) {
for (const otherId of (tileToWords[k] || []).filter(id => id !== wId)) {
// Check live React state first (most up-to-date, not affected by stateRef timing)
const liveFb = prev[otherId]?.[k];
if (liveFb) {
if (next === prev) next = { ...prev };
next[wId] = { ...(next[wId] || {}) };
next[wId][k] = liveFb;
break;
}
// Fall back to historical snap
const otherSnap = getBestSnapForTile(S, otherId, k, currentLetter);
if (otherSnap?.feedback?.[k]) {
if (next === prev) next = { ...prev };
next[wId] = { ...(next[wId] || {}) };
next[wId][k] = otherSnap.feedback[k];
break;
}
}
}









}
return next;
});
};






















const syncGlobalGreensToWord = (wId) => {

const tiles = derivedWordsById[wId]?.tiles || [];

if (!tiles.length) return;

const S = stateRef.current;

setFeedbackByWord((prev) => {

const existingFb = prev[wId] || {};

if (!Object.keys(existingFb).length) return prev;

let next = prev;

for (const t of tiles) {

const k = t.key;

if (prev[wId]?.[k] === "correct") continue;

// only sync green if the current cell letter is actually the correct answer

const currentLetter = (S?.cells?.[k]?.letter || "").toUpperCase();

const correctAnswer = (tileAnswerMap?.[k] || "").toUpperCase();

if (!currentLetter || !correctAnswer || currentLetter !== correctAnswer) continue;

const sharingWords = tileToWords[k] || [];

let globallyCorrect = false;

for (const otherId of sharingWords) {

if (otherId === wId) continue;

if (prev[otherId]?.[k] === "correct") { globallyCorrect = true; break; }

}

if (!globallyCorrect) continue;

if (next === prev) next = { ...prev };

next[wId] = { ...(next[wId] || {}) };

next[wId][k] = "correct";

}

return next;

});

};



















const recomputeWordFeedbackLive = (S, wId, overrideCells = {}) => {

const tiles = derivedWordsById[wId]?.tiles || [];

if (!tiles.length) return;

if (!(S.submitHistoryByWord?.[wId]?.length > 0)) return;

const lettersNow = tiles.map((t) => {

if (overrideCells.hasOwnProperty(t.key)) return overrideCells[t.key];

return (S.cells?.[t.key]?.letter || "").toUpperCase();

});

const answerChars = answerCharsByWord[wId] || Array(tiles.length).fill(null);

setFeedbackByWord((prev) => {

const existingFb = prev[wId] || {};

const maskedGuess = tiles.map((t, i) => {
  if (existingFb[t.key]) return lettersNow[i] || "\x00";
  const letter = lettersNow[i];
  if (!letter) return "\x00";
  const snap = getBestSnapForTile(S, wId, t.key, letter);
  if (snap?.feedback?.[t.key]) return letter;
  return "\x00";
});

let next = prev;

// Part 1: update tiles that already have feedback (duplicate-letter safe)

if (Object.keys(existingFb).length > 0) {

const hasSomeLetters = tiles.some((t, i) =>

existingFb[t.key] && maskedGuess[i] !== "\x00"

);

if (hasSomeLetters) {

const computed = computeFeedback(answerChars, maskedGuess);

for (let i = 0; i < tiles.length; i++) {

const k = tiles[i].key;

if (!existingFb[k]) continue;

if (maskedGuess[i] === "\x00") continue;

if (!computed[i]) continue;

if (computed[i] === existingFb[k]) continue;

if (next === prev) next = { ...prev };

next[wId] = { ...(next[wId] || {}) };

next[wId][k] = computed[i];

}

}

}

// Part 2: restore feedback from history for tiles that lost their feedback

// (e.g. wiped by clearFeedbackAtTileForAllWords when an intersecting word was edited)

for (let i = 0; i < tiles.length; i++) {

const k = tiles[i].key;

if (existingFb[k]) continue; // already has feedback, skip

const letter = lettersNow[i];

if (!letter) continue;

const snap = getBestSnapForTile(S, wId, k, letter);

if (snap?.feedback?.[k]) {

if (next === prev) next = { ...prev };

next[wId] = { ...(next[wId] || {}) };

next[wId][k] = snap.feedback[k];

}

}

return next;

});

};









  const wordHasChangedSinceLastSubmit = (S, wId) => {

    const snap = getLastSubmittedSnap(S, wId);

    const tiles = derivedWordsById[wId]?.tiles || [];

    if (!snap || !snap.cells) return true;

    for (const t of tiles) {

      const now = (S.cells[t.key]?.letter || "").toUpperCase();

      const then = (snap.cells[t.key] || "").toUpperCase();

      if (now !== then) return true;

    }

    return false;

  };

  const getWordStringFromCells = (S, wId) => {

    const tiles = derivedWordsById[wId]?.tiles || [];

    return tiles.map((t) => (S.cells[t.key]?.letter || "").toUpperCase()).join("");

  };

  useEffect(() => {

    if (!selectedWord) return;

    const w = derivedWordsById[selectedWord];

    if (!w) return;

    setLastViewed((prev) => {

      let next = prev;

      for (const t of w.tiles) {

        const k = t.key;

        if ((wordsAtTileCount[k] || 0) <= 1) continue;

        const st = feedbackByWord[selectedWord]?.[k];

        if (!st || st === "correct") continue;

        if (next === prev) next = { ...prev };

        next[k] = { wordId: selectedWord, dir: w.dir, state: st };

      }

      return next;

    });

  }, [selectedWord, feedbackByWord, derivedWordsById, wordsAtTileCount]);

  // Share: build output string

  const buildShareTextFromState = (S, fbByWord, didWinLocal) => {

  const PLACEHOLDER = "⭕"; // ✅ red hollow circle placeholder



	    // ✅ IMPORTANT: compute global cell state from the fbByWord SNAPSHOT

  const globalFromSnapshot = computeGlobalCellState(fbByWord);







    const solvedTileKeys = new Set();

for (const [wId, solved] of Object.entries(S.wordSolvedEver || {})) {

if (solved && derivedWordsById[wId]) {

for (const t of derivedWordsById[wId].tiles) solvedTileKeys.add(t.key);

}

}

const charForCell = (r, c) => {

const isCell = renderGrid[r][c];

if (!isCell) return PLACEHOLDER;

const realR = renderMeta.rowVals[r];

const realC = renderMeta.colVals[c];

const k = tileKey(realR, realC);

const { state } = pickDisplayState({

tileKey: k,

feedbackByWord: fbByWord,

selectedWord: null,

latestTouch: S.latestTouch || {},

lastViewed: S.lastViewed || {},

wordsAtTileCount,

derivedWordsById,

globalCellState: globalFromSnapshot,



      });

    if (solvedTileKeys.has(k)) return "🟩";

return "⬜";

    };



    const lines = [];

	lines.push(`KAZWORD #${puzzleNumber}`);













    lines.push("");



	for (let r = 0; r < renderGrid.length; r++) {

  let rowStr = "";

  for (let c = 0; c < renderGrid[r].length; c++) {

    rowStr += charForCell(r, c);

  }

  lines.push(rowStr);

}







    lines.push("");

    lines.push(`Attempts: ${didWinLocal ? S.submissions : "X"}/${MAX_SUBMISSIONS}`);

    const ids = Object.keys(derivedWordsById);

    ids.sort((a, b) => {

      const wa = derivedWordsById[a];

      const wb = derivedWordsById[b];

      if ((wa.number || 0) !== (wb.number || 0)) return (wa.number || 0) - (wb.number || 0);

      const da = wa.dir === "across" ? 0 : 1;

      const db = wb.dir === "across" ? 0 : 1;

      if (da !== db) return da - db;

      return a.localeCompare(b);

    });







    for (const id of ids) {

  const n = S.wordAttempts[id] || 0;

const mark = S.wordSolvedEver?.[id] ? "🟩" : "⬜";



lines.push(`${mark} ${id} = ${n}`);

}









    return lines.join("\n");

  };









const buildShareImageBlobFromState = async (S, fbByWord, didWinLocal) => {

  // ✅ IMPORTANT: compute global cell state from the fbByWord SNAPSHOT

  const globalFromSnapshot = computeGlobalCellState(fbByWord);



  const cellStateAt = (r, c) => {

    const isCell = renderGrid[r][c];

    if (!isCell) return null;



    const realR = renderMeta.rowVals[r];

    const realC = renderMeta.colVals[c];

    const k = tileKey(realR, realC);



    const { state } = pickDisplayState({

      tileKey: k,

      feedbackByWord: fbByWord,

      selectedWord: null,

      latestTouch: S.latestTouch || {},

      lastViewed: S.lastViewed || {},

      wordsAtTileCount,

      derivedWordsById,

      globalCellState: globalFromSnapshot,

    });



    return state || null; // "correct" | "present" | "absent" | null

  };



  // ✅ Build the same “Attempts + clue list” lines as PC text share

  const ids = Object.keys(derivedWordsById);

  ids.sort((a, b) => {

    const wa = derivedWordsById[a];

    const wb = derivedWordsById[b];

    if ((wa.number || 0) !== (wb.number || 0)) return (wa.number || 0) - (wb.number || 0);

    const da = wa.dir === "across" ? 0 : 1;

    const db = wb.dir === "across" ? 0 : 1;

    if (da !== db) return da - db;

    return a.localeCompare(b);

  });



  const clueLines = ids.map((id) => {

    const n = S.wordAttempts?.[id] || 0;

    const solved = Boolean(S.wordSolvedEver?.[id]);





  return { id, n, solved, hasWordClue: false };





  });



  // ======================

  // ✅ Canvas layout knobs

  // ======================

  const tile = 28;      // slightly bigger so circles look clean

  const gap = 6;

  const pad = 22;

  const titleH = 50;



  const rows = renderGrid.length;

  const cols = renderGrid[0].length;



  const gridW = cols * tile + (cols - 1) * gap;

  const gridH = rows * tile + (rows - 1) * gap;



  // Text block under grid

const textTopGap = 32;

const attemptsGap = 32;



  const lineH = 28;

  const textBlockH = attemptsGap + clueLines.length * lineH + 10;



  // Make canvas wide enough so clue lines don’t clip

  const minTextW = 320;

  const W = pad * 2 + Math.max(gridW, minTextW);

  const H = pad * 2 + titleH + gridH + textTopGap + textBlockH;



  const canvas = document.createElement("canvas");

  canvas.width = W;

  canvas.height = H;



  const ctx = canvas.getContext("2d");



  // background

ctx.fillStyle = "#1a1a2e";

ctx.fillRect(0, 0, W, H);



// title

ctx.fillStyle = "#ffffff";

ctx.font = "800 18px system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif";

ctx.fillText(`KAZWORD #${puzzleNumber}`, pad, pad + 20);



  const startX = pad;

  const startY = pad + titleH;



 const solvedTileKeysImg = new Set();

for (const [wId, solved] of Object.entries(S.wordSolvedEver || {})) {

if (solved && derivedWordsById[wId]) {

for (const t of derivedWordsById[wId].tiles) solvedTileKeysImg.add(t.key);

}

}

const colorFor = (st, k) => {

if (solvedTileKeysImg.has(k)) return WORDLE.green;

return "#e5e7eb";

};



  // ✅ Draw grid EXACTLY like your PC share (but as shapes):

  // - real tiles = rounded squares (colored or white)

  // - non-tiles = red hollow circles

  for (let r = 0; r < rows; r++) {

    for (let c = 0; c < cols; c++) {

      const x = startX + c * (tile + gap);

      const y = startY + r * (tile + gap);



      const isCell = renderGrid[r][c];



      if (!isCell) {

        // red hollow circle placeholder

        const cx = x + tile / 2;

        const cy = y + tile / 2;

        const rad = tile * 0.38;



        ctx.beginPath();

        ctx.arc(cx, cy, rad, 0, Math.PI * 2);

        ctx.strokeStyle = "#ef4444"; // red

        ctx.lineWidth = 3;

        ctx.stroke();

        continue;

      }



      const st = cellStateAt(r, c);

const realR2 = renderMeta.rowVals[r];

const realC2 = renderMeta.colVals[c];

const k2 = tileKey(realR2, realC2);



      // rounded rect tile

      const radius = 7;

      ctx.beginPath();

      ctx.moveTo(x + radius, y);

      ctx.arcTo(x + tile, y, x + tile, y + tile, radius);

      ctx.arcTo(x + tile, y + tile, x, y + tile, radius);

      ctx.arcTo(x, y + tile, x, y, radius);

      ctx.arcTo(x, y, x + tile, y, radius);

      ctx.closePath();



      ctx.fillStyle = colorFor(st, k2);

      ctx.fill();



      // border for unsolved tiles (white)

      if (!st) {

        ctx.strokeStyle = WORDLE.emptyBorder;

        ctx.lineWidth = 2;

        ctx.stroke();

      }

    }

  }



  // ======================

  // ✅ Attempts + clue list

  // ======================

  const textX = pad;

  let y = startY + gridH + textTopGap;



  // Attempts

ctx.fillStyle = "#ffffff";

ctx.font = "800 16px system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif";

ctx.fillText(`Attempts: ${S.didWin ? S.submissions : "X"}/${MAX_SUBMISSIONS}`, textX, y);



  y += attemptsGap;



  // Clue list (like PC text share)

  for (const row of clueLines) {

    const box = 16;

    const boxY = y - box + 3;



    // little square marker (green if solved, white if not)

    ctx.fillStyle = row.solved ? WORDLE.green : "#ffffff";

    ctx.fillRect(textX, boxY, box, box);



    ctx.strokeStyle = row.solved ? "rgba(0,0,0,0)" : WORDLE.emptyBorder;

    ctx.lineWidth = 2;

    ctx.strokeRect(textX, boxY, box, box);



    // label text

ctx.fillStyle = "#ffffff";

ctx.font = "700 16px system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif";

const label = `${row.id} = ${row.n}`;

ctx.fillText(label, textX + box + 10, y);

if (row.hasWordClue) {

const labelW = ctx.measureText(label).width;

ctx.font = "22px system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif";

ctx.fillText("💡", textX + box + 10 + labelW + 6, y);

}

    y += lineH;

  }



  return await new Promise((resolve) => {

    canvas.toBlob((blob) => resolve(blob), "image/png");

  });

};







  const stateRef = useRef(null);

  useEffect(() => {

    stateRef.current = {

      cells,

      feedbackByWord,

      latestTouch,

      lastViewed,

      submitHistoryByWord,

      keyStatesByWord,

      selectedWord,

      focusedKey,

      submissions,

      wordAttempts,

      wordSolvedEver,

	  editedSinceSubmit,

      gameOver,

      didWin,

	  greenEverTiles,

	  revealAnim, // ✅ add this

	  clueTokens, // ✅ add this

	  unlockedCluesByDay, // ✅ 1B add this

	  spentCluesByDay,





    };

  }, [

    cells,

    feedbackByWord,

    latestTouch,

    lastViewed,

    submitHistoryByWord,

    keyStatesByWord,

    selectedWord,

    focusedKey,

    submissions,

    wordAttempts,

    wordSolvedEver,

	editedSinceSubmit,

    gameOver,

    didWin,

	greenEverTiles,

	revealAnim, // ✅ add this

	clueTokens, // ✅ add this

	unlockedCluesByDay, // ✅ 1B add this

	spentCluesByDay,





  ]);

  const startRevealAnimation = ({ candidates, nextFeedbackByWord, prevFeedbackByWord, letterMap, prevSnapshots, onComplete }) => {

    const tilesAnim = {};

    let maxDelay = 0;

    for (const wId of candidates) {

      const w = derivedWordsById[wId];

      if (!w?.tiles?.length) continue;

      const letters = letterMap[wId] || [];

      const prevSnap = prevSnapshots?.[wId];

      let localIndex = 0;

      for (let tIdx = 0; tIdx < w.tiles.length; tIdx++) {

        const k = w.tiles[tIdx].key;

        const toState = nextFeedbackByWord?.[wId]?.[k] ?? null;

        const fromState = prevFeedbackByWord?.[wId]?.[k] ?? null;

        const prevLetter = prevSnap?.cells?.[k] ?? "";

        const newLetter = letters[tIdx] ?? "";

        let changed = false;

        if (!prevSnap) changed = true;

        else if (prevLetter !== newLetter || fromState !== toState) changed = true;

        if (changed) {

          const delay = localIndex * REVEAL_INTERVAL_MS;

          tilesAnim[k] = { fromState, toState, delayMs: delay };

          if (delay > maxDelay) maxDelay = delay;

          localIndex += 1;

        }

      }

    }

    const flipDuration = 600;

    const buffer = 150;

    const totalDuration = maxDelay + flipDuration + buffer;

    if (Object.keys(tilesAnim).length === 0) {

      setRevealAnim({ runId: 0, tiles: {} });

      if (onComplete) onComplete();

      return;

    }

    const runId = Date.now();

    setRevealAnim({ runId, tiles: tilesAnim });

    if (revealTimerRef.current) clearTimeout(revealTimerRef.current);

    revealTimerRef.current = setTimeout(() => {

      setRevealAnim({ runId: 0, tiles: {} });

      if (onComplete) onComplete();

    }, totalDuration);

  };

const revealFinalSolutionAfterGameOver = () => {

  // Show their last board briefly, then flip-reveal solution

  setTimeout(() => {

    const cur = stateRef.current;

    if (!cur) return;

    const nextFeedbackByWord = {};

    const letterMap = {};

    const prevSnapshots = {};

    const allWordIds = Object.keys(derivedWordsById);

    for (const wId of allWordIds) {

      const w = derivedWordsById[wId];

      const tiles = w.tiles || [];

      const ans = (solution?.answerByWord?.[wId] || "").toUpperCase();

      const letters = tiles.map((t, i) => ans[i] || "");

      letterMap[wId] = letters;

      const snapCells = {};

      const snapFb = {};

      for (const t of tiles) {

        snapCells[t.key] = (cur.cells?.[t.key]?.letter || "").toUpperCase();

        snapFb[t.key] = cur.feedbackByWord?.[wId]?.[t.key] ?? null;

      }

      prevSnapshots[wId] = { cells: snapCells, feedback: snapFb };

      nextFeedbackByWord[wId] = {};

      for (const t of tiles) nextFeedbackByWord[wId][t.key] = "correct";

    }

    startRevealAnimation({

      candidates: allWordIds,

      nextFeedbackByWord,

      prevFeedbackByWord: cur.feedbackByWord,

      letterMap,

      prevSnapshots,





      onComplete: () => {

const nextCells = { ...cur.cells };

for (const k of tileSet) {

const ch = (tileAnswerMap?.[k] || "").toUpperCase();

nextCells[k] = { letter: ch };

}

setCells(nextCells);

setFeedbackByWord(nextFeedbackByWord);

setLatestTouch({});

setLastViewed({});

setShowThemeBanner(true);

setTimeout(() => {

setShowThemeBanner(false);

setShowResults(true);

}, 500);

},











    });

  }, 500);

};

const submitAllCompleteWordsWithState = (S) => {

  if (S.gameOver) return;

  if (S.revealAnim?.runId) return;

  // if (S.submissions >= PUZZLE.maxSubmissions) return;

  const allWordIds = Object.keys(derivedWordsById);

  allWordIds.sort((a, b) => {

    const wa = derivedWordsById[a];

    const wb = derivedWordsById[b];

    if ((wa.number || 0) !== (wb.number || 0)) return (wa.number || 0) - (wb.number || 0);

    const da = wa.dir === "across" ? 0 : 1;

    const db = wb.dir === "across" ? 0 : 1;

    if (da !== db) return da - db;

    return a.localeCompare(b);

  });


  // ✅ NEW: Validate ALL complete words before allowing submission
const allCompleteWordIds = allWordIds.filter(wId => wordIsCompleteInCells(S, wId));
const invalidCompleteWords = [];
for (const wId of allCompleteWordIds) {
  const guess = getWordStringFromCells(S, wId);
  const answerOverride = solution?.answerByWord?.[wId] || null;
  if (!isValidWord(guess, answerOverride)) {
    invalidCompleteWords.push(wId);
  }
}
if (invalidCompleteWords.length > 0) {
  const msgs = invalidCompleteWords.map(id => {
    const dirArrow = id.endsWith("A") ? " (→)" : id.endsWith("D") ? " (↓)" : "";
    return `The word for ${id}${dirArrow} is not in the word list, try again`;
  });
  showToasts(msgs);
  return;
}





	  // ✅ candidates = complete + changed

	// (editedSinceSubmit was causing some complete words to be skipped -> missing toasts like 1D)

	const candidates = [];

  for (const wId of allWordIds) {

    if (!wordIsCompleteInCells(S, wId)) continue;

    if (!wordHasChangedSinceLastSubmit(S, wId)) continue;

    const hasHistory = (S.submitHistoryByWord?.[wId]?.length || 0) > 0;

if (hasHistory && !S.editedSinceSubmit?.[wId]) {

  if (wId !== S.selectedWord) continue;

}

candidates.push(wId);

  }







  // ✅ allowed tiles = tiles of the words we're submitting NOW

  const allowedKeysSet = new Set();

  for (const wId of candidates) {

    const w = derivedWordsById[wId];

    for (const t of (w?.tiles || [])) allowedKeysSet.add(t.key);

  }





  // ✅ also allow intersecting tiles (so they never block submissions)

for (const k of Object.keys(wordsAtTileCount)) {

  if ((wordsAtTileCount[k] || 0) > 1) allowedKeysSet.add(k);

}



  // ✅ Block partial words ONLY if they have letters outside allowed tiles

 /* const partialMsgs = [];

  for (const wId of allWordIds) {

    if (wordIsPartialBeyondAllowedKeys(S, wId, allowedKeysSet)) {

      const dirArrow = wId.endsWith("A") ? " (→)" : wId.endsWith("D") ? " (↓)" : "";

		partialMsgs.push(`Fill / Remove all tiles in ${wId}${dirArrow}`);

    }

  }

  if (partialMsgs.length) {

    showToasts(partialMsgs);

    return;

  }

  */

  // ✅ No candidates

  if (candidates.length === 0) {

    if (S.selectedWord) {

      const wId = S.selectedWord;

      const complete = wordIsCompleteInCells(S, wId);

      const changed = wordHasChangedSinceLastSubmit(S, wId);

      if (complete && !changed) {

		  const dirArrow = wId.endsWith("A") ? " (→)" : wId.endsWith("D") ? " (↓)" : "";

		  showToasts(`Submit a new word for ${wId}${dirArrow}`);

		  return;

		}

    }

    showToasts("Fill in all tiles to submit a word");

    return;

  }





// ✅ Dictionary validation (DO NOT block other valid submissions)

const invalidMsgs = [];

const invalidWordIds = [];            // ✅ ADD THIS

const validCandidates = [];



for (const wId of candidates) {

  const guess = getWordStringFromCells(S, wId);

  const answerOverride = solution?.answerByWord?.[wId] || null;



  if (!isValidWord(guess, answerOverride)) {

    const dirArrow = wId.endsWith("A") ? " (→)" : wId.endsWith("D") ? " (↓)" : "";

    invalidMsgs.push(`The word for ${wId}${dirArrow} is not in the word list, try again`);

    invalidWordIds.push(wId);         // ✅ ADD THIS

  } else {

    validCandidates.push(wId);

  }

}









	// if ANY complete word is invalid, block everything and show the error

if (invalidMsgs.length) {

showToasts(invalidMsgs);

return;

}

const candidatesToSubmit = validCandidates;





	const submittedSet = new Set(candidatesToSubmit);

	const noFullRecomputeWordIds = new Set(invalidWordIds);



  const prevFeedbackSnapshot = S.feedbackByWord;

  const nextFeedbackByWord = { ...S.feedbackByWord };

  const nextLatestTouch = { ...S.latestTouch };

  const nextKeyStatesByWord = { ...S.keyStatesByWord };

  const nextSubmitHistory = { ...(S.submitHistoryByWord || {}) };

  const nextWordAttempts = { ...S.wordAttempts };

  const nextSolvedEver = { ...(S.wordSolvedEver || {}) };

  const rank = { absent: 1, present: 2, correct: 3 };

  const letterMap = {};

  const newlyEarnedClues = [];







  const wasClueUnlockedBefore = (wId) => {

	const dayMap = S.unlockedCluesByDay?.[puzzleNumber] || {};

    return Boolean(dayMap?.[wId]);

  };







  // ✅ Track which tile keys changed

  const changedTileKeys = new Set();

  for (const wId of candidatesToSubmit) {

    const w = derivedWordsById[wId];

    const tiles = w.tiles;

    const letters = tiles.map((t) => (S.cells[t.key]?.letter || "").toUpperCase());

    for (const t of tiles) changedTileKeys.add(t.key);

    letterMap[wId] = letters;

    const answerChars = answerCharsByWord[wId] || Array(tiles.length).fill(null);

    const fb = computeFeedback(answerChars, letters);

    nextFeedbackByWord[wId] = { ...(nextFeedbackByWord[wId] || {}) };

    tiles.forEach((t, i) => {

      nextFeedbackByWord[wId][t.key] = fb[i];

    });



	const solvedNow = fb.every((st) => st === "correct");

const wasSolvedBefore = Boolean(S.wordSolvedEver?.[wId]);

if (solvedNow) nextSolvedEver[wId] = true;



if (solvedNow && !wasSolvedBefore && !wasClueUnlockedBefore(wId)) {

  newlyEarnedClues.push(wId);

}













    tiles.forEach((t, i) => {

      const st = fb[i];

      if (st === "correct") {

        if (nextLatestTouch[t.key]?.wordId === wId) delete nextLatestTouch[t.key];

      } else {

        nextLatestTouch[t.key] = { wordId: wId, dir: w.dir, state: st };

      }

    });

    const snapCells = {};

    const snapFb = {};

    tiles.forEach((t, i) => {

      snapCells[t.key] = letters[i];

      snapFb[t.key] = fb[i];

    });

    const prevHist = nextSubmitHistory[wId] ? [...nextSubmitHistory[wId]] : [];

	prevHist.push({ cells: snapCells, feedback: snapFb });

	nextSubmitHistory[wId] = prevHist;

    const currentKeys = { ...(nextKeyStatesByWord[wId] || {}) };

    for (let i = 0; i < letters.length; i++) {

      const ch = letters[i];

      const st = fb[i];

      const existing = currentKeys[ch];

      if (!existing || rank[st] > rank[existing]) currentKeys[ch] = st;

    }

    nextKeyStatesByWord[wId] = currentKeys;

    nextWordAttempts[wId] = (nextWordAttempts[wId] || 0) + 1;

  }

  // ✅ Update intersecting feedback + keyboards

 propagateIntersectingFeedback({

  baseState: S, // ✅ ensures latest cells

  nextFeedbackByWord,

  nextLatestTouch,

  nextKeyStatesByWord,

  nextSolvedEver,

  changedTileKeys: Array.from(changedTileKeys),

  submittedWordIds: submittedSet,

  noFullRecomputeWordIds, // ✅ ADD THIS



});

  const submissionsAfter = S.submissions + 1;



  const wonNow = allTilesGreenFromFeedback(nextFeedbackByWord);





 const isOut = submissionsAfter >= PUZZLE.maxSubmissions;

 // const isOut = false; // cap temporarily disabled







  const makeShare = (didWinLocal) => {

    return buildShareTextFromState(

      {

        ...S,

        submissions: submissionsAfter,

        wordAttempts: nextWordAttempts,

        wordSolvedEver: nextSolvedEver,

        latestTouch: nextLatestTouch,

        lastViewed: S.lastViewed,

      },

      nextFeedbackByWord,

      didWinLocal

    );

  };





const finishSubmission = () => {
try {
  const startKey = `kzw_start_${puzzleNumber}`;
  if (!localStorage.getItem(startKey)) {
    localStorage.setItem(startKey, String(Date.now()));
  }
} catch {}

  retypeCacheRef.current = {};

  // ✅ ADD THIS BLOCK: record history for solved words that weren't submitted
  for (const wId of Object.keys(nextSolvedEver)) {
    if (nextSolvedEver[wId] && !submittedSet.has(wId) && !S.wordSolvedEver?.[wId]) {
      const tiles = derivedWordsById[wId]?.tiles;
      if (!tiles) continue;
      const snapCells = {};
      const snapFb = {};
      tiles.forEach(t => {
        snapCells[t.key] = (S.cells[t.key]?.letter || "").toUpperCase();
        snapFb[t.key] = nextFeedbackByWord[wId]?.[t.key] ?? null;
      });
      const newSnapshot = { cells: snapCells, feedback: snapFb };
      // Append to history for this word
      nextSubmitHistory[wId] = [...(nextSubmitHistory[wId] || []), newSnapshot];
      // Increment attempt count for this word
      nextWordAttempts[wId] = (nextWordAttempts[wId] || 0) + 1;
    }
  }

  setFeedbackByWord(nextFeedbackByWord);
  setLatestTouch(nextLatestTouch);
  setKeyStatesByWord(nextKeyStatesByWord);
  setSubmitHistoryByWord(nextSubmitHistory);
  setWordAttempts(nextWordAttempts);






    setWordSolvedEver(nextSolvedEver);

    setSubmissions(submissionsAfter);













	// ✅ Remember any tiles that are correct (green) so Green Undo can restore them later

setGreenEverTiles((prev) => {

  const next = { ...prev };

  // Only consider tiles that were part of the words we just submitted

  // (you already collected these in changedTileKeys)

  for (const k of Array.from(changedTileKeys)) {

    // If ANY word marks this tile correct, it counts as "discovered green"

    let isGreen = false;

    for (const wid of Object.keys(nextFeedbackByWord)) {

      if (nextFeedbackByWord[wid]?.[k] === "correct") {

        isGreen = true;

        break;

      }

    }

    if (isGreen) {

      const ans = (tileAnswerMap?.[k] || "").toUpperCase();

      if (ans) next[k] = ans;

    }

  }

  return next;

});

    setEditedSinceSubmit((prev) => {

      const next = { ...prev };

      for (const wId of candidatesToSubmit) delete next[wId];

      return next;

    });









	const endGame = (didWinLocal) => {

setGameOver(true);

setDidWin(didWinLocal);

// theme banner shows first, then results open after delay

setLastShareText(makeShare(didWinLocal));

if (typeof window !== "undefined" && window.gtag) {
  const solvePayload = { result: didWinLocal ? "win" : "loss" };

    try {
      const startKey = `kzw_start_${puzzleNumber}`;
      const startTime = parseInt(localStorage.getItem(startKey) || "0", 10);
      if (startTime > 0) {
        const elapsedMinutes = Math.round((Date.now() - startTime) / 1000 / 60 * 10) / 10;
solvePayload.solve_time_minutes = elapsedMinutes;
      }
    } catch {}

  window.gtag("event", "puzzle_complete", solvePayload);
}










      try {

        const today = formatYMD(new Date());

        const lastPlayed = localStorage.getItem(LAST_PLAYED_KEY);

        if (lastPlayed === today) return;

        const prev = readStats();

        const next = { ...prev };

        next.played += 1;

        if (didWinLocal) next.wins += 1;

        const todayD = new Date();
        const yesterdayD = new Date(todayD.getFullYear(), todayD.getMonth(), todayD.getDate() - 1);
        const yesterday = formatYMD(yesterdayD);

        const continues = lastPlayed === yesterday;

        if (didWinLocal) {

          next.currentStreak = continues ? next.currentStreak + 1 : 1;

          next.maxStreak = Math.max(next.maxStreak, next.currentStreak);





		 const b = bucketForGuess(submissionsAfter);

			next.dist = { ...next.dist, [b]: (next.dist[b] || 0) + 1 };

			next.history = [...(next.history ?? []), submissionsAfter];

			} else {

			next.currentStreak = 0;

			}

			writeStats(next);











        localStorage.setItem(LAST_PLAYED_KEY, today);

        setStats(next);

      } catch {

        // ignore

      }

    };





	  if (wonNow) {

endGame(true);

setTimeout(() => {

setShowThemeBanner(true);

setTimeout(() => {

setShowThemeBanner(false);

setShowResults(true);

}, 5);

}, 500);

} else if (isOut) {

endGame(false);

revealFinalSolutionAfterGameOver();

} else {

setLastShareText(makeShare(false));

}





  };

  startRevealAnimation({

    candidates: candidatesToSubmit,

    nextFeedbackByWord,

    prevFeedbackByWord: prevFeedbackSnapshot,

    letterMap,

    prevSnapshots: Object.fromEntries(

	 Object.entries(S.submitHistoryByWord || {}).map(([id, hist]) => [id, hist?.[hist.length - 1]])

	),

    onComplete: finishSubmission,

  });



}; // ✅ close submitAllCompleteWordsWithState





  const buildKeyStateFromSnap = (snap) => {



  const rank = { absent: 1, present: 2, correct: 3 };

  const out = {};

  for (const [k, st] of Object.entries(snap?.feedback || {})) {

    const ch = (snap?.cells?.[k] || "").toUpperCase();

    if (!ch) continue;

    const existing = out[ch];

    if (!existing || rank[st] > rank[existing]) out[ch] = st;

  }

  return out;

};

// ✅ Recompute feedback+keyboard for intersecting words affected by a submission

// ✅ Recompute feedback+keyboard for intersecting words affected by a submission









// ✅ Recompute feedback+keyboard for intersecting words affected by a submission

const propagateIntersectingFeedback = ({

  baseState,

  nextFeedbackByWord,

  nextLatestTouch,

  nextKeyStatesByWord,

  nextSolvedEver,

  changedTileKeys,

  submittedWordIds, // Set of words submitted in THIS action (may be undefined)

    noFullRecomputeWordIds, // ✅ add this



}) => {

  const rank = { absent: 1, present: 2, correct: 3 };

  const changedSet = new Set(changedTileKeys || []);

  const submittedSet = submittedWordIds instanceof Set ? submittedWordIds : new Set();



  // Find all words that touch any changed tile

  const affectedWordIds = new Set();

  for (const k of changedSet) {

    const arr = tileToWords[k] || [];

    for (const wId of arr) affectedWordIds.add(wId);

  }



  for (const wId of affectedWordIds) {

    const w = derivedWordsById[wId];

    if (!w?.tiles?.length) continue;



    const tiles = w.tiles;

    const letters = tiles.map((t) => (baseState.cells?.[t.key]?.letter || "").toUpperCase());

    const answerChars = answerCharsByWord[wId] || Array(tiles.length).fill(null);



    const isComplete = wordIsCompleteInCells(baseState, wId);

    const isSubmittedNow = submittedSet.has(wId);



    // "Has feedback history" == was submitted before (strongest, most stable signal)

    const hadFeedbackBefore = (baseState.submitHistoryByWord?.[wId]?.length || 0) > 0;



    // Dictionary-valid check (same rule you use during submit)

    const guessStr = letters.join("");

    const answerOverride = solution?.answerByWord?.[wId] || null;

    const isValid = isValidWord(guessStr, answerOverride);











const blockFull = noFullRecomputeWordIds?.has?.(wId);

const prevMap = nextFeedbackByWord?.[wId] || {};

const hadAnyPrevFeedback = Object.keys(prevMap).length > 0;

const allowFullRecompute =

  !blockFull && isComplete && (isSubmittedNow || hadFeedbackBefore || isValid);





// Start from existing feedback (do NOT create feedback out of nowhere)

const fb = tiles.map((t) => prevMap[t.key] ?? null);



// 1) INVALID this press + NO history → mirror-only, then SKIP

if (blockFull && !hadAnyPrevFeedback) {

  nextFeedbackByWord[wId] = { ...(nextFeedbackByWord[wId] || {}) };



  for (const t of tiles) {

    const k = t.key;

    if (!changedSet.has(k)) continue;



    if (nextFeedbackByWord[wId][k] === "correct") continue;



    let best = null;

    for (const otherId of (tileToWords[k] || [])) {

      if (otherId === wId) continue;

      const st = nextFeedbackByWord?.[otherId]?.[k];

      if (!st) continue;

      if (!best || rank[st] > rank[best]) best = st;

    }

    if (best) nextFeedbackByWord[wId][k] = best;

  }



  continue;

}



// 2) Otherwise → cleanup recompute (duplicates allowed to downgrade)

const computed = computeFeedback(answerChars, letters);



for (let i = 0; i < tiles.length; i++) {

  const k = tiles[i].key;



  const hadBefore = prevMap[k] != null;

  const touchedNow = changedSet.has(k);



  if (!hadBefore && !touchedNow) continue;

  if (nextFeedbackByWord?.[wId]?.[k] === "correct") continue;



  fb[i] = computed[i];

}

















    // Save tile feedback (only save non-null states)

    nextFeedbackByWord[wId] = { ...(nextFeedbackByWord[wId] || {}) };

    tiles.forEach((t, i) => {

      const st = fb[i];

      if (!st) return;

      nextFeedbackByWord[wId][t.key] = st;

    });



// Save solved state: either submitted now, or completed via intersection propagation
    // (word gets solved when another word's submission fills in the last intersecting tile)
    if (isComplete) {
      const solvedNow = fb.every((st) => st === "correct");
      if (solvedNow && (isSubmittedNow || hadFeedbackBefore)) {
        nextSolvedEver[wId] = true;
      }
    }



    // Update latestTouch only for changed tiles,

    // and only for states we actually allow to exist.

    tiles.forEach((t, i) => {

      const k = t.key;

      if (!changedSet.has(k)) return;



      const st = fb[i];

      if (!st) return;



      if (st === "correct") {

        if (nextLatestTouch[k]?.wordId === wId) delete nextLatestTouch[k];

      } else {

        // Only track non-green touch if the word has real feedback legitimacy

        if (allowFullRecompute || hadFeedbackBefore || isSubmittedNow) {

          nextLatestTouch[k] = { wordId: wId, dir: w.dir, state: st };

        }

      }

    });



    // Keyboard updates:

    // - If submitted now, update fully (normal behavior)

    // - If not submitted, only allow "correct" letters from changed tiles to upgrade

    const currentKeys = { ...(nextKeyStatesByWord[wId] || {}) };



    if (isSubmittedNow) {

      for (let i = 0; i < letters.length; i++) {

        const ch = letters[i];

        const st = fb[i];

        if (!ch || !st) continue;

        const existing = currentKeys[ch];

        if (!existing || rank[st] > rank[existing]) currentKeys[ch] = st;

      }

    } else {

  // ✅ Only upgrade keys based on the changed/intersecting tiles

  for (let i = 0; i < tiles.length; i++) {

    const k = tiles[i].key;

    if (!changedSet.has(k)) continue;



    const ch = letters[i];

    const st = fb[i];

    if (!ch || !st) continue;



    const existing = currentKeys[ch];

    if (!existing || rank[st] > rank[existing]) currentKeys[ch] = st;

  }

}



    nextKeyStatesByWord[wId] = currentKeys;

  }

};

















const revertSelectedWordWithState = (S) => {

  if (S.gameOver) return;

  if (S.revealAnim?.runId) return;

  const wId = S.selectedWord;

  if (!wId) return;

  // ✅ Only undo edits since last submit

  if (!wordHasChangedSinceLastSubmit(S, wId)) {

    showToasts("Nothing to undo");

    return;

  }









  let snap = getLastSubmittedSnap(S, wId);

  if (!snap || !snap.cells) return;

  retypeCacheRef.current = {};



  // Smart snap: if last snap's intersection letter was contributed by another word,

  // find an earlier snap with this word's own intended letter

  const hist = S.submitHistoryByWord?.[wId] || [];

  if (hist.length >= 2) {

    const hybridCells = { ...snap.cells };

    const hybridFeedback = { ...snap.feedback };

    let needHybrid = false;

    const tilesForHybrid = derivedWordsById[wId]?.tiles || [];

    for (const t of tilesForHybrid) {

      const k = t.key;

      if ((wordsAtTileCount[k] || 0) <= 1) continue;

      const snapLetter = (snap.cells?.[k] || "").toUpperCase();

      const sharingWords = (tileToWords[k] || []).filter(id => id !== wId);



	 const otherOwns = sharingWords.some(otherId => S.feedbackByWord[otherId]?.[k] === "correct");

if (!otherOwns) continue;

const correctAtTile = (tileAnswerMap?.[k] || "").toUpperCase();

if (snapLetter !== correctAtTile) continue;



      for (let i = hist.length - 2; i >= 0; i--) {

        const prevLetter = (hist[i].cells?.[k] || "").toUpperCase();

        if (prevLetter !== snapLetter) {

          hybridCells[k] = prevLetter;

          hybridFeedback[k] = hist[i].feedback?.[k] ?? null;

          needHybrid = true;

          break;

        }

      }

    }

    if (needHybrid) snap = { ...snap, cells: hybridCells, feedback: hybridFeedback };

  }









  const tiles = derivedWordsById[wId]?.tiles || [];









  // ✅ Keys we must NOT change (locked because another word is solved)

  const skipKeys = new Set(

    tiles

      .map((t) => t.key)

      .filter((k) => isTileLockedByOtherWord(S, k, wId))

  );

// Which tiles will change back because of UNDO? (excluding skipKeys)

const changedKeys = tiles

  .map((t) => t.key)

  .filter((k) => {

    const before = (S.cells[k]?.letter || "").toUpperCase();

    const after = (snap.cells[k] ?? "").toUpperCase();

    return before !== after;

  });



// Store current state in cache for retype

for (const k of changedKeys) {

  const affected = tileToWords[k] || [];

  const byWord = {};

  for (const ww of affected) {

    const st = S.feedbackByWord?.[ww]?.[k];

    if (st) byWord[ww] = st;

  }

  retypeCacheRef.current[k] = {

    letter: (S.cells?.[k]?.letter || "").toUpperCase(),

    byWord,

    touch: S.latestTouch?.[k] || null,

  };

}











// -------------------------



 // Build NEXT objects locally (sync), then set them once.

 // -------------------------



 const nextCells = { ...S.cells };

 for (const t of tiles) {

 if (skipKeys.has(t.key)) continue;



 nextCells[t.key] = { letter: (snap.cells?.[t.key] ?? "").toUpperCase() };

 }















  // 2) nextFeedbackByWord

  const nextFeedbackByWord = { ...S.feedbackByWord };



  // 2a) clear stale feedback at changed tiles for OTHER words (never for skipKeys)

  if (changedKeys.length) {

    for (const k of changedKeys) {

      const affectedWordIds = tileToWords[k] || [];

      for (const otherId of affectedWordIds) {

        if (otherId === wId) continue;

        if (!nextFeedbackByWord[otherId]?.[k]) continue;

        nextFeedbackByWord[otherId] = { ...nextFeedbackByWord[otherId] };

        delete nextFeedbackByWord[otherId][k];

      }

    }

  }



  // 2b) restore feedback for this word from snapshot (skip locked tiles)

  nextFeedbackByWord[wId] = { ...(nextFeedbackByWord[wId] || {}) };



  // clear only non-skipped keys

  for (const t of tiles) {

    if (skipKeys.has(t.key)) continue;

    delete nextFeedbackByWord[wId][t.key];

  }



 // restore only non-skipped keys

  // Exception: if the tile is ONLY locked because of an intersecting word's green,

  // still restore the feedback for THIS word (cells are already restored above)

  for (const [k, st] of Object.entries(snap.feedback || {})) {

    if (skipKeys.has(k) && st !== "correct") continue;

    nextFeedbackByWord[wId][k] = st;

  }



  // ✅ UNDO CLEANUP: recompute this word's feedback using CURRENT letters

// so stale snapshot states can downgrade (ex: yellow -> absent) after a green was locked elsewhere.

{

  const prevMap = nextFeedbackByWord[wId] || {};

  const allowedKeys = new Set([

    ...Object.keys(prevMap), // only keys that already had feedback (prevents "new feedback out of nowhere")

    ...changedKeys,          // plus keys UNDO actually changed

  ]);



  const guessChars = tiles.map((t) => (nextCells[t.key]?.letter || "").toUpperCase());

  const answerChars = answerCharsByWord[wId] || Array(tiles.length).fill(null);

  const computed = computeFeedback(answerChars, guessChars);



  for (let i = 0; i < tiles.length; i++) {

    const kk = tiles[i].key;



    if (skipKeys.has(kk)) continue;        // don't touch tiles locked by another solved word

    if (!allowedKeys.has(kk)) continue;    // don't create feedback on new tiles

    if (nextFeedbackByWord[wId]?.[kk] === "correct") continue;



    nextFeedbackByWord[wId][kk] = computed[i];

  }

}





  // 3) nextLatestTouch

  let nextLatestTouch = { ...S.latestTouch };



  // remove touch marks at changed keys (like your old code)

  if (changedKeys.length) {

    for (const k of changedKeys) {

      if (!nextLatestTouch[k]) continue;

      delete nextLatestTouch[k];

    }

  }



  // restore touch marks for this word from snapshot

  for (const t of tiles) {

    const k = t.key;

    if (skipKeys.has(k)) continue;



	const st = nextFeedbackByWord[wId]?.[k];

    if (st && st !== "correct") {

      nextLatestTouch[k] = { wordId: wId, dir: derivedWordsById[wId].dir, state: st };

    } else if (st === "correct") {

      if (nextLatestTouch[k]?.wordId === wId) delete nextLatestTouch[k];

    }

  }



  // 4) nextLastViewed

  let nextLastViewed = { ...S.lastViewed };



  // clear lastViewed at changed keys (like your old code)

  if (changedKeys.length) {

    for (const k of changedKeys) {

      if (!nextLastViewed[k]) continue;

      delete nextLastViewed[k];

    }

  }



  // restore lastViewed from snapshot for intersecting tiles

  for (const t of tiles) {

    const k = t.key;

    if (skipKeys.has(k)) continue;

    if ((wordsAtTileCount[k] || 0) <= 1) continue;



    const st = snap.feedback?.[k];

    if (!st || st === "correct") continue;



    nextLastViewed[k] = { wordId: wId, dir: derivedWordsById[wId].dir, state: st };

  }



  // 5) Propagate intersecting feedback USING THE NEXT OBJECTS

  // IMPORTANT: this must update nextFeedbackByWord/nextLatestTouch/nextLastViewed, not S.*

  propagateIntersectingFeedback({

    baseState: {

      ...S,

      cells: nextCells,

      lastViewed: nextLastViewed,

      latestTouch: nextLatestTouch,

    },

    nextFeedbackByWord,

    nextLatestTouch,

    nextKeyStatesByWord: { ...S.keyStatesByWord },

    nextSolvedEver: { ...(S.wordSolvedEver || {}) },

    changedTileKeys: changedKeys,

    submittedWordIds: new Set(), // undo is not a submission

  });



  // 6) Commit final next state (now includes recomputed 2D feedback)

  setCells(nextCells);

  setFeedbackByWord(nextFeedbackByWord);

  setLatestTouch(nextLatestTouch);

  setLastViewed(nextLastViewed);



  // ✅ IMPORTANT: do NOT touch keyStatesByWord in UNDO





};









const greenUndoWithState = (S) => {

  if (S.gameOver) return;

  if (S.revealAnim?.runId) return;

  const wId = S.selectedWord;

  if (!wId) {

    showToasts("Select a word first");

    return;

  }

  const tiles = derivedWordsById[wId]?.tiles || [];

  const restoreKeys = tiles.map((t) => t.key).filter((k) => S.greenEverTiles?.[k]);

  if (!restoreKeys.length) {

    showToasts("No green tiles to restore for this word yet");

    return;

  }

  // Build nextCells in-memory (so we can accurately compute win + propagation)

  const nextCells = { ...S.cells };

  for (const k of restoreKeys) {

    nextCells[k] = { letter: S.greenEverTiles[k] };

  }







// Update selected word feedback:

// - Force restored keys to correct

// - Recompute duplicate-letter logic, but ONLY apply it to tiles that already had feedback

const nextFeedbackByWord = { ...S.feedbackByWord };

const prevMap = nextFeedbackByWord[wId] || {};

nextFeedbackByWord[wId] = { ...prevMap };



for (const k of restoreKeys) nextFeedbackByWord[wId][k] = "correct";



const guessChars = tiles.map((t) => (nextCells[t.key]?.letter || "").toUpperCase());

const answerChars = answerCharsByWord[wId] || Array(tiles.length).fill(null);

const computed = computeFeedback(answerChars, guessChars);



const allowedKeys = new Set([...Object.keys(prevMap), ...restoreKeys]);



for (let i = 0; i < tiles.length; i++) {

  const k = tiles[i].key;

  if (!allowedKeys.has(k)) continue;

  nextFeedbackByWord[wId][k] = computed[i];

}



const nextLatestTouch = { ...S.latestTouch };

const nextLastViewed  = { ...S.lastViewed };



for (const k of restoreKeys) {

  if (nextLatestTouch[k]?.wordId === wId) delete nextLatestTouch[k];

  if (nextLastViewed[k]?.wordId === wId) delete nextLastViewed[k];

}







  // Propagate intersecting feedback so other words update correctly too

  propagateIntersectingFeedback({

    baseState: { ...S, cells: nextCells },

    nextFeedbackByWord,

    nextLatestTouch,

    nextKeyStatesByWord: { ...S.keyStatesByWord }, // safe pass-through (we’re not trying to rebuild keyboards here)

    nextSolvedEver: { ...(S.wordSolvedEver || {}) },

    changedTileKeys: restoreKeys,

	submittedWordIds: new Set(), // greens is not a submit

	noFullRecomputeWordIds: new Set([wId]), // ✅ add this







  });

  // Commit the visual state updates

  setCells(nextCells);

  setFeedbackByWord(nextFeedbackByWord);

  setLatestTouch(nextLatestTouch);

  setLastViewed(nextLastViewed);






showToasts("Restored greens for selected word");
};



const isTileLockedInState = (S, k) => {

  // ✅ ONLY lock tiles that belong to a fully-solved word

  for (const [wid, solved] of Object.entries(S.wordSolvedEver || {})) {

    if (!solved) continue;

    const tiles = derivedWordsById[wid]?.tiles || [];

    if (tiles.some((t) => t.key === k)) return true;

  }

  return false;

};

const isTileLockedByOtherWord = (S, k, currentWordId) => {

  for (const [wid, solved] of Object.entries(S.wordSolvedEver || {})) {

    if (!solved) continue;

    if (wid === currentWordId) continue; // lock is allowed if it's from the same word (rare)

    const tiles = derivedWordsById[wid]?.tiles || [];

    if (tiles.some((t) => t.key === k)) return true;

  }

  return false;

};











const restoreTileFeedbackFromLastSubmitIfMatches = (S, k, nextLetter) => {

const affected = tileToWords[k] || [];

if (!affected.length) return;

// ---- FEEDBACK BY WORD ---

setFeedbackByWord((prev) => {

let next = prev;

for (const wId of affected) {

const tiles = derivedWordsById[wId]?.tiles || [];

if (!tiles.length) continue;

const idx = tiles.findIndex((t) => t.key === k);

if (idx === -1) continue;



// Must have submission history (never create feedback out of nowhere)

const hadFeedbackBefore = (S.submitHistoryByWord?.[wId]?.length || 0) > 0;

if (!hadFeedbackBefore) continue;

const snap = getBestSnapForTile(S, wId, k, nextLetter);

if (!snap?.cells || !snap?.feedback) continue;

const snapLetter = (snap.cells[k] || "").toUpperCase();

if (snapLetter !== nextLetter) continue;



      // Tile must already have feedback in this word (prevents "instant feedback" creation)

      const prevStateAtTile = prev?.[wId]?.[k];

      if (!prevStateAtTile) continue;



      // Build CURRENT letters for this word, with the retyped letter at k

      const lettersNow = tiles.map((t) => {

        if (t.key === k) return nextLetter;

        return (S.cells?.[t.key]?.letter || "").toUpperCase();

      });



      // Only restore/adjust when the word is complete (otherwise you see feedback while typing)

      const isCompleteNow = lettersNow.every(Boolean);

      if (!isCompleteNow) continue;



      // Compute current truth and write ONLY this tile back

      const answerChars = answerCharsByWord[wId] || Array(tiles.length).fill(null);

      const computed = computeFeedback(answerChars, lettersNow);

      const computedState = computed[idx];

      if (!computedState) continue;



      if (next === prev) next = { ...prev };

      next[wId] = { ...(next[wId] || {}) };

      next[wId][k] = computedState; // may downgrade yellow->absent if truth changed

    }



    return next;

  });



  // ---- LATEST TOUCH ----

  setLatestTouch((prev) => {

    let next = prev;



    for (const wId of affected) {

      const tiles = derivedWordsById[wId]?.tiles || [];

      if (!tiles.length) continue;



      const idx = tiles.findIndex((t) => t.key === k);

      if (idx === -1) continue;



      const hadFeedbackBefore = (S.submitHistoryByWord?.[wId]?.length || 0) > 0;

      if (!hadFeedbackBefore) continue;









  const snap = getBestSnapForTile(S, wId, k, nextLetter);

if (!snap?.cells || !snap?.feedback) continue;

const snapLetter = (snap.cells[k] || "").toUpperCase();

if (snapLetter !== nextLetter) continue;

// Only update latestTouch if this tile already had feedback for this word











      const prevStateAtTile = S.feedbackByWord?.[wId]?.[k];

      if (!prevStateAtTile) continue;



      const lettersNow = tiles.map((t) => {

        if (t.key === k) return nextLetter;

        return (S.cells?.[t.key]?.letter || "").toUpperCase();

      });



      const isCompleteNow = lettersNow.every(Boolean);

      if (!isCompleteNow) continue;



      const answerChars = answerCharsByWord[wId] || Array(tiles.length).fill(null);

      const computed = computeFeedback(answerChars, lettersNow);

      const computedState = computed[idx];

      if (!computedState) continue;



      if (computedState === "correct") {

        if (next[k]?.wordId === wId) {

          if (next === prev) next = { ...prev };

          delete next[k];

        }

      } else {

        if (next === prev) next = { ...prev };

        next[k] = { wordId: wId, dir: derivedWordsById[wId].dir, state: computedState };

      }

    }



    return next;

  });

};















const restoreSelectedWordTileFromSnapIfMatches = (S, wId, k, nextLetter) => {

// First try the selected word's own snap — using best across all history

const snap = getBestSnapForTile(S, wId, k, nextLetter);







if (snap?.cells && snap?.feedback) {

const snapLetter = (snap.cells[k] || "").toUpperCase();







if (snapLetter === nextLetter && snap.feedback[k]) {

const tilesW = derivedWordsById[wId]?.tiles || [];

const lettersNow = tilesW.map((t) => t.key === k ? nextLetter : (S.cells?.[t.key]?.letter || "").toUpperCase());

const isComplete = lettersNow.every(Boolean);

let finalState = snap.feedback[k];

if (isComplete) {

const ansChars = answerCharsByWord[wId] || Array(tilesW.length).fill(null);

const recomputed = computeFeedback(ansChars, lettersNow);

const idx = tilesW.findIndex((t) => t.key === k);

if (idx !== -1 && recomputed[idx]) finalState = recomputed[idx];

}

setFeedbackByWord((prev) => {

const next = { ...prev };

next[wId] = { ...(next[wId] || {}) };

next[wId][k] = finalState;

return next;

});

setLatestTouch((prev) => {

if (finalState === "correct") {

if (prev[k]?.wordId !== wId) return prev;

const next = { ...prev };

delete next[k];

return next;

}

const next = { ...prev };

next[k] = { wordId: wId, dir: derivedWordsById[wId].dir, state: finalState };

return next;

});

return;











}

}

// Selected word has no snap for this tile — check all OTHER words sharing this tile

const sharingWords = (tileToWords[k] || []).filter(id => id !== wId);

for (const otherId of sharingWords) {



const otherSnap = getBestSnapForTile(S, otherId, k, nextLetter);



if (!otherSnap?.cells || !otherSnap?.feedback) continue;

const otherSnapLetter = (otherSnap.cells[k] || "").toUpperCase();

if (otherSnapLetter !== nextLetter) continue;

const otherState = otherSnap.feedback[k];

if (!otherState) continue;

setFeedbackByWord((prev) => {
const next = { ...prev };
next[otherId] = { ...(next[otherId] || {}) };
next[otherId][k] = otherState;
// Also set on the currently selected word so it shows immediately without needing a word switch
if (!prev[wId]?.[k]) {
next[wId] = { ...(next[wId] || {}) };
next[wId][k] = otherState;
}
return next;
});
setLatestTouch((prev) => {
if (otherState === "correct") {
if (prev[k]?.wordId !== otherId) return prev;
const next = { ...prev };
delete next[k];
return next;
}
const next = { ...prev };
next[k] = { wordId: otherId, dir: derivedWordsById[otherId].dir, state: otherState };
return next;
});
break; // restore from first matching word only


}

};



















const typeLetterWithState = (S, letter) => {

  if (S.gameOver) return;

  if (S.revealAnim?.runId) return; // ✅ freeze during flip

  const wId = S.selectedWord;

  const k = S.focusedKey;

  if (!wId || !k) return;

  // ✅ lock greens (and solved-word tiles)

  if (isTileLockedInState(S, k)) {

    showToasts("That word is now locked");

    return;

  }

  const nextLetter = (letter || "").toUpperCase();

  const curLetter = (S.cells?.[k]?.letter || "").toUpperCase();

  // ✅ if user typed the same letter, do NOTHING (don’t clear feedback)

  // (optional: still advance focus so typing feels natural)

  if (curLetter === nextLetter) {

    const tiles = derivedWordsById[wId]?.tiles || [];

    const idx = tiles.findIndex((t) => t.key === k);

    if (idx !== -1 && idx < tiles.length - 1) {

      setFocusedKey(tiles[idx + 1].key);

    }

    return;

  }

// mark edited for impacted words
setEditedSinceSubmit((prev) => ({
    ...prev,
    [wId]: true,
  }));









  // only clear feedback when the letter actually changes

  clearFeedbackAtTileForAllWords(k);

  setLetterAt(k, nextLetter);



  // ✅ NEW: if they re-typed what they last submitted, restore that feedback automatically

const cached = retypeCacheRef.current[k];



if (cached && cached.letter === nextLetter) {

  // Restore the exact feedback that existed right before deletion

  setFeedbackByWord((prev) => {

    let next = prev;

    for (const [wId, st] of Object.entries(cached.byWord || {})) {

      if (!st) continue;

      if (next === prev) next = { ...prev };

      next[wId] = { ...(next[wId] || {}) };

      next[wId][k] = st;

    }

    return next;

  });



  setLatestTouch((prev) => {

    if (!cached.touch) return prev;

    let next = prev;

    if (next === prev) next = { ...prev };

    next[k] = cached.touch;

    return next;

  });



delete retypeCacheRef.current[k]; // one-time use
} else {
	restoreSelectedWordTileFromSnapIfMatches(S, wId, k, nextLetter);

  // Fallback: your existing safe restore (keep this!)
  if ((wordsAtTileCount[k] || 0) === 1) {
    restoreTileFeedbackFromLastSubmitIfMatches(S, k, nextLetter);
  }

  // live duplicate-letter feedback recompute (only for non-retype-cache path)
  const allWordsForTypedTile = tileToWords[k] || [wId];
  for (const wordId of allWordsForTypedTile) {
    recomputeWordFeedbackLive(S, wordId, { [k]: nextLetter });
  }

  // Fast path: show black immediately for confirmed-absent letters
  // Only applies when not restoring from retype cache
  if (S.keyStatesByWord?.[wId]?.[nextLetter] === "absent") {
    setFeedbackByWord((prev) => {
      if (prev[wId]?.[k]) return prev; // already has feedback — don't override
      const next = { ...prev };
      next[wId] = { ...(next[wId] || {}) };
      next[wId][k] = "absent";
      return next;
    });
  }
}



if ((wordsAtTileCount[k] || 0) > 1) {

  const correctAnswer = (tileAnswerMap?.[k] || "").toUpperCase();

  if (nextLetter === correctAnswer) {

    const sharingWords = (tileToWords[k] || []).filter(id => id !== wId);





	const thisWordHadCorrectHere = (() => {

      const snap = getBestSnapForTile(S, wId, k, nextLetter);

      return snap?.feedback?.[k] === "correct";

    })();

    if (thisWordHadCorrectHere) {









      setFeedbackByWord((prev) => {

        const next = { ...prev };

        next[wId] = { ...(next[wId] || {}) };

        next[wId][k] = "correct";

        return next;

      });

    }

  }

}









// advance focus





const tiles = derivedWordsById[wId]?.tiles || [];

const idx = tiles.findIndex((t) => t.key === k);

if (idx !== -1 && idx < tiles.length - 1) {

setFocusedKey(tiles[idx + 1].key);

}

};



const advanceFocusInSelectedWordWithState = (S) => {

  if (S.gameOver) return;

  if (S.revealAnim?.runId) return;



  const wId = S.selectedWord;

  const k = S.focusedKey;

  if (!wId || !k) return;



  const tiles = derivedWordsById[wId]?.tiles || [];

  const idx = tiles.findIndex((t) => t.key === k);



  if (idx !== -1 && idx < tiles.length - 1) {

    setFocusedKey(tiles[idx + 1].key);

  }

};

















  const backspaceWithState = (S) => {

  if (S.gameOver) return;

  if (S.revealAnim?.runId) return;



  const wId = S.selectedWord;

  const k = S.focusedKey;

  if (!wId || !k) return;



  const tiles = derivedWordsById[wId]?.tiles || [];

  const idx = tiles.findIndex((t) => t.key === k);



  const curLetter = (S.cells?.[k]?.letter || "").toUpperCase();



  // ✅ NEW: if current tile is already empty, move to previous tile first

  // ✅ if current tile is empty, ONLY move focus back (do NOT delete anything)

if (!curLetter) {

  if (idx > 0) {

    const prevKey = tiles[idx - 1].key;

    setFocusedKey(prevKey);

  }

  return;

}















  // ✅ existing behavior: current tile has a letter → delete it

  if (isTileLockedInState(S, k)) {

    showToasts("That word is now locked");

    return;

  }



  const affected = tileToWords[k] || [];

  const byWord = {};

  for (const ww of affected) {

    const st = S.feedbackByWord?.[ww]?.[k];

    if (st) byWord[ww] = st;

  }

  retypeCacheRef.current[k] = {

    letter: (S.cells?.[k]?.letter || "").toUpperCase(),

    byWord,

    touch: S.latestTouch?.[k] || null,

  };



clearFeedbackAtTileForAllWords(k);

setLetterAt(k, "");

const allWordsForBackspacedTile = tileToWords[k] || [wId];

for (const wordId of allWordsForBackspacedTile) {

recomputeWordFeedbackLive(S, wordId, { [k]: "" });

}

};

















  // ✅ MOBILE DETECTION (does not affect desktop)

const [isMobile, setIsMobile] = useState(false);





const showNoCluesNearPanel =

  !isMobile && toasts.some((m) => m === "No clues available");



const mobileKbdReserve = isMobile && !gameOver && !!focusedKey;



useEffect(() => {

  const update = () => {

    const coarse = window.matchMedia?.("(pointer: coarse)")?.matches;

    setIsMobile(coarse || window.innerWidth < 820);

  };

  update();

  window.addEventListener("resize", update);

  return () => window.removeEventListener("resize", update);

}, []);

















useEffect(() => {

if (!isMobile) return;

if (selectedWord) return;

const ids = Object.keys(derivedWordsById || {});

if (!ids.length) return;

const first = ids[0];

setSelectedWord(first);

const tiles = derivedWordsById[first]?.tiles || [];

if (tiles.length) setFocusedKey(tiles[0].key);

}, [isMobile, selectedWord, puzzleNumber, derivedWordsById]);

























// ✅ Mobile native keyboard driver

const mobileInputRef = useRef(null);

const [mobileKbdOpen, setMobileKbdOpen] = useState(false);



const onMobileInput = (e) => {

  const ch = (e.target.value || "").slice(-1);

  e.target.value = "";



  // ✅ never allow typing after game over

  if (gameOver) return;



  if (!ch) return;

  const up = ch.toUpperCase();

  if (up < "A" || up > "Z") return;

  onTypeLetter(up);

};





const focusMobileKeyboard = () => {

  if (!isMobile) return;

  setMobileKbdOpen(true);

  setTimeout(() => mobileInputRef.current?.focus?.(), 0);

};



const blurMobileKeyboard = () => {

  if (!isMobile) return;

  setMobileKbdOpen(false);

  mobileInputRef.current?.blur?.();

};







  useEffect(() => {

    const onKeyDown = (e) => {

      const S = stateRef.current;

      if (!S) return;

      if (S.gameOver) {

        if (

          e.key === "Enter" ||

          e.key === "Escape" ||

          e.key === "Backspace" ||

          /^[a-zA-Z]$/.test(e.key) ||

          ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)

        ) {

          e.preventDefault();

        }

        return;

      }



	  if (S.revealAnim?.runId) {

		  if (

			e.key === "Enter" ||

			e.key === "Escape" ||

			e.key === "Backspace" ||

			/^[a-zA-Z]$/.test(e.key) ||

			["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)

		  ) {

			e.preventDefault();

		  }

		  return;

		}





   if (e.key === "Enter") {

e.preventDefault();

onSubmitAll();

return;

}







      if (e.key === "Escape") {

        e.preventDefault();

        if (!S.selectedWord) return;

        revertSelectedWordWithState(S);

        return;

      }

      if (e.key === "Backspace") {

        e.preventDefault();

        if (!S.selectedWord) return;

        backspaceWithState(S);

        return;

      }

      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {

        e.preventDefault();

        if (!S.focusedKey) return;

        const wordsHere = getWordsAtTile(S.focusedKey);

        let targetWord = null;

        let step = 0;

        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {

          targetWord = wordsHere.find((w) => w.dir === "across");

          step = e.key === "ArrowRight" ? 1 : -1;

        } else {

          targetWord = wordsHere.find((w) => w.dir === "down");

          step = e.key === "ArrowDown" ? 1 : -1;

        }

        if (!targetWord) return;

if (S.selectedWord !== targetWord.id) {

  allowClueAutoScrollRef.current = true; // ✅ make panel follow arrow-key selection

  setSelectedWord(targetWord.id);

}

        const tiles = derivedWordsById[targetWord.id].tiles;

        const idx = tiles.findIndex((t) => t.key === S.focusedKey);

        const nextIdx = idx === -1 ? 0 : Math.min(tiles.length - 1, Math.max(0, idx + step));

        setFocusedKey(tiles[nextIdx].key);

        return;

      }

      if (/^[a-zA-Z]$/.test(e.key)) {

        e.preventDefault();

        if (!S.selectedWord) return;

        typeLetterWithState(S, e.key.toUpperCase());

      }

    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);

    // eslint-disable-next-line react-hooks/exhaustive-deps

  }, [derivedWordsById, tileToWords]);

  const onTypeLetter = (letter) => {

    const S = stateRef.current;

    if (!S) return;

    typeLetterWithState(S, letter);

  };

  const onBackspace = () => {

    const S = stateRef.current;

    if (!S) return;

    backspaceWithState(S);

  };





const onSubmitAll = () => {

const S = stateRef.current;

if (!S) return;





const allFilled = Object.keys(derivedWordsById).every((wId) => wordIsCompleteInCells(S, wId));

const anyComplete = Object.keys(derivedWordsById).some((wId) => {

  if (!wordIsCompleteInCells(S, wId)) return false;

  const guess = getWordStringFromCells(S, wId);

  const answerOverride = solution?.answerByWord?.[wId] || null;

  return isValidWord(guess, answerOverride);

});

const tipKey = `kzw_partial_tip_${puzzleNumber}`;

const tipSeen = localStorage.getItem(tipKey);

if (S.submissions === 0 && !allFilled && anyComplete && !tipSeen) {







  setShowPartialWarning(true);

  return;

}

submitAllCompleteWordsWithState(S);

};









  const onUndo = () => {

    const S = stateRef.current;

    if (!S) return;

    revertSelectedWordWithState(S);

  };









  const lockedTiles = useMemo(() => {

  const s = new Set();

  for (const [id, solved] of Object.entries(wordSolvedEver || {})) {

    if (!solved) continue;

    const tiles = derivedWordsById[id]?.tiles || [];

    for (const t of tiles) s.add(t.key);

  }

  return s;

}, [wordSolvedEver, derivedWordsById]);





 // ✅ CLEAR: clears the selected word's editable tiles:

// - removes letters

// - removes feedback color (across ALL words that touch those tiles)

// - removes greenEverTiles ONLY if that tile is NOT part of a solved/locked word

const clearSelectedWord = React.useCallback(() => {

  if (!selectedWord) return;

  const w = derivedWordsById?.[selectedWord];

  if (!w?.tiles?.length) return;



  const keysToClear = w.tiles.map((t) => t.key);



  // 1) Clear letters (but NEVER touch locked tiles)

  setCells((prev) => {

    const next = { ...prev };

    for (const k of keysToClear) {

      if (lockedTiles?.has?.(k)) continue; // ✅ keep solved/locked tiles

      next[k] = { ...(next[k] || { letter: "" }), letter: "" };

    }

    return next;

  });



  // 2) Clear feedback colors for those tiles (so tiles lose yellow/gray/green)

  for (const k of keysToClear) {

    if (lockedTiles?.has?.(k)) continue;

    clearFeedbackAtTileForAllWords(k);

  }



  // 3) Remove saved "greens" if they are NOT locked tiles

  setGreenEverTiles((prev) => {

    if (!prev) return prev;

    let changed = false;

    const next = { ...prev };

    for (const k of keysToClear) {

      if (lockedTiles?.has?.(k)) continue;

      if (next[k]) {

        delete next[k];

        changed = true;

      }

    }

    return changed ? next : prev;

  });



  // 4) Mark edited

  setEditedSinceSubmit?.((prev) => ({ ...(prev || {}), [selectedWord]: true }));

}, [

  selectedWord,

  derivedWordsById,

  lockedTiles,

  clearFeedbackAtTileForAllWords,

  setCells,

  setGreenEverTiles,

  setEditedSinceSubmit,

]);















 const resetAll = () => {

  const S = stateRef.current;

  if (S?.revealAnim?.runId) return; // ✅ block resets during flip

  // ✅ also stop any pending timers so nothing “finishes” after reset

  if (revealTimerRef.current) {

    clearTimeout(revealTimerRef.current);

    revealTimerRef.current = null;

  }

  if (toastTimerRef.current) {

    clearTimeout(toastTimerRef.current);

    toastTimerRef.current = null;

  }

  if (resultToastTimerRef.current) {

    clearTimeout(resultToastTimerRef.current);

    resultToastTimerRef.current = null;

  }



setClueTokens(0);

setUnlockedCluesByDay({ [puzzleNumber]: {} });

setSpentCluesByDay({ [puzzleNumber]: {} });

try {

localStorage.removeItem(dayTokensKey(puzzleNumber));

localStorage.removeItem(dayUnlocksKey(puzzleNumber));

localStorage.removeItem(daySpentKey(puzzleNumber));

localStorage.removeItem(LAST_PLAYED_KEY);

} catch {}





    const init = {};

    for (const k of tileSet) init[k] = { letter: "" };

    setCells(init);



    setFeedbackByWord({});

    setLatestTouch({});

    setLastViewed({});

    setSubmitHistoryByWord({});

    setKeyStatesByWord({});

    setSelectedWord(null);

    setFocusedKey(null);

    setSubmissions(0);

    setWordAttempts({});

    setWordSolvedEver({});

    setGameOver(false);

    setDidWin(false);

    setLastShareText("");

    setRevealAnim({ runId: 0, tiles: {} });

    setShowHelp(false);

    setToasts([]);

	setEditedSinceSubmit({});

	setGreenEverTiles({});

	setShowResults(false);      // ✅ add this (you missed it)

    setResultToast("");         // ✅ add this (optional but clean)

  };



  // ✅ Keyboard should reflect the *display truth* (same as tiles), not cached per-word history

const buildKeyboardStateForWord = (wId, S) => {

  if (!wId) return {};



  const rank = { absent: 1, present: 2, correct: 3 };

  const out = {};



  const tiles = derivedWordsById[wId]?.tiles || [];

  for (const t of tiles) {

    const k = t.key;

    const ch = (S.cells?.[k]?.letter || "").toUpperCase();

    if (!ch) continue;



    const { state } = pickDisplayState({

      tileKey: k,

      feedbackByWord: S.feedbackByWord,

      selectedWord: wId,             // ✅ IMPORTANT: treat THIS word as selected

      latestTouch: S.latestTouch || {},

      lastViewed: S.lastViewed || {},

      wordsAtTileCount,

      derivedWordsById,

      globalCellState: computeGlobalCellState(S.feedbackByWord),



    });



    if (!state) continue;



    const existing = out[ch];

    if (!existing || rank[state] > rank[existing]) out[ch] = state;

  }



  return out;

};





// ✅ PER-WORD keyboard: shows only the selected word's keyboard history

const keyboardState = useMemo(() => {

  if (!selectedWord) return {};

  return keyStatesByWord?.[selectedWord] || {};

}, [keyStatesByWord, selectedWord]);



















  const selectedTilesSet = useMemo(() => {

    if (!selectedWord) return new Set();

    return new Set(getSelectedTiles(selectedWord).map((t) => t.key));

  }, [selectedWord, derivedWordsById]);

  const numberAt = (r, c) => {

    const found = Object.values(WORDS_DECLARED).find((w) => w.row === r && w.col === c);

    return found?.number ?? null;

  };

  /**

   * ✅ SCREEN FIT FIX (fits 1 page)

   * - Now considers BOTH rows and cols (so keyboard never gets pushed down).

   */

  /**

   * ✅ SCREEN FIT FIX (fits 1 page)

   */

  /**

   * ✅ SCREEN FIT FIX (fits 1 page)

   */





const [tilePx, setTilePx] = useState(45);





const [kbdPx, setKbdPx] = useState(48); // keyboard knob — kept proportional to tilePx





const [windowH, setWindowH] = useState(0);

const [windowW, setWindowW] = useState(0);





useEffect(() => {

  const recompute = () => {

    const rows = renderGrid.length;

    const cols = renderGrid[0]?.length || 0;

    if (!rows || !cols) return;



    // ✅ space budget (mobile only)

const headerReserve = 155;

const mobileScaleLocal = Math.min(1.15, Math.max(0.82, window.innerWidth / 390));

const keyboardReserve = Math.round(335 * mobileScaleLocal) + 68; // +68 for history strip

const marginReserve = 32;



    // ✅ REAL available box (subtract a bit more than 32 because your grid wrapper + inner wrappers add padding)

    const availH = window.innerHeight - headerReserve - keyboardReserve - marginReserve;













// ✅ MOBILE padding budget (prevents right-side cut-off on iOS)

// Match this to your REAL padding below (we’re reducing real padding too)

const MOBILE_AVAILW_PAD = Math.max(20, Math.round(44 * mobileScaleLocal));





const availW = Math.min(window.innerWidth, 640) - MOBILE_AVAILW_PAD;





// ✅ Solve for tilePx considering gaps scale with tilePx:

const solveTileFromW = () => {

  const a = cols + (cols - 1) * (8 / 62);

  return Math.floor(availW / a);

};

const solveTileFromH = () => {

  const a = rows + (rows - 1) * (8 / 62);

  return Math.floor(availH / a);

};



const maxTile = Math.min(solveTileFromW(), solveTileFromH());



// ✅ mobile-only clamp (allow slightly smaller min so wide shapes never cut off)

const clamped = Math.max(32, Math.min(62, maxTile)); // knob: min 30–36



if (isMobile) {

  setTilePx(clamped);

} else {

  // DESKTOP SCALING: fit grid + keyboard + header in viewport proportionally.

  // T_FACTOR ≈ 12.5 is approximately constant for all grid sizes because

  // the gridExtraTopPx cushion compensates for shorter grids.

  // It encodes: (grid rows factor) + (0.5-row bottom cushion) + (keyboard spacer factor).

  const DESKTOP_T_FACTOR = 11.36;

  // DESKTOP_OVERHEAD = approx fixed px consumed by header (~85px) + grid marginTop (~16px) + inner padding (~8px).

  const DESKTOP_OVERHEAD = 156;





// Width constraint: grid container on desktop is wider to allow larger tiles on big screens

const gridContainerW = Math.min(window.innerWidth, isMobile ? 640 : 960) - 56;







 const safeDesktopTileFromClue = !isMobile && cols > 0

? Math.floor((window.innerWidth / 2 - 32) / ((cols + (cols - 1) * (8 / 62)) / 2 + 300 / 45))

: 999;

const tFromW = cols > 0

? Math.min(Math.floor(gridContainerW / (cols + (cols - 1) * (8 / 62))), safeDesktopTileFromClue)

: 999;





  const tFromH = Math.floor((window.innerHeight - DESKTOP_OVERHEAD) / DESKTOP_T_FACTOR);

  const tDesktop = Math.min(tFromH, tFromW);

  const clampedDesktop = Math.max(36, Math.min(76, tDesktop));

  setTilePx(clampedDesktop);

  // Keep keyboard proportional: maintain the same kbdPx/tilePx ratio (48/45)



  setKbdPx(Math.round(clampedDesktop * (48 / 45)));

setWindowH(window.innerHeight);

setWindowW(window.innerWidth);



}















  };



  recompute();

  window.addEventListener("resize", recompute);

  return () => window.removeEventListener("resize", recompute);

}, [renderGrid, isMobile]);





































// ✅ PROPORTIONAL SCALING (DO NOT MOVE)

const BASE_TILE = 62;



const tileScale = tilePx / BASE_TILE; // grid scale

const kbdScale = kbdPx / BASE_TILE; // keyboard scale

// kbdPxRef scales key widths/gaps from the Mac baseline (kbdPx=48 = ratio 1.0)

const kbdPxRef = isMobile ? 1 : (kbdPx / 48);

const kbdGapPx = Math.round(8 * kbdPxRef);



const kbdMaxW = Math.max(640, Math.ceil(576 * kbdPxRef) + 32);





const uiScale = isMobile ? 1 : kbdPxRef;



const mobileScreenScale = isMobile && windowW > 0 ? Math.min(1.15, Math.max(0.82, windowW / 390)) : 1;

// Add these two lines:
const MOBILE_KBD_H = Math.round(230 * mobileScreenScale);
const MOBILE_HIST_RESERVE = isMobile && !showResults ? 82 : 0;
const MOBILE_RESULTS_BTN_H = 60;

const clueW = isMobile ? 300 : Math.round(300 * Math.min(1.6, Math.max(1, uiScale)));



const gridHalfW = isMobile ? 320 : Math.max(480, Math.round(kbdMaxW / 2 + 4));









const MOBILE_KBD_PAD_Y = 8;

// ✅ iOS-like spacing: a bit wider air between keys

const MOBILE_KBD_GAP = Math.max(8, Math.round(12 * kbdScale));



// (MOBILE_KEY_H isn’t really used in your current JSX; safe to leave)

const MOBILE_KEY_H = Math.round(46 * mobileScreenScale);



const MOBILE_CLUE_TO_KEYS_GAP = 4;    // tighter than 6









const TILE_SIZE = `${tilePx}px`;

const gapPx = Math.round(8 * tileScale);

const GAP_SIZE = `${gapPx}px`;





const RESULTS_BTN_MT = 100; // try 18–44





const MAX_GRID_ROWS = 7;

const GRID_BOTTOM_CUSHION_ROWS = isMobile ? 0.75 : 0.5;



const gridRowsUsed = renderGrid.length;



// target where we WANT the bottom of the grid to end visually

const targetRows = MAX_GRID_ROWS - GRID_BOTTOM_CUSHION_ROWS;



// only push down enough to reach the target, not all the way to 7

const missingRowsToTarget = Math.max(0, targetRows - gridRowsUsed);



const gridExtraTopPx = missingRowsToTarget * (tilePx + gapPx);







// ✅ keep desktop exactly as-is

const GRID_NUDGE_Y_DESKTOP = -18;

const GRID_ONLY_PUSH_DOWN_DESKTOP = 10;



// ✅ MOBILE knobs (reduce big gap above keyboard)

const GRID_NUDGE_Y_MOBILE = 6;

const GRID_ONLY_PUSH_DOWN_MOBILE = 2;













// ✅ KEYBOARD PINNING (toggle)

const PIN_KEYBOARD = true; // set to false to revert to old behavior



// tune this if you change keyboard height

const KEYBOARD_FIXED_BOTTOM = 4; // px from bottom





// ✅ SAFE spacer height (prevents runtime crash if scale ever breaks)

const KEYBOARD_SPACER_H = (() => {



const kbdH = 3 * Math.round(70 * kbdScale) + 2 * kbdGapPx + 6;



const v = kbdH + 18 + 12;

return Number.isFinite(v) ? v : 260;

})();







// Center the grid vertically in the space between header and keyboard — consistent across all shapes

const GRID_VCENTER_PUSH = (() => {

if (isMobile) return 0;

if (!windowH) return 0;

const gridRowsH = gridRowsUsed * tilePx + Math.max(0, gridRowsUsed - 1) * gapPx;

const spare = windowH - 136 - gridExtraTopPx - gridRowsH - KEYBOARD_SPACER_H;

return Math.max(0, Math.round(spare * 0.5));

})();







// Arrow sizing / spacing (scales with tile size)

const arrowInsetAcross = Math.round(0 * tileScale); // → knob

const arrowInsetDown   = Math.round(0 * tileScale); // ↓ knob (usually needs a bit more)

const arrowFont   = Math.round(15 * tileScale);    // arrow glyph size

const arrowPadX   = Math.round(2 * tileScale);     // tight horizontal padding

const arrowPadY   = Math.round(1 * tileScale);     // tight vertical padding

const arrowBorder = 1;                         // thin border (keep 1px)

// ✅ Approx arrow bubble box size (used to nudge letters away)

const arrowBoxW = arrowFont + arrowPadX * 2 + arrowBorder * 2;

const arrowBoxH = arrowFont + arrowPadY * 2 + arrowBorder * 2;

// ✅ Letter nudge ONLY when arrow is present (prevents touching)

const letterNudgeX = Math.round(arrowBoxW * 0.28); // push left

const letterNudgeY = Math.round(arrowBoxH * 0.06); // tiny push down

const DEFAULT_LETTER_Y = Math.round(3 * tileScale);

const DOWN_ARROW_EXTRA_Y = Math.round(0 * tileScale);





const doShare = async ({ mode = "copy" } = {}) => {

  const S = stateRef.current;

  if (!S) return;



  const text =

    lastShareText ||

    buildShareTextFromState(

      { ...S, latestTouch: S.latestTouch, lastViewed: S.lastViewed },

      S.feedbackByWord,

      S.didWin

    );



  // ✅ iOS paste fix: remove emoji variation selectors everywhere

  // (this is the invisible "️" char that causes misalignment)

  const outText = text

    .replace(/\uFE0F/g, "")

    .replaceAll("\r\n", "\n");













  // ✅ Share-sheet mode (if you ever use it)

  if (mode === "share" && navigator?.share) {

    try {

      await navigator.share({ text: outText });

    } catch {

      // user cancelled -> do nothing

    }

    return;

  }



  // ✅ Copy mode

try {

  // Prefer ClipboardItem when available (helps iOS share/paste targets)

  if (navigator?.clipboard?.write && typeof ClipboardItem !== "undefined") {

    const plain = new Blob([outText], { type: "text/plain" });



    // Optional: some apps prefer rich text; <pre> preserves newlines visually

    const html = new Blob(

      [`<pre style="white-space:pre-wrap;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;">${outText

  .replaceAll("&", "&amp;")

  .replaceAll("<", "&lt;")

  .replaceAll(">", "&gt;")}</pre>`],

      { type: "text/html" }

    );



    await navigator.clipboard.write([new ClipboardItem({ "text/plain": plain, "text/html": html })]);



    if (stateRef.current?.gameOver) showResultToast("Copied to clipboard");

    else showToasts("Copied to clipboard ✅");

    return;

  }



  // Fallback

  if (navigator?.clipboard?.writeText) {

    await navigator.clipboard.writeText(outText);

    if (stateRef.current?.gameOver) showResultToast("Copied to clipboard");

    else showToasts("Copied to clipboard ✅");

    return;

  }

} catch {}













 // Last resort: iOS-safe copy fallback (better than textarea for emoji grids)

try {

  const el = document.createElement("div");

  el.setAttribute("contenteditable", "true");

  el.style.position = "fixed";

  el.style.left = "-9999px";

  el.style.top = "0";

  el.style.whiteSpace = "pre";           // keep newlines exactly

el.style.fontFamily = "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif";

  el.textContent = outText;



  document.body.appendChild(el);



  const range = document.createRange();

  range.selectNodeContents(el);



  const sel = window.getSelection();

  sel.removeAllRanges();

  sel.addRange(range);



  document.execCommand("copy");



  document.body.removeChild(el);

  sel.removeAllRanges();



  if (stateRef.current?.gameOver) showResultToast("Copied to clipboard");

  else showToasts("Copied to clipboard ✅");

} catch {

  if (stateRef.current?.gameOver) showResultToast("Copy failed");

  else showToasts("Copy failed");

}











};











  const wordListSorted = useMemo(() => {

    const ids = Object.keys(derivedWordsById || {});

    ids.sort((a, b) => {

      const wa = derivedWordsById[a];

      const wb = derivedWordsById[b];

      if ((wa.number || 0) !== (wb.number || 0)) return (wa.number || 0) - (wb.number || 0);

      const da = wa.dir === "across" ? 0 : 1;

      const db = wb.dir === "across" ? 0 : 1;

      if (da !== db) return da - db;

      return a.localeCompare(b);

    });

    return ids;

  }, [derivedWordsById]);



  const acrossIds = useMemo(() => wordListSorted.filter((id) => id.endsWith("A")), [wordListSorted]);

  const downIds = useMemo(() => wordListSorted.filter((id) => id.endsWith("D")), [wordListSorted]);







// ✅ MOBILE word navigation order (NYT-like)

const mobileWordOrder = useMemo(() => [...acrossIds, ...downIds], [acrossIds, downIds]);



const jumpToWord = (id) => {

if (!id) return;

setSelectedWord(id);

const tiles = derivedWordsById[id]?.tiles || [];

if (tiles.length) setFocusedKey(tiles[0].key);









const S = stateRef.current;

if (S) recomputeWordFeedbackLive(S, id);

syncGlobalGreensToWord(id);

restoreWordFeedbackOnSelect(id);

};



const mobilePrevWord = () => {

  if (!selectedWord || mobileWordOrder.length === 0) return;

  const i = mobileWordOrder.indexOf(selectedWord);

  const prev = mobileWordOrder[(i <= 0 ? mobileWordOrder.length : i) - 1];

  jumpToWord(prev);

};



const mobileNextWord = () => {

  if (!selectedWord || mobileWordOrder.length === 0) return;

  const i = mobileWordOrder.indexOf(selectedWord);

  const next = mobileWordOrder[(i + 1) % mobileWordOrder.length];

  jumpToWord(next);

};









  const clueText = useMemo(() => {

    const raw = PUZZLE.clue || "";

    const cleaned = raw.replace(/^Clue:\s*/i, "").trim();

    return `Today's Clue: ${cleaned}`;

  }, [PUZZLE.clue]);













function ClueCard({ id, suppressClueAutoScrollRef, allowClueAutoScrollRef }) {

  const isSel = selectedWord === id;

  const cardRef = React.useRef(null);











React.useEffect(() => {

  if (!isSel) return;

  // ✅ If a hold/unlock is happening, do not auto-scroll (prevents yank)

  if (suppressClueAutoScrollRef?.current) return;



// ✅ Only scroll when selection came from an actual click (grid OR panel)

if (!allowClueAutoScrollRef?.current) return;

allowClueAutoScrollRef.current = false;









  const scroller = cluesScrollRef.current;

  const card = cardRef.current;

  const stickyH = 0;

  if (!scroller || !card) return;



  const scrollerRect = scroller.getBoundingClientRect();

  const cardRect = card.getBoundingClientRect();



  // Visible window inside the scroller (accounting for sticky header)

  const visibleTop = scrollerRect.top + stickyH + 8;

  const visibleBottom = scrollerRect.bottom - 8;



  const fullyVisible =

    cardRect.top >= visibleTop && cardRect.bottom <= visibleBottom;



  // ✅ If it’s already visible, do NOT pull the scroll (no magnet).

  if (fullyVisible) return;



  // Otherwise, scroll just enough to bring it into view.

  const currentCardTop = (cardRect.top - scrollerRect.top) + scroller.scrollTop;

  const targetTop = Math.max(

  0,

  currentCardTop - stickyH - (scrollerRect.height / 2) + (cardRect.height / 2)

);



  scroller.scrollTo({ top: targetTop, behavior: "smooth" });

}, [isSel]);





















  const unlocked = isClueUnlockedForDay(puzzleNumber, id);

  const solved = Boolean(wordSolvedEver?.[id]);

  const hasClue = Boolean(getClueTextForDay(puzzleNumber, id));

  const clueText = getClueTextForDay(puzzleNumber, id);



	const clueScrollerRef = useRef(null);

	const clueCardRefs = useRef({}); // { "4A": HTMLElement, "1D": HTMLElement, ... }



	const retypeCacheRef = useRef({});







  const beginRef = React.useRef(null);

  const stopRef = React.useRef(null);

  const holdTriggeredRef = React.useRef(false);



  const pressRef = React.useRef(false);

  const noClueTimerRef = React.useRef(null);



  const locked = !unlocked;

const disabled = gameOver || solved || !hasClue || (locked && clueTokens <= 0);







  return (



  <div

      ref={cardRef}



  style={{

    width: "100%",

    borderRadius: 14,





border: isSel

  ? (isPurpleBg

      ? "2px solid rgba(217,70,239,0.75)"

      : "2px solid rgba(59,130,246,0.75)")

  : solved

    ? "2px solid rgba(17,24,39,0.10)"   // ✅ solved override (works locked/unlocked)

    : (unlocked

        ? "2px solid rgba(17,24,39,0.20)"

        : "2px solid rgba(17,24,39,0.12)"),





boxShadow: isSel

  ? (isPurpleBg

      ? "0 0 18px rgba(217,70,239,0.22)"

      : "0 0 18px rgba(59,130,246,0.16)")

  : "0 2px 10px rgba(0,0,0,0.06)",



background: isSel

  ? (isPurpleBg

      ? "rgba(217,70,239,0.16)"

      : "rgba(59,130,246,0.10)")

  : solved

    ? (isPurpleBg ? "rgba(17,24,39,0.08)" : "rgba(0,0,0,0.06)")  // ✅ solved override

    : "rgba(255,255,255,0.92)",







    overflow: "hidden",

opacity: solved ? 0.55 : 1,



    display: "flex",

    flexDirection: "column",

    flex: "0 0 auto", // ✅ prevents flex weirdness inside scroll containers

  }}

>





      <div

        className="clueRow"

        style={{

          display: "flex",

          alignItems: "center",



gap: Math.round(10 * uiScale),

padding: `${Math.round(10 * uiScale)}px ${Math.round(10 * uiScale)}px`,

cursor: gameOver ? "default" : "pointer",





          userSelect: "none",

        }}













onPointerDown={(e) => {

  holdTriggeredRef.current = false;

  pressRef.current = true;



  const wantsUnlock = locked && hasClue && !solved && !gameOver;

  if (!wantsUnlock) return;



  suppressClueAutoScrollRef.current = true; // ✅ ADD





  // If no clues left, only react to an actual HOLD (not a click)

  if (clueTokens <= 0) {

    noClueTimerRef.current = setTimeout(() => {

      if (!pressRef.current) return; // released early → just a click

      holdTriggeredRef.current = true; // prevents click selection

      showToasts("No clues available");

    }, 650); // match your hold intent delay



    return;

  }

  // Normal hold-to-unlock path

  beginRef.current?.();

}}















onPointerUp={() => {

  pressRef.current = false;

  if (noClueTimerRef.current) clearTimeout(noClueTimerRef.current);

  noClueTimerRef.current = null;

  stopRef.current?.();

    suppressClueAutoScrollRef.current = false; // ✅ ADD



}}



onPointerCancel={() => {

  pressRef.current = false;

  if (noClueTimerRef.current) clearTimeout(noClueTimerRef.current);

  noClueTimerRef.current = null;

  stopRef.current?.();

    suppressClueAutoScrollRef.current = false; // ✅ ADD



}}



onPointerLeave={() => {

  pressRef.current = false;

  if (noClueTimerRef.current) clearTimeout(noClueTimerRef.current);

  noClueTimerRef.current = null;

  stopRef.current?.();

    suppressClueAutoScrollRef.current = false; // ✅ ADD



}}



onClick={() => {

  if (gameOver) return;



  // ✅ If they held (either real unlock or "no clues" hold), ignore click

  if (holdTriggeredRef.current) {

    holdTriggeredRef.current = false;

    return;

  }



  allowClueAutoScrollRef.current = true; // ✅ panel click should scroll too







  setSelectedWord(id);

  const tiles = derivedWordsById[id]?.tiles || [];

  if (tiles.length) setFocusedKey(tiles[0].key);

}}





      >



<div style={{ width: Math.round(44 * Math.max(1, uiScale)), fontWeight: 900,

fontSize: isMobile ? 13 : Math.round(11 * Math.max(1, uiScale)) }}>{id}</div>



        <div style={{ flex: 1 }}>

          <HoldToUnlockSlot

            locked={!unlocked}

            disabled={disabled}

			onUnlock={() => {

			  holdTriggeredRef.current = true;

			  unlockClueForWord(id);

			    // ✅ allow scroll again immediately after the unlock action kicks off

				suppressClueAutoScrollRef.current = false;

			}}

            _capture={(begin, stop) => {

              beginRef.current = begin;

              stopRef.current = stop;

            }}

          />

        </div>



        <div style={{ width: 22, textAlign: "right", fontSize: 14, opacity: hasClue ? 1 : 0.35 }}>

          {unlocked ? "📖" : "🔒"}

        </div>

      </div>



      <div

        style={{



maxHeight: unlocked ? Math.round(100 * Math.max(1, uiScale)) : 0,

          transition: "max-height 180ms ease",

          overflow: "hidden",

          borderTop: unlocked ? "1px solid rgba(0,0,0,0.08)" : "none",

        }}

      >

        <div

          style={{



			padding: `${Math.round(10 * Math.max(1, uiScale))}px ${Math.round(10 * Math.max(1, uiScale))}px ${Math.round(12 * Math.max(1, uiScale))}px ${Math.round(10 * Math.max(1, uiScale))}px`,





fontSize: isMobile ? 12 : Math.round(12 * uiScale),

            fontWeight: 800,

            lineHeight: 1.25,

            background: isPurpleBg ? "#ffffff" : "#ffffff",

            wordBreak: "break-word",

            whiteSpace: "normal",

			display: "-webkit-box",



			WebkitLineClamp: isMobile ? 2 : 3,



			WebkitBoxOrient: "vertical",

			overflow: "hidden",



          }}

        >

          {clueText}

        </div>

      </div>

    </div>

  );

}





  const [isPurpleBg, setIsPurpleBg] = useState(false);



const appBg = isPurpleBg ? PURPLE_BG : WORDLE.appBg;

const appText = isPurpleBg ? "rgba(255,255,255,0.92)" : WORDLE.textDark;













return !puzzleReady ? (

  <div

    className="flex flex-col items-center justify-center"

    style={{

      background: WORDLE.appBg,

      color: WORDLE.textDark,

      width: "100%",

      height: "100dvh",

      overflow: "hidden",

      fontWeight: 900,

      fontSize: 16,

    }}

  >

    Loading...

  </div>

) : (

  <div

    className="flex flex-col items-center"

    style={{

      background: appBg,

      color: appText,

      width: "100%",

      height: isMobile ? "100dvh" : "auto",

      overflowY: "hidden",

      overflowX: isMobile ? "hidden" : "visible",

      paddingBottom: !isMobile ? 0 : showResults ? 0 : gameOver ? (MOBILE_RESULTS_BTN_H + MOBILE_HIST_RESERVE) : (MOBILE_KBD_H + MOBILE_HIST_RESERVE),

      boxSizing: "border-box",

      overscrollBehavior: "none",

    }}

  >





















    <style>{`







html, body {

  background: ${appBg};

  margin: 0;

  padding: 0;

  overscroll-behavior: none;

  height: 100%;

  overflow: hidden;          /* ✅ zero scroll on BOTH */

}

${isMobile ? `

html, body {

  touch-action: none;        /* ✅ stops drag scrolling on mobile */

}

` : ""}







@keyframes kazSparkleBtn {

0% { background-position: 0% 50%; }

50% { background-position: 100% 50%; }

100% { background-position: 0% 50%; }

}

@keyframes cw-flip {









		  0%   { transform: rotateX(0deg); background: var(--fromBg); border-color: var(--fromBorder); color: var(--fromText); }

		  49%  { transform: rotateX(90deg); background: var(--fromBg); border-color: var(--fromBorder); color: var(--fromText); }

		  50%  { transform: rotateX(90deg); background: var(--toBg);   border-color: var(--toBorder);   color: var(--toText); }

		  100% { transform: rotateX(0deg);  background: var(--toBg);   border-color: var(--toBorder);   color: var(--toText); }

		}



        @keyframes cw-focusPulse {

          0%, 100% { transform: scale(1.02) translateY(0px); }

          50%      { transform: scale(1.05) translateY(-2px); }

        }



/* ✅ MOBILE: disable iOS text selection + callout (prevents selection handles) */

@media (max-width: 768px) {

  html, body {

    -webkit-touch-callout: none; /* disables iOS callout */

    -webkit-user-select: none;   /* disables selection on iOS Safari */

    user-select: none;           /* standard */

  }



  /* extra belt + suspenders */

  * {

    -webkit-user-select: none;

    user-select: none;

    -webkit-tap-highlight-color: transparent;

    -webkit-touch-callout: none;

  }

}





		/* ✅ MOBILE version (GPU-stable): same look, less flicker risk */

@keyframes cw-focusPulseMobile {

  0%, 100% { transform: translate3d(0,0,0) scale(1.02); }

  50% { transform: translate3d(0,-2px,0) scale(1.05); }

}





		.clueRow {

  display: flex;

  align-items: center;

  gap: 10px;

}







.unlockSlot {

  position: relative;

  flex: 1;

  height: 40px;

  border-radius: 12px;

  background: #ffffff;

  border: 1px solid rgba(0,0,0,0.10);

  overflow: hidden;

  user-select: none;

  cursor: pointer;

  display: flex;

  align-items: center;

  justify-content: center;

}



/* ✅ MOBILE ONLY: make AVAILABLE (locked, not disabled) darker */

@media (max-width: 768px) {

  .unlockSlot:not(.disabled):not(.unlocked) {

    background: #ffffff; /* ✅ white fill */

    border-color: rgba(0,0,0,0.14);

  }

}



/* ✅ Ensure “available” (not disabled) is dark like PC */

.unlockSlot { color: #111827; }

.unlockSlot .unlockText { color: inherit; }



/* Disabled stays grey */

.unlockSlot.disabled { color: #6b7280; }

.unlockSlot.disabled .unlockText { color: #6b7280; }









.unlockSlot.disabled {

  opacity: 1;

  cursor: not-allowed;

  background: #e5e7eb; /* ✅ mobile stays grey when disabled */

 border-color: rgba(0,0,0,0.10);

}



.unlockSlot.disabled .unlockText {

  color: #6b7280;                      /* ✅ readable grey text */

}















.unlockSlot.unlocked {

  opacity: 1;         /* ✅ unlocked is readable by default */

  cursor: default;

  font-size: 10px;

  font-weight: 900;



}

.unlockSlot.unlocked.dimUnlocked {

  opacity: 0.55;      /* ✅ keep old behavior where you want it */

}



/* ✅ MOBILE ONLY: when viewing an unlocked clue, don't "extra-dim" it.

   Make it match the same grey look as the 0-token disabled state. */

@media (max-width: 768px) {

  .unlockSlot.unlocked.dimUnlocked {

    opacity: 1;                /* remove extra grey wash */

    background: #e5e7eb;       /* same as disabled */

    border-color: rgba(0,0,0,0.10);

    color: #6b7280;            /* same as disabled text */

  }

  .unlockSlot.unlocked.dimUnlocked .unlockText {

    color: #6b7280;

  }

}









.unlockFill {

  position: absolute;

  inset: 0;

  transform: scaleX(0);

  transform-origin: left;

  background: rgba(140, 80, 255, 0.45); /* ✅ purple */

  transition: transform 40ms linear;

}



.unlockText {

  position: relative;

  z-index: 1;

  font-size: 12px;

  font-weight: 900;

  text-align: center;

  line-height: 1.12;

  display: flex;

  flex-direction: column;

  align-items: center;

  justify-content: center;

  min-width: 0;

  white-space: normal;

   overflow: hidden;





display: -webkit-box;

  -webkit-box-orient: vertical;

  -webkit-line-clamp: 2;

}



@media (max-width: 768px) {

  .unlockText {

    -webkit-line-clamp: 3; /* more clue words fit */

  }

  .unlockSlot {

    height: 52px; /* more vertical room */

  }

}









@media (min-width: 769px) {

.unlockSlot {

height: ${Math.round(34 * Math.max(1, uiScale))}px;

/* smaller container on PC */

border-radius: 10px;

}

.unlockText {

font-size: ${Math.round(10 * Math.max(1, uiScale))}px;

/* normal-size "Hold to Unlock" on PC */

line-height: 1.1;

}

.unlockSlot.unlocked {

font-size: ${Math.round(11 * Math.max(1, uiScale))}px;

/* unlocked label not tiny anymore */

}

}















      `}</style>







{false && !isMobile && (

<div

style={{



position: "fixed",

top: 14,



left: `max(14px, calc(50% - ${gridHalfW}px - ${clueW}px - 18px))`,





width: clueW,



      zIndex: 60,

	  background: isPurpleBg ? "#ffffff" : "rgba(255,255,255,0.92)",

      border: isPurpleBg ? "1px solid rgba(0,0,0,0.18)" : "1px solid rgba(0,0,0,0.10)",

      borderRadius: 16,

      boxShadow: isPurpleBg ? "0 18px 55px rgba(0,0,0,0.28)" : "0 12px 30px rgba(0,0,0,0.10)",

      padding: 8,

      backdropFilter: isPurpleBg ? "none" : "blur(6px)",

	  WebkitBackdropFilter: isPurpleBg ? "none" : "blur(6px)", // new

	  color: "#111827",



    }}

  >

    {/* header */}

    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, position: "relative"}}>



<div style={{ fontWeight: 950, fontSize: Math.round(16 * uiScale) }}>Clues</div>





<div style={{ fontWeight: 900, fontSize: Math.round(14 * uiScale) }}>

		💡x{clueTokens}



      </div>







	{!isMobile && toasts.some((m) => m === "No clues available") && (

  <div

    style={{

      position: "absolute",

      left: "50%",

      top: 0,

      transform: "translateX(-50%)",

      pointerEvents: "none",



      // ✅ prevents the “big rectangle” look

      width: "fit-content",

      maxWidth: "none",

    }}

  >

    <div

      className="px-4 py-2 rounded-md"

      style={{

       background: "#111827",

color: "white",

fontWeight: 800,

fontSize: Math.round(14 * Math.max(1, uiScale)),

boxShadow: "0 10px 30px rgba(0,0,0,0.25)",

pointerEvents: "auto",

textAlign: "center",







//stops wrapping (the real cause of the tall box)

whiteSpace: "nowrap",

      }}

    >

      No clues available

    </div>

  </div>

)}





    </div>







	<div

	  ref={cluesScrollRef}



  style={{

    display: "flex",

    flexDirection: "column",

    gap: 6,

    maxHeight: `calc(100vh - 120px - ${KEYBOARD_SPACER_H}px)`,

    overflowY: "auto",

    overflowX: "hidden",

    paddingRight: 6,

    paddingBottom: 10,

    minHeight: 0,                 // ✅ IMPORTANT for flex+scroll correctness

    overscrollBehavior: "contain", // ✅ prevents weird bounce/clip

  }}

>















			{/* ✅ Anchors for section detection */}



<div style={{ fontWeight: 900, fontSize: Math.round(13 * uiScale), opacity: 0.8, marginTop: 2 }}>

				  Across

				</div>

				{acrossIds.map((id) => (

				   <ClueCard key={id} id={id} suppressClueAutoScrollRef={suppressClueAutoScrollRef}   allowClueAutoScrollRef={allowClueAutoScrollRef} // ✅ NEW

					/>

				))}



			<div style={{ fontWeight: 900, fontSize: Math.round(13 * uiScale), opacity: 0.8,

marginTop: Math.round(12 * uiScale) }}>

				  Down

				</div>

				{downIds.map((id) => (

				  <ClueCard key={id} id={id} suppressClueAutoScrollRef={suppressClueAutoScrollRef}  allowClueAutoScrollRef={allowClueAutoScrollRef} // ✅ NEW

					/>

				))}





	</div>

  </div>





)}











{/* ===== DESKTOP WORD HISTORY PANEL ===== */}
{!isMobile && (
  <div style={{
    position: "fixed",
    top: 14,
    left: `max(14px, calc(50% - ${gridHalfW}px - ${clueW}px - 18px - ${HISTORY_PANEL_SHIFT_LEFT}px))`,
    width: clueW,
    zIndex: 60,
    background: isPurpleBg ? "rgba(40,20,80,0.97)" : "rgba(255,255,255,0.97)",
    border: isPurpleBg ? "1px solid rgba(255,255,255,0.18)" : "1px solid rgba(0,0,0,0.10)",
    borderRadius: 16,
    boxShadow: isPurpleBg ? "0 18px 55px rgba(0,0,0,0.28)" : "0 12px 30px rgba(0,0,0,0.10)",
    padding: 12,
    color: isPurpleBg ? "#fff" : "#111827",
    maxHeight: `calc(100vh - 40px - ${KEYBOARD_SPACER_H}px)`,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  }}>
    {/* Header */}
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ fontWeight: 900, fontSize: Math.round(15 * uiScale) }}>
        {selectedWord ? `${selectedWord} — History` : "History"}
      </div>
      {selectedWord && (
        <div style={{ fontSize: Math.round(12 * uiScale), fontWeight: 700, opacity: 0.5 }}>
        {(submitHistoryByWord[selectedWord] || []).length}
        </div>
      )}
    </div>

    {/* History rows */}
    {selectedWord && (() => {
      const hTiles = derivedWordsById[selectedWord]?.tiles || [];
      const hist = submitHistoryByWord[selectedWord] || [];
      const tileSize = Math.max(18, Math.min(Math.round(26 * uiScale),
        Math.floor((clueW - 48) / Math.max(hTiles.length, 1))
      ));
      if (!hist.length) return (
        <div style={{ fontSize: Math.round(13 * uiScale), opacity: 0.4, paddingTop: 2 }}>
          No submissions yet
        </div>
      );
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {hist.map((snap, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
width: Math.round(18 * uiScale), fontSize: Math.round(11 * uiScale),
fontWeight: 800, opacity: 0.75, flexShrink: 0, textAlign: "right",
              }}>{i + 1}</div>
              <WordHistoryRow snap={snap} tiles={hTiles} size={tileSize} gap={Math.round(3 * uiScale)} />
            </div>
          ))}
        </div>
      );
    })()}

    {/* Post-game word browser */}
    {gameOver && (
      <div style={{
        marginTop: 4, paddingTop: 10,
        borderTop: `1px solid ${isPurpleBg ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.08)"}`,
      }}>
        <div style={{ fontSize: Math.round(11 * uiScale), fontWeight: 800, opacity: 0.5, marginBottom: 6, letterSpacing: "0.05em" }}>
          BROWSE WORDS
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {wordListSorted.map(id => {
            const isSel = selectedWord === id;
            const solved = Boolean(wordSolvedEver?.[id]);
            return (
              <button key={id} onClick={() => setSelectedWord(id)} style={{
                padding: `${Math.round(4 * uiScale)}px ${Math.round(10 * uiScale)}px`,
                borderRadius: 8,
                background: isSel
                  ? (isPurpleBg ? "rgba(255,255,255,0.90)" : "#111827")
                  : solved
                    ? (isPurpleBg ? "rgba(255,255,255,0.12)" : "rgba(80,179,52,0.15)")
                    : (isPurpleBg ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)"),
                color: isSel ? (isPurpleBg ? "#111827" : "#fff") : (isPurpleBg ? "#fff" : "#111827"),
                fontSize: Math.round(12 * uiScale), fontWeight: 800,
                border: solved && !isSel ? `1px solid ${WORDLE.green}` : "1px solid transparent",
                cursor: "pointer",
              }}>{id}</button>
            );
          })}
        </div>
      </div>
    )}
  </div>
)}





   {!gameOver && toasts.length > 0 && (

  <div

    className="fixed z-[9999] px-4"

    style={{

      pointerEvents: "none",

      top: isMobile ? 70 : 90,

      left: "50%",

      transform: isMobile

        ? "translateX(-50%)"

        : `translateX(calc(-50% + 210px))`,

      width: "100%",



	maxWidth: Math.round(640 * Math.max(1, uiScale)),

display: "flex",

justifyContent: isMobile ? "center" : "flex-end",





    }}

  >

    <div className={`flex flex-col gap-2 ${isMobile ? "items-center" : "items-end"}`}>

      {toasts

        .filter((m) => (isMobile ? true : m !== "No clues available"))

        .map((msg, i) => (







 <div

key={i}

className="px-4 py-2 rounded-md toast-dismissible"

style={{

background: "#111827",

color: "white",

fontWeight: 800,

fontSize: Math.round(14 * Math.max(1, uiScale)),

boxShadow: "0 10px 30px rgba(0,0,0,0.25)",

pointerEvents: "auto",

textAlign: "center",

maxWidth: Math.round(320 * Math.max(1, uiScale)),

transition: "transform 0.15s ease, opacity 0.15s ease",

touchAction: "none",

position: "relative",

paddingRight: isMobile ? undefined : Math.round(32 * Math.max(1, uiScale)),

}}

onTouchStart={(e) => {

toastSwipeStartY.current = e.touches[0].clientY;

toastSwipeOffset.current = 0;

}}

onTouchMove={(e) => {

if (toastSwipeStartY.current === null) return;

const dy = e.touches[0].clientY - toastSwipeStartY.current;

if (dy < 0) {

toastSwipeOffset.current = dy;

e.currentTarget.style.transform = `translateY(${dy}px)`;

e.currentTarget.style.opacity = `${Math.max(0, 1 + dy / 80)}`;

}

}}

onTouchEnd={(e) => {

if (toastSwipeOffset.current < -12) {

setToasts([]);

if (toastTimerRef.current) clearTimeout(toastTimerRef.current);

} else {

e.currentTarget.style.transform = `translateY(0px)`;

e.currentTarget.style.opacity = `1`;

}

toastSwipeStartY.current = null;

toastSwipeOffset.current = 0;

}}

>

{msg}

{!isMobile && (

<span

className="toast-x-btn"

onClick={() => {

setToasts([]);

if (toastTimerRef.current) clearTimeout(toastTimerRef.current);

}}

style={{

position: "absolute",



top: Math.round(6 * Math.max(1, uiScale)),

right: Math.round(8 * Math.max(1, uiScale)),

transform: "none",



cursor: "pointer",

fontSize: Math.round(14 * Math.max(1, uiScale)),



lineHeight: 1,

color: "rgba(255,255,255,0.7)",





}}

>

×

</span>

)}

</div>











        ))}

    </div>

  </div>

)}











	 <div className="w-full max-w-[640px] px-4 pt-2 flex flex-col items-center">

  {/* Header row (title + ? aligned on same baseline) */}

  <div



className="w-full flex items-center justify-between"

style={{ paddingBottom: 4, maxWidth: Math.round(520 * Math.max(1, uiScale)), margin: "0 auto" }}





>

  {/* left spacer so title stays centered */}





<div style={{ width: Math.round(72 * uiScale), height: Math.round(36 * uiScale) }} />









 <div



className="font-extrabold tracking-tight text-center"

style={{

lineHeight: 1.1,



fontSize: `${Math.round(20 * uiScale)}px`,

color: isPurpleBg ? "#ffffff" : "#111827",

textShadow: isPurpleBg ? "0 1px 0 rgba(0,0,0,0.18)" : "none",

  }}

>

  KAZWORD

</div>

















  {/* right-side icons */}

<div className="flex items-center" style={{ gap: 10, marginRight: 6 }}>

    {/* 🎨 Theme toggle button */}

    <button

      onClick={() => setIsPurpleBg(v => !v)}





	 title="Toggle background"

aria-label="Toggle background"

style={{

width: Math.round(32 * uiScale),

height: Math.round(32 * uiScale),

borderRadius: Math.round(16 * uiScale),





        background: isPurpleBg ? "rgba(255,255,255,0.14)" : "transparent",

        border: isPurpleBg

          ? "1px solid rgba(255,255,255,0.45)"

          : "1px solid rgba(0,0,0,0.18)",

        display: "flex",

        alignItems: "center",

        justifyContent: "center",

        cursor: "pointer",

      }}

    >

      <span

        style={{

          fontSize: 15,

          fontWeight: 900,

          lineHeight: 1,

          color: isPurpleBg ? "white" : "black",

        }}

      >

        ◐

      </span>

    </button>



    {/* ❓ Help button */}

    <button

      onClick={() => setShowHelp(true)}



 title="How to Play"

aria-label="How to Play"

style={{

width: Math.round(32 * uiScale),

height: Math.round(32 * uiScale),

borderRadius: Math.round(16 * uiScale),

background: "transparent",





        border: "1px solid rgba(0,0,0,0.18)",

        display: "flex",

        alignItems: "center",

        justifyContent: "center",

        cursor: "pointer",

transform: isMobile ? "none" : `translateX(-${HELP_ICON_SHIFT_LEFT}px)`,

      }}

    >



<span style={{ fontSize: Math.round(15 * uiScale), fontWeight: 900, lineHeight: 1 }}>?</span>

    </button>

  </div>

</div>











  {/* ✅ underline divider under title + ? */}

  <div

  style={{

    height: 1,

    width: "100%",





	maxWidth: Math.round(520 * Math.max(1, uiScale)), // ✅ knob: try 480–600





    margin: "0 auto",  // ✅ centers it

background: isPurpleBg ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.14)",

  }}

/>





  {/* Attempts under the line */}

<div



className="mt-0 mb-2 font-semibold text-center translate-y-1"

style={{ color: isPurpleBg ? "#ffffff" : "#374151", fontSize: `${Math.round(14 * uiScale)}px` }}



>









Attempts: <span className="tabular-nums">{gameOver ? (didWin ? submissions : "X") : submissions + 1}/{MAX_SUBMISSIONS}</span>

</div>

{gameOver && DAILY_OVERRIDES[puzzleNumber]?.theme && (

<div style={{ textAlign: "center", marginTop: 4 }}>

<span style={{

display: "inline-flex",

alignItems: "center",

gap: 6,

background: isPurpleBg ? "rgba(255,255,255,0.15)" : "#ede9fe",

border: `1.5px solid ${isPurpleBg ? "rgba(255,255,255,0.4)" : "#8b5cf6"}`,

borderRadius: 999,

padding: "3px 12px",









fontSize: `${Math.round(20 * uiScale)}px`,

fontWeight: 800,

color: isPurpleBg ? "#fff" : "#4c1d95",

}}>

<span style={{ fontSize: `${Math.round(14 * uiScale)}px`, fontWeight: 700, opacity: 0.7, letterSpacing: "0.07em" }}>THEME:</span>











{DAILY_OVERRIDES[puzzleNumber].theme}

</span>

</div>

)}









</div>







{showPartialWarning && (

  <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.45)" }}>

    <div className="rounded-2xl bg-white shadow-xl border" style={{ width: "min(400px, 92vw)", padding: 28, display: "flex", flexDirection: "column", gap: 16 }}>

      <div style={{ fontWeight: 900, fontSize: 18, color: "#111", textAlign: "center" }}>💡 Quick Tip</div>

      <div style={{ fontSize: 14, color: "#374151", lineHeight: 1.6, textAlign: "center" }}>

        You haven&apos;t filled the entire grid yet. For the best shot at winning, try filling in <strong>the full grid</strong> before submitting.<br/>You can submit multiple words at once!

      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>

        <button

          onClick={() => {

            localStorage.setItem(`kzw_partial_tip_${puzzleNumber}`, "1");

            setShowPartialWarning(false);

          }}

          style={{ width: "100%", padding: "12px 0", borderRadius: 9999, background: "#111", color: "#fff", fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer" }}

        >

          Fill in the whole grid first

        </button>

        <button

          onClick={() => {

            localStorage.setItem(`kzw_partial_tip_${puzzleNumber}`, "1");

            setShowPartialWarning(false);

            const S = stateRef.current;

            if (S) submitAllCompleteWordsWithState(S);

          }}

          style={{ width: "100%", padding: "12px 0", borderRadius: 9999, background: "transparent", color: "#6b7280", fontWeight: 600, fontSize: 13, border: "1px solid #e5e7eb", cursor: "pointer" }}

        >

          Submit anyway

        </button>

      </div>

    </div>

  </div>

)}







      {showHelp && (

        <div className="fixed inset-0 z-[9998]" style={{ background: "rgba(0,0,0,0.35)" }}>

          <div className="min-h-screen flex items-center justify-center px-4" style={{ paddingBottom: isMobile ? "15vh" : 0 }}>



		<div

		  className="w-full rounded-2xl bg-white border shadow-xl"

			style={{

			  color: WORDLE.textDark,



width: isMobile ? "min(420px, 92vw)" : `min(${Math.round(520 * Math.max(1, uiScale))}px, 92vw)`,



			  maxHeight: isMobile ? "calc(100dvh - 24px)" : "calc(100vh - 24px)",



			  overflow: "hidden",

			  display: "flex",

			  flexDirection: "column",



padding: isMobile ? 12 : Math.round(16 * Math.max(1, uiScale)),

			}}





















		>



              <div className="flex items-start justify-between">

                <div>

                  <div style={{ fontSize: isMobile ? 22 : Math.round(26 * Math.max(1, uiScale)), fontWeight: 900, lineHeight: 1.1 }}>

  How To Play

</div>



<div style={{

  marginTop: 6,



  fontSize: isMobile ? 14 : Math.round(16 * Math.max(1, uiScale)),

fontWeight: 600,

letterSpacing: "0.015em",





}}>

  Solve the Kazword using colour–coded feedback.

</div>



                </div>

                <button

                  onClick={() => {

						  setShowHelp(false);

						  try { localStorage.setItem(HELP_SEEN_KEY, "1"); } catch {}

						}}

                  aria-label="Close"

                  style={{

                    width: 36,

                    height: 36,

                    borderRadius: 18,

                    border: "1px solid rgba(0,0,0,0.12)",

                    background: "white",

                    cursor: "pointer",

                    fontSize: 20,

                    fontWeight: 900,

                    lineHeight: 1,

                  }}

                >

                  ×

                </button>

              </div>













			  {/* Content */}



<div style={{



  marginTop: Math.round(12 * Math.max(1, uiScale)),

fontSize: isMobile ? 14 : Math.round(15 * Math.max(1, uiScale)),



  lineHeight: 1.35,

  display: "flex",

  flexDirection: "column",



 gap: isMobile ? 14 : Math.round(14 * Math.min(1, (window.innerHeight - 200) / 600)),

minHeight: 0,

overflowY: "auto",



  paddingRight: 6,

}}>













  {/* Guess Words */}

  <div>

    <div style={{ fontWeight: 900, fontSize: Math.round(15 * Math.max(1, uiScale)), marginBottom: Math.round(8 * Math.max(1, uiScale)) }}>Guess Words</div>

    <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 8 }}>

      <li>You can submit multiple words at once.</li>

      <li>Solve the Kazword in 6 attempts or fewer.</li>

    </ul>

  </div>



  {/* Intersections */}

  <div>

    <div style={{ fontWeight: 900, fontSize: Math.round(15 * Math.max(1, uiScale)), marginBottom: Math.round(8 * Math.max(1, uiScale)) }}>Intersections</div>

    <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 8 }}>

      <li>

        Arrows show direction: <b>→</b> Across &nbsp;&nbsp; <b>↓</b> Down

      </li>











    </ul>

  </div>



  {/* Buttons */}

  <div>

    <div style={{ fontWeight: 900, fontSize: Math.round(15 * Math.max(1, uiScale)), marginBottom: Math.round(8 * Math.max(1, uiScale)) }}>Buttons</div>

    <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 8 }}>



<li>

  <span

    style={{

      display: "inline-flex",

      alignItems: "baseline",

      gap: 6,

      fontWeight: 600,

    }}

  >

    <span style={{ display: "inline-flex", transform: "translateY(1px)" }}>

      <UndoGlyph size={18} />

    </span>

    <span>Undo</span>

  </span>

  <span>: Reverts the selected word to its last submitted state.</span>

</li>











      <li>

        <b>Restore Greens</b>: Restores tiles you already got correct for the selected word.

      </li>









    </ul>

  </div>



  {/* Feedback */}

  <div>

    <div style={{ fontWeight: 900, fontSize: Math.round(15 * Math.max(1, uiScale)), marginBottom: Math.round(8 * Math.max(1, uiScale)) }}>Feedback</div>

    <div style={{ display: "grid", gap: 8 }}>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>

        <span style={{ fontSize: 20 }}>🟩</span>

        <span>Correct letter, correct spot</span>

      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>

        <span style={{ fontSize: 20 }}>🟨</span>

        <span>Correct letter, wrong spot</span>

      </div>

     <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 20 }}>⬛</span>
        <span>Letter not in the word</span>
      </div>
      <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(0,0,0,0.08)" }}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>Feedback History</div>
        <div style={{ lineHeight: 1.4 }}>Tiles remember past feedback. Retyping a submitted letter in its tile restores its colour, and colours adjust as you edit so feedback stays updated.</div>
      </div>

    </div>
  </div>


</div>



















			</div>

          </div>

        </div>

      )}





















    {/* =========================

        GRID (RIGHT)

       ========================= */}





<div





className={`w-full max-w-[640px] ${isMobile ? "px-1" : "px-4"}`}

style={{



...(isMobile ? {} : {

maxWidth: 960,

marginLeft: Math.round((clueW + -350) / 2),

}),















marginTop:

  (isMobile ? 10 : 24) +

  gridExtraTopPx +

  (isMobile ? GRID_NUDGE_Y_MOBILE : GRID_NUDGE_Y_DESKTOP) +

(isMobile ? GRID_ONLY_PUSH_DOWN_MOBILE : GRID_ONLY_PUSH_DOWN_DESKTOP) +

GRID_VCENTER_PUSH,







  }}

>



  {/* ✅ Horizontal scroll ONLY when needed */}





<div

  style={{

    // ✅ MOBILE: do NOT clip grid; we size tiles to fit instead

   overflowX: isMobile ? "visible" : "auto",

overflowY: "visible",

WebkitOverflowScrolling: "touch",

background: appBg,

width: "100%",

paddingTop: isMobile ? 8 : 20,

paddingBottom: 8,



    // ✅ MOBILE: reduce side padding so grid can fit

    paddingLeft: isMobile ? 0 : 12,

    paddingRight: isMobile ? 0 : 12,

    boxSizing: "border-box",



    // ✅ MOBILE: center the grid cleanly

    display: "flex",

    justifyContent: "center",

  }}

>

  <div

    style={{

      display: "inline-block",

      // ✅ remove max-content forcing overflow

      minWidth: 0,

      width: "fit-content",

      maxWidth: "100%",

      paddingBottom: 2,

    }}

  >

















      {renderGrid.map((row, r) => (

        <div key={r} className="flex" style={{ gap: GAP_SIZE, marginBottom: GAP_SIZE }}>











          {row.map((isCell, c) => {

            // ✅ KEEP YOUR EXISTING GRID TILE BUTTON CODE EXACTLY AS-IS

            // (Paste your existing cell rendering block here unchanged)

            // -----------------------------------------------

            if (!isCell) return <div key={`${r}-${c}`} style={{ width: TILE_SIZE, height: TILE_SIZE }} />;



            const realR = renderMeta.rowVals[r];

            const realC = renderMeta.colVals[c];

            const k = tileKey(realR, realC);

            const letter = (cells[k]?.letter || "").toUpperCase();

            const isSelectedWordTile = selectedTilesSet.has(k);

            const isFocused = focusedKey === k;



            const { state: dispState, arrow } = pickDisplayState({

              tileKey: k,

              feedbackByWord,

              selectedWord,

              latestTouch,

              lastViewed,

              wordsAtTileCount,

              derivedWordsById,

			  globalCellState,



            });



            let bg = WORDLE.emptyBg;

            let border = WORDLE.emptyBorder;

            let txt = WORDLE.textDark;



            if (dispState === "correct") {

              bg = WORDLE.green;

              border = WORDLE.green;

              txt = WORDLE.textLight;

            } else if (dispState === "present") {

              bg = WORDLE.yellow;

              border = WORDLE.yellow;

              txt = WORDLE.textLight;

            } else if (dispState === "absent") {

              bg = WORDLE.gray;

              border = WORDLE.gray;

              txt = WORDLE.textLight;

            }



            const transition = "transform 120ms ease, box-shadow 140ms ease, outline 140ms ease, filter 140ms ease";



            const selectedGlow = isSelectedWordTile

			  ? (isPurpleBg

				  ? `0 0 0 3px rgba(217,70,239,0.95), 0 12px 28px rgba(0,0,0,0.30), 0 0 16px rgba(217,70,239,0.45)`







: `0 0 0 ${Math.max(3, Math.round(3 * uiScale))}px rgba(59,130,246,0.72), 0 ${Math.round(6 * tileScale)}px ${Math.round(18 * tileScale)}px rgba(59,130,246,0.22)`)





			  : "0 1px 0 rgba(0,0,0,0.06)";





			const focusedGlow = isFocused

? `0 0 0 ${Math.max(2, Math.round(2 * uiScale))}px rgba(17,24,39,0.95), 0 0 0 ${Math.max(6, Math.round(6 * uiScale))}px rgba(239,68,68,0.95), 0 ${Math.round(10 * uiScale)}px ${Math.round(26 * uiScale)}px rgba(239,68,68,0.22)`

: null;





			const boxShadow = isFocused

  ? focusedGlow

  : (isSelectedWordTile && !isFocused && isPurpleBg)

    ? `${selectedGlow}, inset 0 0 0 2px rgba(192,38,211,0.65)`

    : selectedGlow;





            const overlay =

			  isSelectedWordTile && !isFocused

				? (isPurpleBg

					? null // ✅ purple: no wash overlay (keeps colors sharp)

					: "linear-gradient(0deg, rgba(59,130,246,0.10), rgba(59,130,246,0.10))")

				: null;















            const number = numberAt(realR, realC);



            const anim = revealAnim.tiles?.[k];

            const fromBg = stateToBg(anim?.fromState ?? null);

            const toBg = stateToBg(anim?.toState ?? dispState ?? null);

            const fromBorder = stateToBorder(anim?.fromState ?? null);

            const toBorder = stateToBorder(anim?.toState ?? dispState ?? null);

            const fromText = stateToText(anim?.fromState ?? null);

            const toText = stateToText(anim?.toState ?? dispState ?? null);

            const useFlip = Boolean(revealAnim.runId && anim);

            const flipBg = useFlip ? fromBg : bg;

            const flipBorder = useFlip ? fromBorder : border;

            const flipText = useFlip ? fromText : txt;

const useFocusPulseDesktop = !isMobile && isFocused && !useFlip && revealAnim.runId === 0;

const useFocusPulseMobile  =  isMobile && isFocused && !useFlip && revealAnim.runId === 0;



            return (

              <button

                key={`${r}-${c}`}





       onClick={() => {

  if (revealAnim.runId) return;



  // ✅ Allow browsing words after game over (view clues),

  // but do NOT allow typing / opening mobile keyboard.

  if (gameOver) {

    cycleWordOnTileClick(k);

    setFocusedKey(k);

    return;

  }



  cycleWordOnTileClick(k);

  setFocusedKey(k);



  // ✅ MOBILE: summon native keyboard only during active play

  if (isMobile) focusMobileKeyboard();

}}









                className="relative select-none"

                style={{

                  width: TILE_SIZE,

                  height: TILE_SIZE,

                  background: overlay ? `${overlay}, ${flipBg}` : flipBg,

                  border: `${Math.max(1, Math.round(2 * tileScale))}px solid ${flipBorder}`,

                  borderRadius: `${Math.round(12 * tileScale)}px`,

                  boxShadow,

                  display: "flex",

                  alignItems: "center",

                  justifyContent: "center",

                  fontWeight: 800,

                  fontSize: `clamp(${Math.round(23 * tileScale)}px, ${3.2 * tileScale}vw, ${Math.round(30 * tileScale)}px)`,

                  color: flipText,

                  lineHeight: 1,

                  position: "relative",

                  transition,

                  cursor: gameOver ? "default" : "pointer",

                  filter: isSelectedWordTile && !isFocused ? "saturate(1.05)" : "none",

                  outline: "none",

                  WebkitTapHighlightColor: "transparent",

                  transformStyle: "preserve-3d",

                  backfaceVisibility: "hidden",

willChange: "transform",



...(useFlip

  ? {

      ["--fromBg"]: fromBg,

      ["--toBg"]: toBg,

      ["--fromBorder"]: fromBorder,

      ["--toBorder"]: toBorder,

      ["--fromText"]: fromText,

      ["--toText"]: toText,

      animation: `cw-flip 600ms ease both`,

      animationDelay: `${anim.delayMs || 0}ms`,

    }

  : useFocusPulseDesktop

  ? {

      animation: "cw-focusPulse 1400ms ease-in-out infinite",

    }

  : useFocusPulseMobile

  ? {

      animation: "cw-focusPulseMobile 1400ms ease-in-out infinite",

      zIndex: 5,

    }

  : {

      transform: isFocused ? "scale(1.02)" : "scale(1)",

    }),

}}

>







                {number != null && (

                  <span

                    style={{

                      position: "absolute",

                      top: Math.round(5 * tileScale),

                      left: Math.round(7 * tileScale),

                      fontSize: Math.round(12 * tileScale),

                      fontWeight: 800,

                      color: useFlip ? fromText : dispState ? WORDLE.textLight : "#374151",

                      opacity: 0.9,

                    }}

                  >

                    {number}

                  </span>

                )}







			   <span

					  style={{

						transform: `translate(0px, ${

  DEFAULT_LETTER_Y + (arrow === "down" ? DOWN_ARROW_EXTRA_Y : 0)

}px)`,





					  }}

					>

					  {letter}

					</span>















                {arrow && (

                  <span

                    style={{

                      position: "absolute",

                      top: arrow === "down" ? arrowInsetDown : arrowInsetAcross,

                      right: arrow === "down" ? arrowInsetDown : arrowInsetAcross,

                      display: "inline-flex",

                      alignItems: "center",

                      justifyContent: "center",

                      boxSizing: "border-box",

                      fontSize: arrowFont,

                      fontWeight: 900,

                      color: WORDLE.textDark,

                      background: "rgba(255,255,255,0.95)",

                      border: `${arrowBorder}px solid rgba(0,0,0,0.14)`,

                      borderRadius: Math.round(7 * tileScale),

                      padding: `${arrowPadY}px ${arrowPadX}px`,

                      lineHeight: 1,

                      WebkitTextStroke: `${Math.max(1, Math.round(1 * tileScale))}px rgba(0,0,0,0.35)`,

                      textShadow: "0 0 1px rgba(0,0,0,0.25)",

                      minWidth: `${arrowBoxW}px`,

                      minHeight: `${arrowBoxH}px`,

                    }}

                  >

                    {arrow === "across" ? "→" : "↓"}

                  </span>

                )}

              </button>

            );

            // -----------------------------------------------

          })}

        </div>

      ))}

	</div>

</div>



</div>















{gameOver && !showResults && !isMobile && (
<div
className="w-full max-w-[640px] px-4 flex justify-center"



style={{ marginTop: Math.round(18 * Math.max(1, uiScale)) }}

	>

    <button

      onClick={() => setShowResults(true)}

      style={{

        width: "min(280px, 86vw)",  // ✅ smaller / less stretched

        height: 44,                // ✅ Wordle-ish height

        borderRadius: 9999,

        background: "#fff",

        border: "1px solid #111",   // ✅ thin black outline

        boxShadow: "none",

        fontWeight: 600,            // ✅ closer to NYT (not 900)

        fontSize: 16,               // ✅ closer to NYT

        letterSpacing: "0.01em",

        cursor: "pointer",

		color: "#111",             // ✅ ensures text shows (esp purple)



      }}

    >

      See results

    </button>

  </div>

)}











{/* ✅ Spacer so fixed keyboard doesn't cover content */}

{!isMobile && !gameOver && PIN_KEYBOARD && <div style={{ height: KEYBOARD_SPACER_H }} />}

{!isMobile && !gameOver && (

  <div



className="w-full px-4"

    style={

      PIN_KEYBOARD

        ? {

            position: "fixed",

            left: "50%",

            transform: "translateX(-50%)",

            bottom: KEYBOARD_FIXED_BOTTOM,



			maxWidth: `${kbdMaxW}px`,

zIndex: 50,

paddingBottom: 6,

paddingTop: Math.round(36 * uiScale),

pointerEvents: "none",

}

: { marginTop: 32, paddingBottom: 4 }





    }

  >



<div className="flex flex-col gap-2 items-center" style={{ pointerEvents: "auto" }}>

      {KEYBOARD_ROWS.map((row, ri) => (

        <div key={ri} className="flex gap-2 justify-center flex-wrap">

          {row.map((keycap) => {

            const st = keyboardState[keycap];

            let bg = isPurpleBg ? "#ffffff" : "#d3d6da";







            let color = "#111827";

            if (st === "correct") {

              bg = WORDLE.green;

              color = WORDLE.textLight;

            } else if (st === "present") {

              bg = WORDLE.yellow;

              color = WORDLE.textLight;

            } else if (st === "absent") {

              bg = WORDLE.gray;

              color = WORDLE.textLight;

            }



            const isEnter = keycap === "ENTER";

            const isBack = keycap === "⌫";

            const isUndo = keycap === "UNDO";

            const isGreens = keycap === "GREENS";



            // ✅ make GREENS key always green

            if (isGreens) {

              bg = WORDLE.green;

              color = WORDLE.textLight;

            }



            // ✅ disable GREENS if selected word has no saved greens yet

            const greensDisabled =

              !selectedWord ||

              !(derivedWordsById[selectedWord]?.tiles || []).some((t) => greenEverTiles?.[t.key]);



            const width =



			isEnter || isBack ? `${Math.round(78 * kbdPxRef)}px`

: isUndo ? `${Math.round(56 * kbdPxRef)}px`

: isGreens ? `${Math.round(85 * kbdPxRef)}px`

: `${Math.round(44 * kbdPxRef)}px`;



            const disabled = gameOver || (isGreens && greensDisabled);





		   const label = isUndo ? (

  <span

    style={{

      display: "flex",

      flexDirection: "column",

      alignItems: "center",

      justifyContent: "center",

      lineHeight: 1,

    }}

  >





   <UndoGlyph size={Math.round(18 * kbdPxRef)} />

<span style={{ marginTop: 2, fontSize: Math.round(12 * kbdPxRef), fontWeight: 900 }}>undo</span>

</span>

) : isBack ? (

<span style={{ fontSize: Math.round(18 * kbdPxRef), lineHeight: 1 }}>⌫</span>













            ) : isGreens ? (

			 <span

				style={{

				  display: "flex",

				  flexDirection: "column",

				  alignItems: "center",

				  justifyContent: "center",



				  // ✅ readability

				  fontSize: Math.round(18 * kbdScale),

				  fontWeight: 700,              // ← lighter than 900

				  lineHeight: 1.15,             // ← natural spacing

				  letterSpacing: "0.01em",      // ← very subtle



				  // ✅ contrast on green

				  color: "#ffffff",

				  textShadow: "0 1px 1px rgba(0,0,0,0.25)",



				  // ✅ font clarity

				  fontFamily:

					'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',

				  WebkitFontSmoothing: "antialiased",

				  MozOsxFontSmoothing: "grayscale",

				}}

			  >

				<span>Restore</span>

				<span>Greens</span>

			  </span>









            ) : (







              keycap

            );



            return (

              <button

                key={keycap}

                disabled={disabled}

                onClick={() => {

                  if (disabled) return;

                  if (isBack) return onBackspace();

                  if (isEnter) return onSubmitAll();

                  if (isUndo) return onUndo();

                  if (isGreens) {

                    const S = stateRef.current;

                    if (!S) return;

                    return greenUndoWithState(S);

                  }

                  onTypeLetter(keycap);

                }}

                className="active:scale-[0.98]"

                style={{

				  height: `${Math.round(70 * kbdScale)}px`,

				  width,

				  borderRadius: `${Math.round(14 * kbdScale)}px`,



				  background: bg,

				  color,

				  fontWeight: 700,

				  fontFamily:

					'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',

				  WebkitFontSmoothing: "antialiased",

				  MozOsxFontSmoothing: "grayscale",

				  textRendering: "geometricPrecision",

				  textShadow:

					color === WORDLE.textLight

					  ? "0 1px 1px rgba(0,0,0,0.22)"

					  : "0 0 0.6px rgba(0,0,0,0.55)",

				  border: "1px solid rgba(0,0,0,0.08)",

				  boxShadow: "0 1px 0 rgba(0,0,0,0.06)",

				  opacity: disabled ? 0.6 : 1,

				  cursor: disabled ? "not-allowed" : "pointer",

				  transition: "transform 120ms ease, opacity 120ms ease",

				  outline: "none",

				  fontSize: isEnter

					? Math.round(13 * kbdScale)

					: isUndo

					? Math.round(12 * kbdScale)

					: Math.round(20 * kbdScale),

				  letterSpacing: isEnter ? "0.02em" : "normal",

				}}



              >

                {label}

              </button>

            );

          })}

        </div>

      ))}

    </div>

  </div>

)}









{/* =========================

✅ MOBILE KEYBOARD (iOS-style)

========================= */}

{/* Mobile word history strip — sits above the fixed keyboard */}
{isMobile && !showResults && (() => {
  const hTiles = selectedWord ? (derivedWordsById[selectedWord]?.tiles || []) : [];
  const hist = selectedWord ? (submitHistoryByWord[selectedWord] || []) : [];

  // Tile size calculated per column in 3-col grid (no cutoff)
  const effectiveW = windowW || 390;
  const availPerCol = Math.floor((Math.min(effectiveW, 640) - 40) / 3);
  const tileGap = 1;
  const tileSize = hTiles.length
    ? Math.max(13, Math.min(20, Math.floor((availPerCol - 10 - (hTiles.length - 1) * tileGap) / hTiles.length)))
    : 16;

  const stripBottom = gameOver ? MOBILE_RESULTS_BTN_H : MOBILE_KBD_H;

  return (
    <div style={{
      position: "fixed",
      left: 0, right: 0,
      bottom: stripBottom,
      height: 82,
      zIndex: 79,
      background: isPurpleBg ? "rgba(30,15,60,0.97)" : "rgba(248,249,250,0.98)",
      borderTop: `1px solid ${isPurpleBg ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.10)"}`,
      padding: "6px 12px 5px",
      display: "flex",
      flexDirection: "column",
      gap: 5,
      overflow: "hidden",
    }}>
      <div style={{
        fontSize: 10, fontWeight: 800, opacity: 0.45,
        letterSpacing: "0.06em", lineHeight: 1,
        color: isPurpleBg ? "#fff" : "#374151",
      }}>
        {selectedWord ? `${selectedWord} — History` : "History"}
      </div>

      {selectedWord && hist.length > 0 ? (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gridTemplateRows: "repeat(2, auto)",
          gap: "5px 8px",
        }}>
          {Array.from({ length: 6 }).map((_, i) => {
            const snap = hist[i];
            if (!snap) return <div key={i} style={{ height: tileSize }} />;
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <div style={{
                  fontSize: 9, fontWeight: 700, opacity: 0.6, flexShrink: 0, width: 7,
                  color: isPurpleBg ? "#fff" : "#374151", lineHeight: 1,
                }}>{i + 1}</div>
                <WordHistoryRow snap={snap} tiles={hTiles} size={tileSize} gap={tileGap} />
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{
          fontSize: 11, fontWeight: 700, opacity: 0.3,
          color: isPurpleBg ? "#fff" : "#374151",
        }}>
          {selectedWord ? "Submit to see history" : "Select a word"}
        </div>
      )}
    </div>
  );
})()}




{/* Fixed results button — post-game mobile, replaces keyboard area */}
{isMobile && gameOver && !showResults && (
  <div style={{
    position: "fixed",
    left: 0, right: 0,
    bottom: 0,
    height: MOBILE_RESULTS_BTN_H,
    zIndex: 80,
    background: isPurpleBg ? "rgba(30,15,60,0.97)" : "#e5e7eb",
    borderTop: `1px solid ${isPurpleBg ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.10)"}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 24px",
  }}>
    <button
      onClick={() => setShowResults(true)}
      style={{
        width: "100%",
        maxWidth: 320,
        height: 44,
        borderRadius: 9999,
        background: "#fff",
        border: "1px solid #111",
        fontWeight: 600,
        fontSize: 16,
        cursor: "pointer",
        color: "#111",
      }}
    >
      See results
    </button>
  </div>
)}





{isMobile && (

  <>

    <div

      style={{

        position: "fixed",

        left: "50%",

        transform: "translateX(-50%)",

        bottom: 0,

        width: "100%",

        maxWidth: 640,



padding: `${MOBILE_KBD_PAD_Y}px 14px ${MOBILE_KBD_PAD_Y}px 14px`,



        background: isPurpleBg ? "rgba(255,255,255,0.10)" : "#e5e7eb",

        zIndex: 80,

        borderTopLeftRadius: 18,

        borderTopRightRadius: 18,

        border: isPurpleBg

          ? "1px solid rgba(255,255,255,0.18)"

          : "1px solid rgba(0,0,0,0.10)",

        boxShadow: isPurpleBg

          ? "0 -10px 30px rgba(0,0,0,0.28)"

          : "0 -10px 30px rgba(0,0,0,0.12)",

      }}

    >





{/* Clue strip */}

{false && selectedWord && (



        <div

          onContextMenu={(e) => e.preventDefault()}

          onPointerDown={() => {

            mobilePressRef.current = true;

            const locked = !isClueUnlockedForDay(puzzleNumber, selectedWord);

            const hasClue = Boolean(getClueTextForDay(puzzleNumber, selectedWord));

            const solved = Boolean(wordSolvedEver?.[selectedWord]);

            const wantsUnlock = locked && hasClue && !solved && !gameOver;

            if (!wantsUnlock) return;



            if (clueTokens <= 0) {

              mobileNoClueTimerRef.current = setTimeout(() => {

                if (!mobilePressRef.current) return;

                showToasts("No clues available");

              }, 650);

              return;

            }



            mobileUnlockBeginRef.current?.();

          }}

          onPointerUp={() => {

            mobilePressRef.current = false;

            if (mobileNoClueTimerRef.current) clearTimeout(mobileNoClueTimerRef.current);

            mobileNoClueTimerRef.current = null;

            mobileUnlockStopRef.current?.();

          }}

          onPointerCancel={() => {

            mobilePressRef.current = false;

            if (mobileNoClueTimerRef.current) clearTimeout(mobileNoClueTimerRef.current);

            mobileNoClueTimerRef.current = null;

            mobileUnlockStopRef.current?.();

          }}

          style={{

            marginBottom: MOBILE_CLUE_TO_KEYS_GAP,

            borderRadius: 14,

            background: isPurpleBg ? "rgba(255,255,255,0.92)" : "rgba(59,130,246,0.10)",

            border: isPurpleBg

              ? "1px solid rgba(255,255,255,0.18)"

              : "1px solid rgba(59,130,246,0.30)",

            display: "flex",

            alignItems: "center",

            justifyContent: "space-between",

            padding: "12px 8px",



minHeight: Math.round(70 * mobileScreenScale),



            color: "#111827",

            userSelect: "none",

            WebkitUserSelect: "none",

            WebkitTouchCallout: "none",

          }}

        >

          {/* LEFT arrow */}

          <button

            onClick={(e) => {

              e.stopPropagation();





		  mobilePrevWord();

}}

style={{

width: Math.round(40 * mobileScreenScale),

height: Math.round(38 * mobileScreenScale),

borderRadius: 12,

border: "1px solid rgba(0,0,0,0.14)",

background: "white",

fontWeight: 950,

fontSize: Math.round(22 * mobileScreenScale),







              lineHeight: 1,

              flexShrink: 0,

            }}

            aria-label="Previous word"

          >

            ‹

          </button>



          {/* CENTER */}

          <div

            style={{

              flex: 1,

              minWidth: 0,

              display: "flex",

              alignItems: "center",

              justifyContent: "space-between",

              gap: 6,

            }}

          >

            <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, minWidth: 0 }}>

              <div style={{ flex: 1, minWidth: 0 }}>

                <HoldToUnlockSlot

                  locked={!isClueUnlockedForDay(puzzleNumber, selectedWord)}

                  disabled={

                    gameOver ||

                    Boolean(wordSolvedEver?.[selectedWord]) ||

                    !Boolean(getClueTextForDay(puzzleNumber, selectedWord)) ||

                    (!isClueUnlockedForDay(puzzleNumber, selectedWord) && clueTokens <= 0)

                  }

                  unlockedLabel={getClueTextForDay(puzzleNumber, selectedWord) || "Unlocked"}

                  holdMs={1100}

                  dimWhenUnlocked={Boolean(wordSolvedEver?.[selectedWord])}

                  onUnlock={() => unlockClueForWord(selectedWord)}

                  _capture={(begin, stop) => {

                    mobileUnlockBeginRef.current = begin;

                    mobileUnlockStopRef.current = stop;

                  }}

                />

              </div>



              <div

                style={{







fontWeight: 950,

fontSize: Math.round(12 * mobileScreenScale),

whiteSpace: "nowrap",



flexShrink: 0,





                }}

              >

                💡x{clueTokens}

              </div>

            </div>



            {/* RIGHT arrow */}

            <button

              onClick={(e) => {

                e.stopPropagation();





		mobileNextWord();

}}

style={{

width: Math.round(40 * mobileScreenScale),

height: Math.round(38 * mobileScreenScale),

borderRadius: 12,

border: "1px solid rgba(0,0,0,0.14)",

background: "white",

fontWeight: 950,

fontSize: Math.round(22 * mobileScreenScale),







                lineHeight: 1,

                flexShrink: 0,

              }}

              aria-label="Next word"

            >

              ›

            </button>

          </div>

        </div>

      )}



      {/* ✅ Keyboard rows (NOT inside selectedWord)

          ✅ KEY CHANGE: hide keyboard after gameOver, BUT keep clue strip visible */}

      {!gameOver && (

        <div style={{ width: "100%" }}>

          {[

            ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P" /*,"CLEAR"*/],

            ["A", "S", "D", "F", "G", "H", "J", "K", "L"],

            ["UNDO", "Z", "X", "C", "V", "B", "N", "M", "⌫"],

            ["GREENS", "SPACE", "ENTER"],

          ].map((row, ri) => (

            <div

              key={ri}

              style={{

                display: "flex",

                width: "100%",

                paddingLeft: 2,

                paddingRight: 2,

                gap: MOBILE_KBD_GAP,

                marginBottom: MOBILE_KBD_GAP,

                justifyContent: "center",

                alignItems: "stretch",

              }}

            >

              {row.map((keycap) => {

                const isUndo = keycap === "UNDO";

                const isBack = keycap === "⌫";

                const isEnter = keycap === "ENTER";

                const isGreens = keycap === "GREENS";

                const isSpace = keycap === "SPACE";

                const isClear = keycap === "CLEAR";



                const greensDisabled =

                  !selectedWord ||

                  !(derivedWordsById[selectedWord]?.tiles || []).some((t) => greenEverTiles?.[t.key]);



                const disabled = gameOver || (isGreens && greensDisabled);



                let flex = 1;

                // Row 2: UNDO (make UNDO slightly wider)

                if (ri === 2 && isUndo) flex = 1.35;

                // Row 2: backspace slightly wider

                if (ri === 2 && isBack) flex = 1.6;

                // Row 3: Greens / Space / Enter

                if (ri === 3 && isGreens) flex = 1.6;

                if (ri === 3 && isSpace) flex = 4.2;

                if (ri === 3 && isEnter) flex = 1.6;



                let bg = "#d3d6da";

                let color = "#111827";

                const st = keyboardState[keycap];



                if (!isUndo && !isBack && !isEnter && !isGreens && !isSpace && !isClear) {

                  if (st === "correct") {

                    bg = WORDLE.green;

                    color = WORDLE.textLight;

                  } else if (st === "present") {

                    bg = WORDLE.yellow;

                    color = WORDLE.textLight;

                  } else if (st === "absent") {

                    bg = WORDLE.gray;

                    color = WORDLE.textLight;

                  }

                }



                if (isGreens) {

                  bg = WORDLE.green;

                  color = WORDLE.textLight;

                }



                if (disabled) {

                  bg = "#e5e7eb";

                  color = "#9ca3af";

                }



                const label = isUndo ? (

                  <span style={{ display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1 }}>

                    <UndoGlyph size={22} />

                    <span style={{ marginTop: 2, fontSize: 11, fontWeight: 900 }}>undo</span>

                  </span>

                ) : isBack ? (

                  "⌫"

                ) : isGreens ? (

                  <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.05 }}>

                    <span style={{ fontSize: 11, fontWeight: 900 }}>Restore</span>

                    <span style={{ fontSize: 11, fontWeight: 900 }}>Greens</span>

                  </span>

                ) : isSpace ? (

                  ""

                ) : isEnter ? (

                  "Enter"

                ) : isClear ? (

                  <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.02em" }}>Clear</span>

                ) : (

                  keycap

                );



                return (

                  <button

                    key={keycap}

                    disabled={disabled}

                    onClick={() => {

                      if (disabled) return;

                      if (isBack) return onBackspace();

                      if (isEnter) return onSubmitAll();

                      if (isUndo) return onUndo();

                      if (isGreens) {

                        const S = stateRef.current;

                        if (!S) return;

                        return greenUndoWithState(S);

                      }

                      if (isClear) return clearSelectedWord();

                      if (isSpace) {

                        const S = stateRef.current;

                        if (!S) return;

                        return advanceFocusInSelectedWordWithState(S);

                      }

                      onTypeLetter(keycap);

                    }}

                    style={{

                      flex,

                      height: MOBILE_KEY_H,

                      borderRadius: 12,

                      border: "1px solid rgba(0,0,0,0.10)",

                      boxShadow: "0 1px 0 rgba(0,0,0,0.06)",

                      background: bg,

                      color,

                      fontWeight: 900,



fontSize: isGreens ? Math.round(12 * mobileScreenScale) : isUndo ? Math.round(18 * mobileScreenScale) : isBack ? Math.round(18 * mobileScreenScale) : isClear ? Math.round(12 * mobileScreenScale) : Math.round(16 * mobileScreenScale),

                      lineHeight: 1,



					  letterSpacing: "0.01em",

minWidth: 0,

padding: 0,



                      overflow: "hidden",

                      display: "flex",

                      alignItems: "center",

                      justifyContent: "center",

                      userSelect: "none",

                    }}

                  >

                    {label}

                  </button>

                );

              })}

            </div>

          ))}

        </div>

      )}

    </div>

  </>

)}

















{gameOver && showResults && (



        <div className="fixed inset-0 z-[9998] flex justify-center items-center px-4" style={{ background: "rgba(0,0,0,0.35)" }}>



		 <div





className="w-full rounded-2xl bg-white border shadow-xl"

style={{

color: WORDLE.textDark,

maxWidth: Math.round(420 * Math.max(1, uiScale)),

maxHeight: "calc(100vh - 32px)",





overflow: "hidden",

display: "flex",

flexDirection: "column",

position: "relative",

padding: Math.round(18 * Math.max(1, uiScale)),

overflowY: "auto",





fontSize: Math.round(14 * Math.max(1, uiScale)),





	lineHeight: 1.15,

  }}

>

		 <button

			onClick={() => setShowResults(false)}

			aria-label="Close results"

			style={{

			  position: "absolute",

			  top: 10,

			  right: 10,

			  width: 36,

			  height: 36,

			  borderRadius: 18,

			  border: "1px solid rgba(0,0,0,0.12)",

			  background: "white",

			  cursor: "pointer",

			  fontSize: 20,

			  fontWeight: 900,

			  lineHeight: 1,

			}}

		  >

			×

		  </button>

  <div className="text-center" style={{ marginTop: 2 }}>









 <div style={{ fontSize: Math.round(24 * Math.max(1, uiScale)), fontWeight: 900, lineHeight: 1.05

}}>

{didWin ? "Congratulations!" : "Try again tomorrow!"}

</div>

<div style={{ fontSize: Math.round(18 * Math.max(1, uiScale)), fontWeight: 900, lineHeight:

1.05 }}>



{didWin ? "Solved!" : ""}

</div>

</div>







{/*

Spacer ABOVE Attempts to push it DOWN */}

<div style={{ height: 6 }} />







<div

style={{ marginTop: 0, fontSize: Math.round(14 * Math.max(1, uiScale)), fontWeight: 600, color: "#374151", textAlign: "center" }}

>







Attempts: <span style={{ fontVariantNumeric: "tabular-nums" }}>{didWin ? submissions : "X"}/{MAX_SUBMISSIONS}</span>



</div>

{PUZZLE_CREDITS[puzzleNumber] && (() => {

const cr = PUZZLE_CREDITS[puzzleNumber];

return (

<div style={{

marginTop: Math.round(10 * Math.max(1, uiScale)),

marginLeft: "auto",

marginRight: "auto",

maxWidth: Math.round(320 * Math.max(1, uiScale)),

background: "linear-gradient(135deg, #fef9c3, #fef3c7)",

border: "1.5px solid #f59e0b",

borderRadius: Math.round(10 * Math.max(1, uiScale)),

padding: `${Math.round(8 * Math.max(1, uiScale))}px ${Math.round(14 * Math.max(1, uiScale))}px`,

textAlign: "center",

boxShadow: "0 0 12px rgba(245,158,11,0.25)",

}}>

<div style={{ fontSize: Math.round(11 * Math.max(1, uiScale)), fontWeight: 700, color: "#92400e", letterSpacing: "0.05em", marginBottom: Math.round(2 * Math.max(1, uiScale)) }}>✨ COMMUNITY PUZZLE ✨</div>

<div style={{ fontSize: Math.round(12 * Math.max(1, uiScale)), color: "#78350f", fontWeight: 600, lineHeight: 1.4 }}>

Today&apos;s puzzle was inspired by <strong>{cr.name}</strong> who submitted this idea after solving Kazword #{cr.solvedOn} in just {cr.attempts} attempt{cr.attempts !== 1 ? "s" : ""}!

</div>

</div>

);

})()}





{/* DEBUG v2: didWin={String(didWin)} submissions={String(submissions)} */}

{didWin && (

<div style={{

marginTop: Math.round(16 * Math.max(1, uiScale)),

display: "flex",

flexDirection: "column",

alignItems: "center",

gap: 8,

}}>

<div style={{

fontSize: Math.round(12 * Math.max(1, uiScale)),

fontWeight: 700,

color: "#6b7280",

textAlign: "center",

letterSpacing: "0.04em",

}}>

✨ SOLVER EXCLUSIVE ✨

</div>

<button













onClick={async () => {

try {













const existingToken = localStorage.getItem(`kzw_token_day_${puzzleNumber}`);

if (existingToken) {

window.open(`/reward?token=${existingToken}&words=${Object.keys(derivedWordsById).length}`, "_blank");

return;

}













const res = await fetch("/api/generate-token", {

method: "POST",

headers: { "Content-Type": "application/json" },

body: JSON.stringify({ submissions, puzzleNumber }),

});

const d = await res.json();

if (d.token && d.sessionId) {

localStorage.setItem(`kzw_session_${d.token}`, d.sessionId);

localStorage.setItem(`kzw_token_day_${puzzleNumber}`, d.token);

window.open(`/reward?token=${d.token}&words=${Object.keys(derivedWordsById).length}`, "_blank");

}

} catch (e) {

alert("Something went wrong. Please try again.");

}

}}







style={{

background: "linear-gradient(135deg, #f59e0b, #ef4444, #8b5cf6)",

backgroundSize: "300% 300%",

animation: "kazSparkleBtn 3s ease infinite",

color: "white",

fontWeight: 900,

fontSize: Math.round(14 * Math.max(1, uiScale)),

border: "none",

borderRadius: Math.round(12 * Math.max(1, uiScale)),

padding: `${Math.round(10 * Math.max(1, uiScale))}px ${Math.round(13 * Math.max(1, uiScale))}px`,

cursor: "pointer",

boxShadow: "0 0 18px rgba(245,158,11,0.5)",

letterSpacing: "0.04em",

}}

>







<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width={Math.round(23 * Math.max(1, uiScale))} height={Math.round(23 * Math.max(1, uiScale))} style={{display:"inline",verticalAlign:"middle",marginRight:8}}><rect x="35" y="3" width="30" height="30" rx="5" fill="#5CC85A" stroke="#000000" strokeWidth="4"/><rect x="3" y="35" width="30" height="30" rx="5" fill="#5CC85A" stroke="#000000" strokeWidth="4"/><rect x="35" y="35" width="30" height="30" rx="5" fill="#F5C842" stroke="#000000" strokeWidth="4"/><rect x="67" y="35" width="30" height="30" rx="5" fill="#5CC85A" stroke="#000000" strokeWidth="4"/><rect x="35" y="67" width="30" height="30" rx="5" fill="#5CC85A" stroke="#000000" strokeWidth="4"/></svg> Submit Your Kazword









</button>

<div style={{

fontSize: Math.round(11 * Math.max(1, uiScale)),

color: "#9ca3af",

textAlign: "center",

}}>



</div>

</div>

)}









{stats && (

<div style={{ marginTop: 6, overflowY: "hidden", minHeight: 0 }}>



<div style={{ fontWeight: 900, letterSpacing: "0.04em", fontSize: Math.round(13 * Math.max(1, uiScale)) }}>STATISTICS</div>



      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>

        <div style={{ textAlign: "center", width: "24%" }}>





<div style={{ fontSize: Math.round(24 * Math.max(1, uiScale)), fontWeight: 900, lineHeight: 1.05 }}>{stats.played}</div>

<div style={{ fontSize: Math.round(11 * Math.max(1, uiScale)), fontWeight: 700, opacity: 0.75 }}>Played</div>







        </div>





        <div style={{ textAlign: "center", width: "24%" }}>



<div style={{ fontSize: Math.round(24 * Math.max(1, uiScale)), fontWeight: 900, lineHeight: 1.05 }}>{stats.currentStreak}</div>

<div style={{ fontSize: Math.round(11 * Math.max(1, uiScale)), fontWeight: 700, opacity: 0.75 }}>Current Streak</div>







        </div>

        <div style={{ textAlign: "center", width: "24%" }}>



        <div style={{ fontSize: Math.round(24 * Math.max(1, uiScale)), fontWeight: 900, lineHeight: 1.05 }}>{stats.maxStreak}</div>

<div style={{ fontSize: Math.round(11 * Math.max(1, uiScale)), fontWeight: 700, opacity: 0.75 }}>Max Streak</div>







        </div>

      </div>





	 <div style={{ marginTop: 12, fontWeight: 900, letterSpacing: "0.04em", fontSize: Math.round(13 * Math.max(1, uiScale)) }}>

GUESS DISTRIBUTION



      </div>

      <div style={{ marginTop: 6 }}>

{(["1", "2", "3", "4", "5", "6"]).map((b) => {

          const v = stats.dist?.[b] || 0;

		  const max = Math.max(...Object.values(stats.dist || {}), 1);

          const pct = Math.round((v / max) * 100);

          return (

            <div key={b} style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 6 }}>





			<div

  style={{



  width: Math.round(19 * Math.max(1, uiScale)),

//label column width (knob)

display: "flex",

gap: Math.round(12 * Math.max(1, uiScale)),

//space between word & number (knob)

fontWeight: 800,

fontSize: Math.round(12 * Math.max(1, uiScale)),

whiteSpace: "nowrap",





  }}

>





  {b === "NEVER" ? (

  <>









<span style={{ display: "flex", alignItems: "center", gap: 4 }}>1 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width={Math.round(16 * Math.max(1, uiScale))} height={Math.round(16 * Math.max(1, uiScale))}><rect x="35" y="3" width="30" height="30" rx="5" fill="#5CC85A" stroke="#000000" strokeWidth="4"/><rect x="3" y="35" width="30" height="30" rx="5" fill="#5CC85A" stroke="#000000" strokeWidth="4"/><rect x="35" y="35" width="30" height="30" rx="5" fill="#F5C842" stroke="#000000" strokeWidth="4"/><rect x="67" y="35" width="30" height="30" rx="5" fill="#5CC85A" stroke="#000000" strokeWidth="4"/><rect x="35" y="67" width="30" height="30" rx="5" fill="#5CC85A" stroke="#000000" strokeWidth="4"/></svg></span>







  </>

) : (

  <>

    <span>{b.split(" ")[0]}</span>

    <span>{b.split(" ")[1]}</span>

  </>

)}













</div>











              <div style={{ flex: 1, background: "rgba(0,0,0,0.08)", borderRadius: 6, overflow: "hidden" }}>

                <div

                  style={{

                    width: `${pct}%`,

                    background: "rgba(0,0,0,0.55)",

                    padding: "2px 6px", // ✅ tighter

                    color: "white",

                    fontWeight: 900,

                    fontSize: 12,

                    textAlign: "right",

                    lineHeight: 1.05,

                  }}

                >

                  {v}

                </div>

              </div>

            </div>

          );

        })}

      </div>

    </div>

  )}





 {resultToast && (

  <div

    style={{

      position: "absolute",

      inset: 0, // ✅ covers the modal so it never affects layout

      pointerEvents: "none",

      zIndex: 50,

      display: "flex",

      justifyContent: "center",

      alignItems: "flex-end",

      // ✅ pushes it up a bit so it's in the lower-middle area

      // (increase if it's covering buttons too much)

      paddingBottom: 92,

    }}

  >

    <div

      className="px-5 py-3 rounded-xl"

      style={{



	   background: "#111827",

color: "white",

fontWeight: 900,

fontSize: Math.round(14 * Math.max(1, uiScale)),

boxShadow: "0 10px 30px rgba(0,0,0,0.25)",

display: "inline-flex",

alignItems: "center",

gap: Math.round(10 * Math.max(1, uiScale)),





      }}

    >





{resultToast} <span style={{ fontSize: Math.round(18 * Math.max(1, uiScale)) }}>✅</span>

    </div>

  </div>

)}

  {/* ✅ footer stays visible */}





<div className="mt-4 flex justify-center gap-3" style={{ marginTop: "auto", paddingTop: 12 }}>



<button
  onClick={async () => { await doShare({ mode: "copy" }); }}
  className="px-5 py-2 rounded-xl bg-[#111827] text-white font-semibold shadow-sm hover:bg-black"
>
  Share
</button>












  </div>

</div>







        </div>

      )}

    </div>

  );

}


