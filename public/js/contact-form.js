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
      },
      "error-callback": function () {
        currentToken = null;
        setStatus(
          "> verification widget failed to load, please refresh",
          "error"
        );
      },
      "expired-callback": function () {
        currentToken = null;
      },
      "timeout-callback": function () {
        currentToken = null;
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
          .catch(function () {
            return {};
          })
          .then(function (body) {
            return { ok: res.ok, body: body };
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
          setStatus(
            "> " +
              ((result.body && result.body.message) ||
                "something went wrong, please try again"),
            "error"
          );
        }
      })
      .catch(function () {
        setStatus("> network error, please try again", "error");
      })
      .finally(function () {
        submitBtn.disabled = false;
        resetTurnstile();
      });
  });
})();
