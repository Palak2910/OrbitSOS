"use strict";

const normalReadings = {
  power: 98,
  temperature: 24,
  communication: true,
  attitude: 0
};

const readings = { ...normalReadings };
const activeFailures = new Set();
const missionStartedAt = Date.now();

const elements = {
  powerValue: document.getElementById("power-value"),
  powerBar: document.getElementById("power-bar"),
  temperatureValue: document.getElementById("temperature-value"),
  temperatureBar: document.getElementById("temperature-bar"),
  communicationValue: document.getElementById("communication-value"),
  communicationBar: document.getElementById("communication-bar"),
  attitudeValue: document.getElementById("attitude-value"),
  attitudeMarker: document.getElementById("attitude-marker"),
  alertBox: document.getElementById("alert-box"),
  alertIcon: document.getElementById("alert-icon"),
  alertMessage: document.getElementById("alert-message"),
  orbitStatus: document.getElementById("orbit-status"),
  altitudeValue: document.getElementById("altitude-value"),
  velocityValue: document.getElementById("velocity-value"),
  missionClock: document.getElementById("mission-clock")
};

const failureDetails = {
  power: {
    power: 12,
    message: "Power failure: battery reserve is critically low."
  },
  temperature: {
    temperature: 86,
    message: "Overheating: core temperature is above safe limits."
  },
  communication: {
    communication: false,
    message: "Signal loss: ground communication is offline."
  },
  attitude: {
    attitude: 72,
    message: "Attitude drift: spacecraft orientation is unstable."
  }
};

function setBarState(valueElement, barElement, value, warningAt, dangerAt, reversed) {
  const warning = reversed ? value >= warningAt : value <= warningAt;
  const danger = reversed ? value >= dangerAt : value <= dangerAt;
  const level = danger ? "danger" : warning ? "warning" : "";
  valueElement.className = "system-value" + (level ? " " + level : "");
  barElement.className = "bar-fill" + (level ? " " + level : "");
}

function updateSystemReadings() {
  elements.powerValue.textContent = readings.power + "%";
  elements.powerBar.style.width = readings.power + "%";
  setBarState(elements.powerValue, elements.powerBar, readings.power, 60, 20, false);

  elements.temperatureValue.textContent = readings.temperature + " °C";
  elements.temperatureBar.style.width = readings.temperature + "%";
  setBarState(elements.temperatureValue, elements.temperatureBar, readings.temperature, 45, 70, true);

  elements.communicationValue.textContent = readings.communication ? "CONNECTED" : "OFFLINE";
  elements.communicationValue.className = "system-value" + (readings.communication ? "" : " danger");
  elements.communicationBar.classList.toggle("offline", !readings.communication);
  elements.communicationBar.setAttribute(
    "aria-label",
    readings.communication ? "Signal strength: strong" : "Signal strength: no signal"
  );

  elements.attitudeValue.textContent = readings.attitude === 0
    ? "STABLE"
    : (readings.attitude > 0 ? "+" : "") + readings.attitude + "° DRIFT";
  elements.attitudeValue.className = "system-value" + (readings.attitude === 0 ? "" : " danger");
  elements.attitudeMarker.style.left = (50 + readings.attitude / 3.6) + "%";
}

function updateAlert() {
  const activeDetails = Array.from(activeFailures, function (failure) {
    return failureDetails[failure];
  });

  if (activeDetails.length === 0) {
    elements.alertMessage.textContent = "All spacecraft systems are nominal. Ready for mission.";
    elements.alertIcon.textContent = "✓";
    elements.alertBox.className = "alert-box";
    elements.orbitStatus.textContent = "NOMINAL";
    elements.orbitStatus.className = "orbit-status";
  } else {
    const names = Array.from(activeFailures, function (failure) {
      return failure.replace(/^./, function (letter) { return letter.toUpperCase(); });
    });
    elements.alertMessage.textContent = activeDetails.map(function (detail) {
      return detail.message;
    }).join(" ");
    elements.alertIcon.textContent = "!";
    elements.alertBox.className = "alert-box danger";
    elements.orbitStatus.textContent = names.length + (names.length === 1 ? " FAULT" : " FAULTS");
    elements.orbitStatus.className = "orbit-status danger";
  }

  document.querySelectorAll("[data-failure]").forEach(function (button) {
    button.setAttribute("aria-pressed", String(activeFailures.has(button.dataset.failure)));
  });
}

function applyFailure(failure) {
  const detail = failureDetails[failure];
  if (!detail) return;

  activeFailures.add(failure);
  Object.assign(readings, detail);
  updateSystemReadings();
  updateAlert();
}

function resetSimulation() {
  Object.assign(readings, normalReadings);
  activeFailures.clear();
  updateSystemReadings();
  updateAlert();
}

function updateLiveTelemetry() {
  const elapsedSeconds = (Date.now() - missionStartedAt) / 1000;
  const altitude = 548.2 + Math.sin(elapsedSeconds / 11) * 1.8;
  const velocity = 7.6 + Math.sin(elapsedSeconds / 15) * 0.04;
  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = Math.floor(elapsedSeconds % 60);

  elements.altitudeValue.textContent = altitude.toFixed(1);
  elements.velocityValue.textContent = velocity.toFixed(2);
  elements.missionClock.textContent = [hours, minutes, seconds]
    .map(function (part) { return String(part).padStart(2, "0"); })
    .join(":");
}

document.querySelectorAll("[data-failure]").forEach(function (button) {
  button.addEventListener("click", function () {
    applyFailure(button.dataset.failure);
  });
});

document.getElementById("reset-button").addEventListener("click", resetSimulation);

updateSystemReadings();
updateAlert();
updateLiveTelemetry();
window.setInterval(updateLiveTelemetry, 1000);