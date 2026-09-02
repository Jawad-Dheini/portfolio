(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    runHeroBoot();
    setupNav();
    setupMobileMenu();
    setupScrollReveal();
    setupRainIntensity();
    setupFooterYear();
  });

  // ---- Hero boot sequence -------------------------------------------------
  async function runHeroBoot() {
    var T = window.terminalType;
    var greet = document.getElementById("hero-greet");
    var name = document.getElementById("hero-name");
    var rolePrefix = document.getElementById("hero-role-prefix");
    var role = document.getElementById("hero-role");
    var roleLine = document.getElementById("hero-role-line");

    if (!greet || !name || !rolePrefix || !role || !T) return;

    var ROLES = [
      "Computer Science & Engineering Student",
      "Fullstack Developer",
      "Machine Learning Builder",
      "Founder, Deafeat",
    ];

    if (T.reduceMotion) {
      greet.textContent = "Hello, It's Me";
      name.textContent = "Jawad Dheini";
      rolePrefix.textContent = "I'm a ";
      role.textContent = ROLES[0];
      document.body.classList.add("hero-ready");
      return;
    }

    greet.classList.add("caret-active");
    await T.typeInto(greet, "Hello, It's Me", { speed: 34, jitter: 30 });
    greet.classList.remove("caret-active");

    await T.wait(150);
    name.classList.add("caret-active");
    await T.typeInto(name, "Jawad Dheini", { speed: 58, jitter: 46 });
    name.classList.remove("caret-active");

    await T.wait(150);
    roleLine.classList.add("caret-active");
    await T.typeInto(rolePrefix, "I'm a ", {
      speed: 30,
      jitter: 26,
    });

    document.body.classList.add("hero-ready");
    T.cycleRoles(role, ROLES);
  }

  // ---- Nav: smooth scroll + scroll-spy ------------------------------------
  function setupNav() {
    var offset = 70;

    function smoothScrollTo(targetId) {
      var target = document.getElementById(targetId);
      if (!target) return;
      window.scrollTo({
        top: target.offsetTop - offset,
        behavior: "smooth",
      });
    }

    document
      .querySelectorAll(".navbar a, .mobile-nav-link")
      .forEach(function (anchor) {
        anchor.addEventListener("click", function (e) {
          var href = anchor.getAttribute("href");
          if (!href || href.charAt(0) !== "#") return;
          e.preventDefault();
          smoothScrollTo(href.substring(1));
        });
      });

    var sections = document.querySelectorAll("section[id]");
    var navLinks = document.querySelectorAll(".navbar a");
    var promptPath = document.getElementById("logo-path");

    // Project detail pages have no in-page `section[id]` targets to spy on;
    // leave whatever active state / prompt path is already in the markup
    // alone rather than stripping it on first scroll.
    if (!sections.length) return;

    window.addEventListener("scroll", function () {
      var current = "";
      sections.forEach(function (section) {
        var sectionTop = section.offsetTop - offset - 10;
        if (window.pageYOffset >= sectionTop) {
          current = section.getAttribute("id");
        }
      });
      navLinks.forEach(function (link) {
        link.classList.toggle(
          "active",
          link.getAttribute("href") === "#" + current
        );
      });
      if (promptPath) {
        promptPath.textContent =
          !current || current === "home" ? ":~$" : ":~/" + current + "$";
      }
    });
  }

  // ---- Mobile menu ----------------------------------------------------------
  function setupMobileMenu() {
    var hamburger = document.getElementById("hamburger-menu");
    var mobileNav = document.getElementById("mobile-navbar");
    if (!hamburger || !mobileNav) return;

    hamburger.addEventListener("click", function (e) {
      e.stopPropagation();
      var isOpen = mobileNav.classList.toggle("active");
      hamburger.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    document.addEventListener("click", function (e) {
      if (
        !mobileNav.contains(e.target) &&
        !hamburger.contains(e.target) &&
        mobileNav.classList.contains("active")
      ) {
        mobileNav.classList.remove("active");
        hamburger.setAttribute("aria-expanded", "false");
      }
    });

    mobileNav.addEventListener("click", function (e) {
      e.stopPropagation();
    });

    mobileNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        mobileNav.classList.remove("active");
        hamburger.setAttribute("aria-expanded", "false");
      });
    });
  }

  // ---- Scroll reveal ---------------------------------------------------------
  function setupScrollReveal() {
    var items = document.querySelectorAll(".reveal");
    if (!items.length) return;

    if (
      !("IntersectionObserver" in window) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      items.forEach(function (el) {
        el.classList.add("in-view");
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    items.forEach(function (el) {
      observer.observe(el);
    });
  }

  // ---- Rain intensity: full in the hero, faint/ambient elsewhere -----------
  function setupRainIntensity() {
    var hero = document.getElementById("home");
    if (!hero || !window.matrixRain || !("IntersectionObserver" in window)) {
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          window.matrixRain.setIntensity(
            entry.isIntersecting ? 1 : 0.16
          );
        });
      },
      { threshold: 0.35 }
    );

    observer.observe(hero);
  }

  function setupFooterYear() {
    var el = document.getElementById("footer-year");
    if (el) el.textContent = new Date().getFullYear();
  }
})();
