// Contact form submission: Turnstile verification (client render, server
// checks the token) plus a hidden honeypot field, both wired into a fetch
// based submit so we can show inline status instead of a raw JSON response.
(function () {
  "use strict";

  var form = document.getElementById("contact-form");
  var statusEl = document.getElementById("form-status");
  var submitBtn = document.getElementById("contact-submit");
  var turnstileEl = document.getElementById("turnstile-container");

  var widgetId = null;
  var currentToken = null;

  window.onTurnstileLoad = function () {
    if (!window.turnstile || !turnstileEl) return;
    widgetId = window.turnstile.render(turnstileEl, {
      sitekey: turnstileEl.getAttribute("data-sitekey"),
      theme: "dark",
      callback: function (token) {
        currentToken = token;
        console.log("Turnstile: token obtained, length", token ? token.length : 0);
      },
      "error-callback": function (errorCode) {
        currentToken = null;
        console.error("Turnstile error-callback, error code:", errorCode);
        setStatus(
          "> verification widget failed to load, please refresh",
          "error"
        );
        // Returning a falsy value (or nothing) here is intentional: it
        // leaves Cloudflare's own default console diagnostics for this
        // error code intact instead of suppressing them. Do not return
        // true from this callback while debugging.
      },
      "expired-callback": function () {
        currentToken = null;
        console.warn("Turnstile: token expired");
      },
      "timeout-callback": function () {
        currentToken = null;
        console.warn("Turnstile: challenge timed out");
      },
    });
  };

  function setStatus(msg, kind) {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.className = "form-status" + (kind ? " form-status-" + kind : "");
  }

  function resetTurnstile() {
    currentToken = null;
    if (window.turnstile && widgetId !== null) {
      window.turnstile.reset(widgetId);
    }
  }

  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var name = document.getElementById("name").value.trim();
    var email = document.getElementById("email").value.trim();
    var message = document.getElementById("message").value.trim();
    var company = document.getElementById("company").value;

    if (!name || !email || !message) {
      setStatus("> please fill in every field", "error");
      return;
    }

    if (!currentToken) {
      setStatus(
        "> please complete the verification above, then retry",
        "error"
      );
      return;
    }

    submitBtn.disabled = true;
    setStatus("> sending...", null);

    fetch(form.getAttribute("action"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name,
        email: email,
        message: message,
        company: company,
        turnstileToken: currentToken,
      }),
    })
      .then(function (res) {
        return res
          .json()
          .catch(function (parseErr) {
            console.error(
              "Contact form: response was not valid JSON, status",
              res.status,
              parseErr
            );
            return {};
          })
          .then(function (body) {
            return { ok: res.ok, status: res.status, body: body };
          });
      })
      .then(function (result) {
        if (result.ok && result.body && result.body.status === "success") {
          setStatus(
            "> message sent, thanks, I'll get back to you soon",
            "success"
          );
          form.reset();
        } else {
          console.error(
            "Contact form submission failed, HTTP status",
            result.status,
            "response body:",
            result.body
          );
          setStatus(
            "> " +
              ((result.body && result.body.message) ||
                "something went wrong, please try again"),
            "error"
          );
        }
      })
      .catch(function (err) {
        console.error("Contact form: network/fetch error", err);
        setStatus("> network error, please try again", "error");
      })
      .finally(function () {
        submitBtn.disabled = false;
        resetTurnstile();
      });
  });
})();
