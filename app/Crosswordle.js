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
const MAX_SUBMISSIONS = 12;
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
const LAUNCH_DATE = new Date(2026, 0, 14); // Jan 14, 2026
function formatYMD(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
function daysSince(d0, d1) {
  const a = new Date(d0.getFullYear(), d0.getMonth(), d0.getDate());
  const b = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate());
  return Math.floor((b - a) / 86400000);
}
const STATS_KEY = "cw_stats_v1";
const HELP_SEEN_KEY = "cw_help_seen_v1";
const LAST_PLAYED_KEY = "cw_last_played_ymd_v1";



function bucketForGuess(n) {
  if (n <= 10) return "10 and under";
  if (n <= 20) return "Above 10";
  if (n <= 30) return "Above 20";
  if (n <= 40) return "Above 30";
  return "Above 40";
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
				  "10 and under": 0,
				  "Above 10": 0,
				  "Above 20": 0,
				  "Above 30": 0,
				  "Above 40": 0,
				},

      };
    }
    const parsed = JSON.parse(raw);
    const legacy = parsed.dist || {};
	
    // ✅ Prefer new keys if they exist; otherwise best-effort map old ranges into new ones
    // ✅ Prefer new keys if they exist; otherwise best-effort map old ranges into new ones
const hasNew =
  legacy["10 and under"] != null || legacy["Under 10"] != null ||
  legacy["Above 10"] != null ||
  legacy["Above 20"] != null ||
  legacy["Above 30"] != null ||
  legacy["Above 40"] != null;

if (hasNew) {
  return {
    played: parsed.played ?? 0,
    wins: parsed.wins ?? 0,
    currentStreak: parsed.currentStreak ?? 0,
    maxStreak: parsed.maxStreak ?? 0,
    dist: {
		  "10 and under": legacy["10 and under"] ?? legacy["Under 10"] ?? 0,
		  "Above 10": legacy["Above 10"] ?? 0,
		  "Above 20": legacy["Above 20"] ?? 0,
		  "Above 30": legacy["Above 30"] ?? 0,
		  "Above 40": legacy["Above 40"] ?? 0,
		},

  };
}

// Otherwise: legacy → new
const dist = {
  "10 and under": (legacy["1-2"] ?? 0) + (legacy["3-5"] ?? legacy["1-5"] ?? 0) + (legacy["6-8"] ?? 0) + (legacy["6-10"] ?? 0),
  "Above 10": (legacy["9-11"] ?? legacy["11-15"] ?? 0) + (legacy["12"] ?? 0) + (legacy["16-20"] ?? 0),
  "Above 20": (legacy["21-25"] ?? 0) + (legacy["26-30"] ?? 0),
  "Above 30": (legacy["31-35"] ?? 0) + (legacy["36-40"] ?? 0),
  "Above 40": (legacy["41-45"] ?? 0) + (legacy["46+"] ?? 0),
};

