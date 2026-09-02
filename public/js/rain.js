// Digital rain background. Fixed full-viewport canvas, one animation loop.
// Density/speed/opacity scale with `intensity` (1 = hero, low = ambient) so the
// same canvas can go from a full Matrix curtain to a faint sitewide backdrop
// without ever fully switching off.
(function () {
  "use strict";

  var canvas = document.getElementById("matrix-rain");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");

  var reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  // Curated, weighted glyph pool: mostly digits/hex/punctuation (reads as
  // "machine data"), a restrained slice of katakana for the Matrix identity.
  var DIGITS = "0123456789";
  var HEX = "ABCDEF";
  var PUNCT = "{}[]<>/\\;:=+-*#_.";
  var KATA = "アイウエオカキクケコサシスセソ";
  var GLYPHS =
    DIGITS.repeat(5) + HEX.repeat(3) + PUNCT.repeat(2) + KATA;

  // Short tokens a column occasionally "types" one character per row, so the
  // fading trail reads as a recognizable fragment of machine/terminal output.
  var TOKENS = [
    "0x1F",
    "0xFF",
    "0xA3",
    "0x00",
    "NaN",
    "null",
    "true",
    "false",
    "0101",
    "1010",
    "1101",
    "ERR",
    "404",
    "200",
    "SSH",
    "ACK",
    "SYN",
    "EOF",
    "DEAD",
    "BEEF",
  ];

  var FONT_SIZE = 16;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);

  var width = 0,
    height = 0,
    columns = 0,
    drops = [],
    rowCache = [],
    tokenState = [];

  var intensity = reduceMotion ? 0.1 : 1; // current, smoothed value
  var targetIntensity = intensity;
  var AMBIENT_FLOOR = 0.12; // never fully off outside the hero

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    columns = Math.ceil(width / FONT_SIZE);
    drops = new Array(columns)
      .fill(0)
      .map(function () {
        return (Math.random() * -height) / FONT_SIZE;
      });
    rowCache = new Array(columns).fill(null);
    tokenState = new Array(columns).fill(null);
  }

  function nextGlyph(i) {
    var row = Math.floor(drops[i]);
    if (row !== rowCache[i]) {
      rowCache[i] = row;
      var state = tokenState[i];
      if (!(state && state.idx < state.chars.length)) {
        if (Math.random() < 0.006) {
          var tok = TOKENS[(Math.random() * TOKENS.length) | 0];
          tokenState[i] = { chars: tok.split(""), idx: 0 };
        } else {
          tokenState[i] = null;
        }
      }
    }
    var s = tokenState[i];
    if (s && s.idx < s.chars.length) {
      return s.chars[s.idx++];
    }
    return GLYPHS[(Math.random() * GLYPHS.length) | 0];
  }

  function draw() {
    intensity += (targetIntensity - intensity) * 0.02;
    var level = Math.max(intensity, AMBIENT_FLOOR);

    // Higher fade alpha at low intensity = shorter trails = sparser look,
    // without having to skip columns (which would flicker).
    ctx.fillStyle = "rgba(6, 10, 8, " + (0.07 + 0.11 * level) + ")";
    ctx.fillRect(0, 0, width, height);

    ctx.font = FONT_SIZE + "px 'JetBrains Mono', monospace";
    ctx.textBaseline = "top";

    for (var i = 0; i < columns; i++) {
      var char = nextGlyph(i);
      var x = i * FONT_SIZE;
      var y = drops[i] * FONT_SIZE;

      var isLead = Math.random() > 0.96;
      if (isLead) {
        ctx.fillStyle = "rgba(214, 255, 229, " + (0.35 + 0.5 * level) + ")";
      } else {
        var flicker = 0.25 + Math.random() * 0.45;
        ctx.fillStyle =
          "rgba(46, 230, 107, " + (flicker * level + 0.04) + ")";
      }
      ctx.fillText(char, x, y);

      if (y > height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i] += 0.35 + Math.random() * 0.4;
    }
  }

  window.addEventListener("resize", resize);
  resize();

  if (reduceMotion) {
    // Single static-ish frame, no animation loop.
    draw();
  } else {
    (function loop() {
      draw();
      requestAnimationFrame(loop);
    })();
  }

  window.matrixRain = {
    setIntensity: function (v) {
      targetIntensity = v;
    },
  };
})();
