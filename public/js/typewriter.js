// Genuine character-by-character terminal typing (and deleting), with timing
// jitter and punctuation pauses so it reads like it's actually being typed
// rather than a fixed-speed fade/reveal.
(function () {
  "use strict";

  var reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  function wait(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  }

  function typeInto(el, text, opts) {
    opts = opts || {};
    var speed = opts.speed || 42;
    var jitter = opts.jitter || 38;

    if (reduceMotion) {
      el.textContent = text;
      return Promise.resolve();
    }

    el.textContent = "";
    return new Promise(function (resolve) {
      var i = 0;
      function tick() {
        if (i >= text.length) {
          resolve();
          return;
        }
        var ch = text[i];
        el.textContent += ch;
        i++;
        var delay = speed + Math.random() * jitter;
        if (",.!?".indexOf(ch) !== -1) delay += 220;
        else if (ch === " ") delay *= 0.6;
        setTimeout(tick, delay);
      }
      tick();
    });
  }

  function deleteFrom(el, opts) {
    opts = opts || {};
    var speed = opts.speed || 26;
    var jitter = opts.jitter || 18;

    if (reduceMotion) {
      el.textContent = "";
      return Promise.resolve();
    }

    return new Promise(function (resolve) {
      function tick() {
        var text = el.textContent;
        if (!text.length) {
          resolve();
          return;
        }
        el.textContent = text.slice(0, -1);
        setTimeout(tick, speed + Math.random() * jitter);
      }
      tick();
    });
  }

  // Types each string in `roles`, holds, deletes, moves to the next, looping
  // forever. Caller is responsible for stopping (e.g. page unload isn't a
  // concern here since it's confined to the hero).
  async function cycleRoles(el, roles, opts) {
    opts = opts || {};
    var holdTime = opts.holdTime || 1400;
    var pauseTime = opts.pauseTime || 350;

    if (reduceMotion) {
      el.textContent = roles[0];
      return;
    }

    while (true) {
      for (var i = 0; i < roles.length; i++) {
        await typeInto(el, roles[i], { speed: 48, jitter: 40 });
        await wait(holdTime);
        await deleteFrom(el, { speed: 24, jitter: 16 });
        await wait(pauseTime);
      }
    }
  }

  window.terminalType = {
    typeInto: typeInto,
    deleteFrom: deleteFrom,
    cycleRoles: cycleRoles,
    wait: wait,
    reduceMotion: reduceMotion,
  };
})();