return {
  played: parsed.played ?? 0,
  wins: parsed.wins ?? 0,
  currentStreak: parsed.currentStreak ?? 0,
  maxStreak: parsed.maxStreak ?? 0,
  dist,
};

	
	
	
	
	
	
	
	
  } catch {
    return {
      played: 0,
      wins: 0,
      currentStreak: 0,
      maxStreak: 0,
      dist: {
				  "10 and under": 0,
				  "Above 10": 0,
				  "Above 20": 0,
				  "Above 30": 0,
				  "Above 40": 0,
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
  return daysSince(LAUNCH_DATE, now) + 1; // 1-based (LOCAL midnight-based)
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
[8,13],[9,4],[9,5],[9,6],[9,7],[9,8],[9,13],[10,8],[10,10],[10,11],[10,12],[10,13],[10,14],[11,8],[11,10],[11,13],[12,6],[12,7],[12,8],[12,9],[12,10],[12,13],[13,8],[13,10],[14,10],[14,11],[14,12],[14,13],[14,14],
],




//Shape 12

[
[4,10],[5,8],[5,9],[5,10],[5,11],[5,12],[6,4],[6,5],[6,6],[6,7],[6,8],[6,10],[6,13],[7,8],[7,10],[7,11],[7,12],[7,13],[7,14],[8,8],[8,10],[8,13],[9,8],[9,11],[9,12],[9,13],[9,14],[9,15],[10,13],
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
const DAILY_OVERRIDES = {
  

  
  //things connected to time
   1: {   
   shapeIdx: 7,
   clueIdx: 7,

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
  
  2: {   
   shapeIdx: 8,
   clueIdx: 8,
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
  
  
  
  
  
    //Shape 9
  
 46: {   
   shapeIdx: 9,
   clueIdx: 9,
   tileLetters: {
 // 1D — HAPPY (down col 5, rows 4-8)
  "4-5": "H",
  "5-5": "A",
  "6-5": "P", // also first letter of PROUD
  "7-5": "P",
  "8-5": "Y",

  // 5A — RELAX (across row 4, cols 9-13)
  "4-9":  "R", // also PRIDE letter
  "4-10": "E",
  "4-11": "L",
  "4-12": "A", // also BRAVE letter
  "4-13": "X",

  // 3D — PRIDE (down col 9, rows 3-7)
  "3-9": "P",
  // "4-9" is already R from RELAX
  "5-9": "I",
  "6-9": "D", // also last letter of PROUD
  "7-9": "E",

  // 6A — PROUD (across row 6, cols 5-9)
  // "6-5" is already P from HAPPY
  "6-6": "R",
  "6-7": "O",
  "6-8": "U",
  // "6-9" is already D from PRIDE

  // 2D — BRAVE (down col 12, rows 2-6)
  "2-12": "B",
  "3-12": "R",
  // "4-12" is already A from RELAX
  "5-12": "V",
  "6-12": "E", // also PEACE letter

  // 7A — PEACE (across row 6, cols 11-15)
  "6-11": "P",
  // "6-12" is already E from BRAVE
  "6-13": "A",
  "6-14": "C",
  "6-15": "E", // also last letter of SMILE

  // 4D — SMILE (down col 15, rows 2-6)
  "2-15": "S",
  "3-15": "M",
  "4-15": "I",
  "5-15": "L",
  // "6-15" is already E from PEACE
  
    },
  },
  
  
  
  
  
  //Shape 10 
  
   4: {   
   shapeIdx: 10,
   clueIdx: 10,
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
  
  
  
  
  
  
  
  
  
  //Shape 11 
  
   5: {   
   shapeIdx: 11,
   clueIdx: 11,
   tileLetters: {

  
    },
  },
  
  
  
  
  
  //Shape 12
  
 47: {   
   shapeIdx: 12,
   clueIdx: 12,
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
const dayTokensKey = (dayNum) => `cw_clues_remaining_day_${dayNum}_v1`;
const dayUnlocksKey = (dayNum) => `cw_clues_unlocked_day_${dayNum}_v1`;
const daySpentKey  = (dayNum) => `cw_clues_spent_day_${dayNum}_v1`; // ✅ NEW
const daySaveKey = (dayNum) => `cw_save_day_${dayNum}_v1`;


// Per-day word clues (only defining Day 18 for now: Road Trip!)
const WORD_CLUES_BY_DAY = {
	
	
  //Road Trip Clues
1: {
    "4A": "Road taken, metaphorically or literally",
    "7A": "Someone somewhere is not tall enough to go on this",
    "1D": "Past tense action on the road",
    "2D": "Family man's vehicle",
    "3D": "(Toy) Car Brand",
    "5D": "Another pronunciation of root",
    "6D": "Fall or stumble",
  },
  
  
  //Going Shopping Clues
  2: {
    "4A": "Final amount due",
    "1D": "Final step in the supply chain",
    "2D": "Cost, essentially",
    "3D": "Discount event",
    "5A": "Not expensive",
    "6A": "Things you buy",
	"3A": "Consumer destination",
  },
  
  
  
  
  //A Nice Summer Day Clues
  3: {
    "4A": "It connects the world by dividing it",
    "1A": "A lifeguard may or may not need to do this",
    "2D": "Textured hair look",
    "3A": "Bucket’s companion",
    "5D": "Calling someones lie",
    "6A": "_____ Delight (juice brand)",
	"3D": "From Texas in Spongebob",
  },
  
  
  
    //Things to do with Time
  4: {
    "4D": "Even a broken _____ is right twice a day",
    "1D": "The time from sunset to sunrise",
    "6A": "February",
    "7A": "Comes before tomorrow but after yesterday",
    "2D": "Arriving with time to spare",
    "5A": "Time on the go",
	"3D": "Mobile",
  },
  
  
  
     //thinking
  5: {
    "4A": "Lightbulbs in cartoons",
    "1D": "Center of attention",
    "6A": "Give it some thought",
    "2A": "Using Reason over vibes",
	"2D": "Go from confused to capable",
    "5A": "Big-brain",
	"3D": "Your mental CPU",
  },
  
  
  
  
     //Positive emotions
  46: {
    "4D": "Kids meal at McDonald's",
    "1D": "Far from cowardice",
    "6A": "Satisfied with an accomplishment",   //maybe good maybe bad, might change idk
    "7A": "Gesture made with a V",
	"2D": "Picture day at school",
    "5A": "Chill, dude",
	"3D": "A group of lions",
  },
  
  
  
  
  
      //Universe/space
	  
  7: {
    "4D": "Lights on stage",
    "1D": "Goes between words",
    "4A": "Determined by seasons, not crescents",
    "5A": "Home to over eight billion people",
	"2D": "Islamic calendar",
    "6A": "Circular path in space",
	"3D": "Cosmic Snowball",
  },
  
  
 

     //track and field 
	  
  8: {
    "4D": "Crown piece",
    "1D": "Spoils of war",
    "2A": "Medieval weapon",
    "5A": "Man of steal",
	"2D": "Case for the brain",
    "6A": "Upper body",
	"3A": "Core exercise that feels like the longest minute",
  },
 
 
      //Pirate 
	
  47: {
    "4D": "Crown piece",
    "1D": "Spoils of war",
    "2A": "Medieval weapon",
    "5A": "Man of steal",
	"2D": "Case for the brain",
    "6A": "Upper body",
	"3A": "Core exercise that feels like the longest minute",
  },
  
  
  
  
  
  
  
};



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
    (t) => {
      if (!startRef.current) startRef.current = t;
      const elapsed = t - startRef.current;
      const next = Math.min(1, elapsed / HOLD_MS);
      setP(next);

      if (next >= 1) {
        stop();
        onUnlock?.();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    },
    [HOLD_MS, onUnlock, stop]
  );

  const begin = React.useCallback(() => {
    if (!locked || disabled) return;
    delayRef.current = setTimeout(() => {
      startRef.current = 0;
      rafRef.current = requestAnimationFrame(tick);
    }, START_DELAY_MS);
  }, [locked, disabled, tick]);

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
if (typeof window === "undefined") return getDailyPuzzle(LAUNCH_DATE);
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
  try {
    const raw = localStorage.getItem(daySaveKey(dayNum));
    if (raw) {
      const saved = JSON.parse(raw);

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
  
  const [showResults, setShowResults] = useState(false); // ✅ controls modal open/close
  
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
    return;
  }

  const idx = wordsAt.findIndex((w) => w.id === selectedWord);
  const next = idx === -1 ? wordsAt[0] : wordsAt[(idx + 1) % wordsAt.length];

  setSelectedWord(next.id);
  setFocusedKey(k);
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
      if (state === "correct") return "🟩";
      if (state === "present") return "🟨";
      if (state === "absent") return "⬛";
      return PLACEHOLDER;
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
    lines.push(`Attempts: ${S.submissions}`);
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

const spentMapText = S.spentCluesByDay?.[puzzleNumber] || {};
const hasWordClue = Boolean(spentMapText?.[id]);

  lines.push(`${mark} ${id} = ${n}${hasWordClue ? " 💡" : ""}`);
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
	
	
   const spentMap = S.spentCluesByDay?.[puzzleNumber] || {}; // ✅ NEW
const hasWordClue = Boolean(spentMap?.[id]); // ✅ ONLY spent clues get 💡
return { id, n, solved, hasWordClue };
	
	
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
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  // title
  ctx.fillStyle = "#111827";
  ctx.font = "800 18px system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif";
  ctx.fillText(`KAZWORD #${puzzleNumber}`, pad, pad + 20);

  const startX = pad;
  const startY = pad + titleH;

  const colorFor = (st) => {
    if (st === "correct") return WORDLE.green;
    if (st === "present") return WORDLE.yellow;
    if (st === "absent") return WORDLE.gray;
    return "#ffffff";
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

      // rounded rect tile
      const radius = 7;
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.arcTo(x + tile, y, x + tile, y + tile, radius);
      ctx.arcTo(x + tile, y + tile, x, y + tile, radius);
      ctx.arcTo(x, y + tile, x, y, radius);
      ctx.arcTo(x, y, x + tile, y, radius);
      ctx.closePath();

      ctx.fillStyle = colorFor(st);
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
  ctx.fillStyle = "#111827";
  ctx.font = "800 16px system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif";
  ctx.fillText(`Attempts: ${S.submissions}`, textX, y);

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
    ctx.fillStyle = "#111827";
   
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
  
  
	  // ✅ candidates = complete + changed
	// (editedSinceSubmit was causing some complete words to be skipped -> missing toasts like 1D)
	const candidates = [];
	for (const wId of allWordIds) {
	  if (!wordIsCompleteInCells(S, wId)) continue;
	  if (!wordHasChangedSinceLastSubmit(S, wId)) continue;
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
	
	
	
	
	// show the toast(s) but keep going if anything is valid
	if (invalidMsgs.length) showToasts(invalidMsgs);
	// if *nothing* is valid, then stop
	if (validCandidates.length === 0) return;
	// ✅ from here on, use validCandidates instead of candidates
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
  //const isOut = submissionsAfter >= PUZZLE.maxSubmissions;
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
    setFeedbackByWord(nextFeedbackByWord);
    setLatestTouch(nextLatestTouch);
    setKeyStatesByWord(nextKeyStatesByWord);
    setSubmitHistoryByWord(nextSubmitHistory);
    setWordAttempts(nextWordAttempts);
    setWordSolvedEver(nextSolvedEver);
    setSubmissions(submissionsAfter);
	
	    if (newlyEarnedClues.length) {
      setClueTokens((prev) => prev + newlyEarnedClues.length);
      showToasts(`+${newlyEarnedClues.length} clue${newlyEarnedClues.length === 1 ? "" : "s"} earned`);
    }


	
	
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
	  setShowResults(true);              // ✅ open modal
	  setLastShareText(makeShare(didWinLocal));
      try {
        const today = formatYMD(new Date());
        const lastPlayed = localStorage.getItem(LAST_PLAYED_KEY);
        if (lastPlayed === today) return;
        const prev = readStats();
        const next = { ...prev };
        next.played += 1;
        if (didWinLocal) next.wins += 1;
        const yesterday = formatYMD(new Date(Date.now() - 86400000));
        const continues = lastPlayed === yesterday;
        if (didWinLocal) {
          next.currentStreak = continues ? next.currentStreak + 1 : 1;
          next.maxStreak = Math.max(next.maxStreak, next.currentStreak);
          const b = bucketForGuess(submissionsAfter);
          next.dist = { ...next.dist, [b]: (next.dist[b] || 0) + 1 };
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

    // Save solved state only if submitted + complete
    if (isSubmittedNow && isComplete) {
      const solvedNow = fb.every((st) => st === "correct");
      if (solvedNow) nextSolvedEver[wId] = true;
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
  const snap = getLastSubmittedSnap(S, wId);
  if (!snap || !snap.cells) return;
  retypeCacheRef.current = {};

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
      if (skipKeys.has(k)) return false;
      const before = (S.cells[k]?.letter || "").toUpperCase();
      const after = (snap.cells[k] ?? "").toUpperCase();
      return before !== after;
    });
  
    // -------------------------
  // Build NEXT objects locally (sync), then set them once.
  // -------------------------

  // 1) nextCells (letters restored for this word, respecting skipKeys)
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
  for (const [k, st] of Object.entries(snap.feedback || {})) {
    if (skipKeys.has(k)) continue;
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
  // ✅ If this restore completes the whole puzzle, end the game immediately
  const wonNow = allTilesGreenFromFeedback(nextFeedbackByWord);
  if (wonNow) {
    setGameOver(true);
    setDidWin(true);
    const share = buildShareTextFromState(
      {
        ...S,
        cells: nextCells,
        feedbackByWord: nextFeedbackByWord,
        latestTouch: nextLatestTouch,
        lastViewed: nextLastViewed,
        gameOver: true,
        didWin: true,
      },
      nextFeedbackByWord,
      true
    );
    setLastShareText(share);
    // stats update (same logic as your submit endGame)
    try {
      const today = formatYMD(new Date());
      const lastPlayed = localStorage.getItem(LAST_PLAYED_KEY);
      if (lastPlayed !== today) {
        const prev = readStats();
        const next = { ...prev };
        next.played += 1;
        next.wins += 1;
        const yesterday = formatYMD(new Date(Date.now() - 86400000));
        const continues = lastPlayed === yesterday;
        next.currentStreak = continues ? next.currentStreak + 1 : 1;
        next.maxStreak = Math.max(next.maxStreak, next.currentStreak);
        const b = bucketForGuess(S.submissions); // GREENS doesn't consume a submission
        next.dist = { ...next.dist, [b]: (next.dist[b] || 0) + 1 };
        writeStats(next);
        localStorage.setItem(LAST_PLAYED_KEY, today);
        setStats(next);
      }
    } catch {
      // ignore
    }
  }
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

  // ---- FEEDBACK BY WORD ----
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

      const snap = getLastSubmittedSnap(S, wId);
      if (!snap?.cells || !snap?.feedback) continue;

      const snapLetter = (snap.cells[k] || "").toUpperCase();
      if (snapLetter !== nextLetter) continue; // only when retyping same snap letter

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

      const snap = getLastSubmittedSnap(S, wId);
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
// First try the selected word's own snap
const snap = getLastSubmittedSnap(S, wId);
if (snap?.cells && snap?.feedback) {
const snapLetter = (snap.cells[k] || "").toUpperCase();
if (snapLetter === nextLetter && snap.feedback[k]) {
const snapState = snap.feedback[k];
setFeedbackByWord((prev) => {
const next = { ...prev };
next[wId] = { ...(next[wId] || {}) };
next[wId][k] = snapState;
return next;
});
setLatestTouch((prev) => {
if (snapState === "correct") {
if (prev[k]?.wordId !== wId) return prev;
const next = { ...prev };
delete next[k];
return next;
}
const next = { ...prev };
next[k] = { wordId: wId, dir: derivedWordsById[wId].dir, state: snapState };
return next;
});
return;
}
}
// Selected word has no snap for this tile — check all OTHER words sharing this tile
const sharingWords = (tileToWords[k] || []).filter(id => id !== wId);
for (const otherId of sharingWords) {
const otherSnap = getLastSubmittedSnap(S, otherId);
if (!otherSnap?.cells || !otherSnap?.feedback) continue;
const otherSnapLetter = (otherSnap.cells[k] || "").toUpperCase();
if (otherSnapLetter !== nextLetter) continue;
const otherState = otherSnap.feedback[k];
if (!otherState) continue;
setFeedbackByWord((prev) => {
const next = { ...prev };
next[otherId] = { ...(next[otherId] || {}) };
next[otherId][k] = otherState;
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
  setEditedSinceSubmit((prev) => {
    const next = { ...prev };
    const impacted = tileToWords[k] || [wId];
    for (const id of impacted) next[id] = true;
    return next;
  });
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
        submitAllCompleteWordsWithState(S);
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
const keyboardReserve = Math.round(335 * mobileScaleLocal);
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

const clueW = isMobile ? 300 : Math.round(300 * Math.min(1.6, Math.max(1, uiScale)));

const gridHalfW = isMobile ? 320 : Math.max(480, Math.round(kbdMaxW / 2 + 4));

// ✅ Mobile keyboard sizing (ONLY used in mobile keyboard JSX)
const MOBILE_KBD_H = Math.round(230 * mobileScreenScale);


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


  // ✅ MOBILE: share/copy as IMAGE ONLY (no text fallback)
  if (isMobile) {
    try {
      const blob = await buildShareImageBlobFromState(
        stateRef.current,
        stateRef.current.feedbackByWord,
        stateRef.current.didWin
      );

      if (!blob) throw new Error("No image blob");

const file = new File([blob], "kazword.png", { type: blob.type || "image/png" });

     // Share sheet as a photo (if requested)
if (mode === "share") {
  if (navigator?.share) {
    try {
      await navigator.share({
        files: [file],
        title: `KAZWORD #${puzzleNumber}`,
        text: `KAZWORD #${puzzleNumber}`,
      });
      return;
    } catch {
      // user canceled OR share failed -> continue to image clipboard attempt below
    }
  }
  // still DO NOT fall back to text on mobile
}



      // Copy as image (so paste works as an image)
      if (navigator?.clipboard?.write && typeof ClipboardItem !== "undefined") {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        if (stateRef.current?.gameOver) showResultToast("Copied image");
        else showToasts("Copied image ✅");
        return;
      }

      // If neither works, fall back to showing a toast (still NO text copy)
      if (stateRef.current?.gameOver) showResultToast("Share/copy not supported");
      else showToasts("Share/copy not supported");
      return;
    } catch {
      if (stateRef.current?.gameOver) showResultToast("Share/copy failed");
      else showToasts("Share/copy failed");
      return;
    }
  }
	
	

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
    Loading…
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
      paddingBottom: mobileKbdReserve ? MOBILE_KBD_H : 0,
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
	  

{!isMobile && (

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
    Attempts: <span className="tabular-nums">{submissions}</span>
  </div>
</div>

	  
	  
	  
	  
      {showHelp && (
        <div className="fixed inset-0 z-[9998]" style={{ background: "rgba(0,0,0,0.35)" }}>
          <div className="min-h-screen flex items-center justify-center px-4">
            
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
      <li>Try to solve the Kazword in as few attempts as possible.</li>
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
      <li>
        <b>Clues</b>: When you solve a word without having unlocked its clue, you earn a clue token. 
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





{gameOver && !showResults && (
	<div
	  className="w-full max-w-[640px] px-4 flex justify-center"
	  style={{ marginTop: RESULTS_BTN_MT }}
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
      {/* ✅ Clue strip */}
      {selectedWord && (
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
    {didWin && (
 
 <div style={{ fontSize: Math.round(24 * Math.max(1, uiScale)), fontWeight: 900, lineHeight: 1.05 }}>
Congratulations!
 
  </div>
)}
    <div style={{ fontSize: Math.round(18 * Math.max(1, uiScale)), fontWeight: 900, lineHeight: 1.05 }}>
{didWin ? "Solved!" : ""}
</div>
  </div>
  
 {/* ✅ Spacer ABOVE Attempts to push it DOWN */}
<div style={{ height: 6 }} />



<div
style={{ marginTop: 0, fontSize: Math.round(14 * Math.max(1, uiScale)), fontWeight: 600, color: "#374151", textAlign: "center" }}
>




Attempts: <span style={{ fontVariantNumeric: "tabular-nums" }}>{submissions}</span>
</div>
{didWin && submissions < 20 && (
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
✨ TOP SOLVER ✨
</div>
<button
onClick={async () => {
try {
const res = await fetch("/api/generate-token", {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({ submissions, puzzleNumber }),
});
const d = await res.json();
if (d.token && d.sessionId) {
localStorage.setItem(`kzw_session_${d.token}`, d.sessionId);
window.open(`/reward?token=${d.token}`, "_blank", "noopener,noreferrer");
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
padding: `${Math.round(10 * Math.max(1, uiScale))}px ${Math.round(20 * Math.max(1, uiScale))}px`,
cursor: "pointer",
boxShadow: "0 0 18px rgba(245,158,11,0.5)",
letterSpacing: "0.04em",
}}
>
🌟 Claim Your Reward
</button>
<div style={{
fontSize: Math.round(11 * Math.max(1, uiScale)),
color: "#9ca3af",
textAlign: "center",
}}>
Solved in {submissions} — you're in the top tier!
</div>
</div>
)}
  
  
  
  
  {stats && (
      <div style={{ marginTop: 12, overflowY: "hidden", minHeight: 0 }}>

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
{(["10 and under", "Above 10", "Above 20", "Above 30", "Above 40"]).map((b) => {
          const v = stats.dist?.[b] || 0;
		  const max = Math.max(...Object.values(stats.dist || {}), 1);
          const pct = Math.round((v / max) * 100);
          return (
            <div key={b} style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 6 }}>

              
			<div
  style={{
  
  width: Math.round(95 * Math.max(1, uiScale)),
//label column width (knob)
display: "flex",
gap: Math.round(12 * Math.max(1, uiScale)),
//space between word & number (knob)
fontWeight: 800,
fontSize: Math.round(12 * Math.max(1, uiScale)),
whiteSpace: "nowrap",
  
  
  }}
>
  
  
  {b === "10 and under" ? (
  <>
        
<span>10 and under</span>	
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
     onClick={async () => {
if (isMobile) {
  await doShare({ mode: "share" }); // always TRY share sheet on mobile
} else {
  await doShare({ mode: "copy" });  // desktop stays text-copy
}

  
  
}}


	  
	  
      className="px-5 py-2 rounded-xl bg-[#111827] text-white font-semibold shadow-sm hover:bg-black"
      title="Share"
    >
      Share
    </button>
    <button
      onClick={resetAll}
      className="px-5 py-2 rounded-xl bg-white border font-semibold shadow-sm hover:bg-gray-50"
      title="Play again"
    >
      Play Again
    </button>
  </div>
</div>
		 
		  
		  
        </div>
      )}
    </div>
  );
}




















