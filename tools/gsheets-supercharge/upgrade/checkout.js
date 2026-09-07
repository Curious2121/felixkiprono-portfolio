(function () {
  "use strict";

  var backend = "https://africa-south1-gsheets-supercharge.cloudfunctions.net";
  var container = document.getElementById("paypal-button-container");
  var status = document.getElementById("checkout-status");
  var price = document.getElementById("checkout-price");

  function setStatus(message, kind) {
    status.textContent = message;
    status.className = "checkout-status" + (kind ? " " + kind : "");
  }

  function fail(message) {
    container.replaceChildren();
    setStatus(message, "error");
  }

  function loadPayPal(clientId) {
    return new Promise(function (resolve, reject) {
      var script = document.createElement("script");
      var params = new URLSearchParams({
        "client-id": clientId,
        components: "buttons",
        vault: "true",
        intent: "subscription",
        currency: "USD"
      });
      script.src = "https://www.paypal.com/sdk/js?" + params.toString();
      script.async = true;
      script.onload = resolve;
      script.onerror = function () { reject(new Error("PayPal checkout could not load.")); };
      document.head.appendChild(script);
    });
  }

  async function start() {
    var token = new URLSearchParams(window.location.search).get("token") || "";
    if (token.length < 32 || token.length > 200) {
      fail("Open the Upgrade link from inside GSheets Supercharge to start a secure checkout.");
      return;
    }

    var response;
    try {
      response = await fetch(backend + "/checkoutConfig?token=" + encodeURIComponent(token), {
        method: "GET",
        mode: "cors",
        cache: "no-store",
        credentials: "omit",
        referrerPolicy: "no-referrer",
        headers: { Accept: "application/json" }
      });
    } catch (_error) {
      fail("The checkout service could not be reached. Please return to the add-on and try again.");
      return;
    }

    var config = {};
    try {
      config = await response.json();
    } catch (_error) {
      fail("The checkout service returned an invalid response. Please try again.");
      return;
    }

    if (!response.ok) {
      fail(config.error || "This upgrade link is invalid or has expired.");
      return;
    }
    if (!config.clientId || !config.planId || config.customId !== token) {
      fail("The checkout configuration is incomplete. Please contact support.");
      return;
    }

    if (config.price && config.price.amount) {
      price.textContent = "$" + String(config.price.amount);
    }

    try {
      await loadPayPal(String(config.clientId));
    } catch (error) {
      fail(error instanceof Error ? error.message : "PayPal checkout could not load.");
      return;
    }

    if (!window.paypal || typeof window.paypal.Buttons !== "function") {
      fail("PayPal checkout is unavailable. Please try again later.");
      return;
    }

    setStatus("Choose PayPal below to authorize the USD 5 monthly subscription.");
    window.paypal.Buttons({
      style: { layout: "vertical", shape: "rect", label: "subscribe", height: 44 },
      createSubscription: function (_data, actions) {
        return actions.subscription.create({
          plan_id: String(config.planId),
          custom_id: token
        });
      },
      onApprove: function (data) {
        var reference = data && data.subscriptionID ? " Reference: " + data.subscriptionID + "." : "";
        container.replaceChildren();
        setStatus("Subscription approved. Return to GSheets Supercharge and refresh your access status." + reference, "success");
      },
      onCancel: function () {
        setStatus("Checkout was cancelled. You have not completed the subscription.");
      },
      onError: function () {
        fail("PayPal could not complete checkout. Please return to the add-on and create a new upgrade link.");
      }
    }).render("#paypal-button-container").catch(function () {
      fail("PayPal checkout could not be displayed. Please try again.");
    });
  }

  start();
})();
