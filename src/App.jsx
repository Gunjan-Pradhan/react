
import { useEffect, useRef, useState } from "react";
import "./App.css";

const WS_URL =
  import.meta.env.VITE_WS_URL || "ws://localhost:1880/ws/energy";

const EMPTY_CIRCUIT = {
  valid: false,
  voltage_V: null,
  current_A: null,
  active_power_W: null,
  active_power_kW: null,
  apparent_power_VA: null,
  reactive_power_var: null,
  energy_kWh: null,
  session_energy_kWh: null,
  reactive_energy_kvarh: null,
  frequency_Hz: null,
  power_factor_meter: null,
  power_factor_calculated: null,
  load_percent: null,
  voltage_min_V: null,
  voltage_max_V: null,
  current_max_A: null,
  peak_power_W: null,
  reading_count: null,
  ok_count: null,
  error_count: null,
  communication_health_percent: null,
  voltage_gain: null,
  current_gain: null,
  power_gain: null,
  operating_hours: null,
  load_hours: null,
  relay_on: false,
  "relay/state": "OFF",
  relay_mode: "MANUAL",
  fault: false,
  over_voltage: false,
  under_voltage: false,
  over_current: false,
  pzem_alarm: false,
  latched_fault: false,
  relay_mismatch: false,
  supply_status: "NO DATA",
};

const SECTIONS = [
  {
    title: "Electrical Parameters",
    items: [
      ["Voltage", "voltage_V", "V", 2],
      ["Current", "current_A", "A", 3],
      ["Frequency", "frequency_Hz", "Hz", 1],
      ["Load", "load_percent", "%", 2],
    ],
  },
  {
    title: "Power Measurements",
    items: [
      ["Active Power", "active_power_W", "W", 2],
      ["Active Power", "active_power_kW", "kW", 4],
      ["Apparent Power", "apparent_power_VA", "VA", 2],
      ["Reactive Power", "reactive_power_var", "var", 2],
    ],
  },
  {
    title: "Power Factor",
    items: [
      ["PZEM Power Factor", "power_factor_meter", "", 3],
      ["Calculated Power Factor", "power_factor_calculated", "", 3],
    ],
  },
  {
    title: "Energy Measurements",
    items: [
      ["Total Active Energy", "energy_kWh", "kWh", 6],
      ["Session Energy", "session_energy_kWh", "kWh", 6],
      ["Reactive Energy", "reactive_energy_kvarh", "kvarh", 6],
    ],
  },
  {
    title: "Statistics",
    items: [
      ["Minimum Voltage", "voltage_min_V", "V", 2],
      ["Maximum Voltage", "voltage_max_V", "V", 2],
      ["Maximum Current", "current_max_A", "A", 3],
      ["Peak Power", "peak_power_W", "W", 2],
    ],
  },
  {
    title: "Communication Statistics",
    items: [
      ["Reading Count", "reading_count", "", 0],
      ["Successful Reads", "ok_count", "", 0],
      ["Failed Reads", "error_count", "", 0],
      ["Communication Health", "communication_health_percent", "%", 1],
    ],
  },
  {
    title: "Calibration Gains",
    items: [
      ["Voltage Gain", "voltage_gain", "", 4],
      ["Current Gain", "current_gain", "", 4],
      ["Power Gain", "power_gain", "", 4],
    ],
  },
  {
    title: "Operating Time",
    items: [
      ["Monitor Operating Time", "operating_hours", "h", 2],
      ["Load Running Time", "load_hours", "h", 2],
    ],
  },
];

const FAULTS = [
  ["Overvoltage", "over_voltage"],
  ["Undervoltage", "under_voltage"],
  ["Overcurrent", "over_current"],
  ["PZEM Alarm", "pzem_alarm"],
  ["Latched Fault", "latched_fault"],
];

function fmt(value, decimals = 2) {
  if (value === null || value === undefined || value === "") {
    return "--";
  }

  const n = Number(value);

  return Number.isFinite(n) ? n.toFixed(decimals) : "--";
}

function Metric({ label, value, unit, decimals }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>
        {fmt(value, decimals)}
        {unit ? ` ${unit}` : ""}
      </strong>
    </div>
  );
}

function CircuitCard({ id, data, connected, sendCommand }) {
  const relayOn =
    data["relay/state"] === "ON" || data.relay_on === true;

  const valid = data.valid === true;
  const fault = data.fault === true;

  return (
    <section className="circuit-card">
      <div className="card-heading">
        <div>
          <p className="eyebrow">SOCKET {id}</p>
          <h2>Circuit {id}</h2>
          <p className="subtext">PZEM-004T Energy Meter</p>
        </div>

        <span className={`badge ${relayOn ? "on" : "off"}`}>
          Relay {relayOn ? "ON" : "OFF"}
        </span>
      </div>

      <div className="status-grid">
        <div className="status-box">
          <span>Meter</span>
          <strong className={valid ? "normal" : "warning"}>
            {valid ? "VALID DATA" : "NO VALID DATA"}
          </strong>
        </div>

        <div className="status-box">
          <span>Supply</span>
          <strong>{data.supply_status || "NO DATA"}</strong>
        </div>

        <div className="status-box">
          <span>Fault</span>
          <strong className={fault ? "fault" : "normal"}>
            {fault ? "FAULT" : "NORMAL"}
          </strong>
        </div>

        <div className="status-box">
          <span>Relay mode</span>
          <strong>{data.relay_mode || "MANUAL"}</strong>
        </div>
      </div>

      {SECTIONS.map((section) => (
        <details
          className="parameter-section"
          key={section.title}
          open
        >
          <summary>{section.title}</summary>

          <div className="metrics">
            {section.items.map(([label, key, unit, decimals]) => (
              <Metric
                key={key}
                label={label}
                value={data[key]}
                unit={unit}
                decimals={decimals}
              />
            ))}
          </div>
        </details>
      ))}

      <details className="parameter-section" open>
        <summary>Protection and Fault Indicators</summary>

        <div className="fault-list">
          {FAULTS.map(([label, key]) => (
            <div className="fault-item" key={key}>
              <span>{label}</span>

              <strong
                className={data[key] === true ? "fault" : "normal"}
              >
                {data[key] === true ? "ACTIVE" : "CLEAR"}
              </strong>
            </div>
          ))}
        </div>
      </details>

      <details className="parameter-section">
        <summary>Relay Wiring Diagnostics</summary>

        <div className="fault-item">
          <span>Relay state</span>
          <strong>{relayOn ? "ON" : "OFF"}</strong>
        </div>

        <div className="fault-item">
          <span>Current while relay OFF</span>
          <strong className={data.relay_mismatch ? "fault" : "normal"}>
            {data.relay_mismatch ? "MISMATCH" : "OK"}
          </strong>
        </div>
      </details>

      <div className="controls">
        <button
          className="on-button"
          disabled={!connected}
          onClick={() => sendCommand(id, "ON")}
        >
          Turn ON
        </button>

        <button
          className="off-button"
          disabled={!connected}
          onClick={() => sendCommand(id, "OFF")}
        >
          Turn OFF
        </button>
      </div>

      <p className="control-note">
        Manual dashboard control. Faults are displayed but do not
        automatically switch the relay.
      </p>
    </section>
  );
}

export default function App() {
  const [telemetry, setTelemetry] = useState({});
  const [connected, setConnected] = useState(false);
  const [connection, setConnection] = useState("Connecting...");

  const socketRef = useRef(null);

  useEffect(() => {
    let disposed = false;
    let retryTimer;

    function connect() {
      if (disposed) return;

      setConnection("Connecting...");

      const ws = new WebSocket(WS_URL);
      socketRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        setConnection("Connected to Node-RED");
      };

      ws.onmessage = (event) => {
        try {
          setTelemetry(JSON.parse(event.data));
        } catch (error) {
          console.error("Invalid telemetry:", error);
        }
      };

      ws.onerror = () => {
        setConnection("Connection error");
      };

      ws.onclose = () => {
        if (socketRef.current === ws) {
          socketRef.current = null;
        }

        setConnected(false);
        setConnection("Disconnected — reconnecting");

        if (!disposed) {
          retryTimer = setTimeout(connect, 3000);
        }
      };
    }

    connect();

    return () => {
      disposed = true;
      clearTimeout(retryTimer);

      const ws = socketRef.current;
      socketRef.current = null;

      if (ws) {
        ws.onclose = null;
        ws.close();
      }
    };
  }, []);

  function sendCommand(circuit, relay) {
    const ws = socketRef.current;

    if (!ws || ws.readyState !== WebSocket.OPEN) {
      alert("Node-RED is not connected.");
      return;
    }

    ws.send(JSON.stringify({ circuit, relay }));
  }

  const c1 = {
    ...EMPTY_CIRCUIT,
    ...(telemetry.circuit1 || {}),
  };

  const c2 = {
    ...EMPTY_CIRCUIT,
    ...(telemetry.circuit2 || {}),
  };

  const bothValid = c1.valid === true && c2.valid === true;

  const totals = [
    ["Combined Active Power", "active_power_W", "W", 2],
    ["Combined Apparent Power", "apparent_power_VA", "VA", 2],
    ["Combined Current", "current_A", "A", 3],
    ["Combined Active Energy", "energy_kWh", "kWh", 6],
  ];

  function sum(key) {
    return (Number(c1[key]) || 0) + (Number(c2[key]) || 0);
  }

  return (
    <main className="dashboard">
      <header className="topbar">
        <div>
          <p className="eyebrow">POWER MANAGEMENT SYSTEM</p>
          <h1>Dual-Circuit Energy Monitor</h1>
          <p className="subtext">
            Electrical measurements, diagnostics and manual relay control
          </p>
        </div>

        <div
          className={`connection ${
            connected ? "online" : "offline"
          }`}
        >
          <span className="status-dot" />
          {connection}
        </div>
      </header>

      <section className="summary-card">
        <h2>Combined Circuit Summary</h2>

        <div className="summary-grid">
          {totals.map(([label, key, unit, decimals]) => (
            <Metric
              key={key}
              label={label}
              value={sum(key)}
              unit={unit}
              decimals={decimals}
            />
          ))}
        </div>

        <p className={bothValid ? "normal" : "warning"}>
          {bothValid
            ? "Both meters have valid readings"
            : "One or both meters have missing or invalid readings"}
        </p>

        <p className="subtext">
          ESP32 uptime: {fmt(telemetry.uptime_s, 0)} seconds
        </p>
      </section>

      <section className="circuit-grid">
        <CircuitCard
          id={1}
          data={c1}
          connected={connected}
          sendCommand={sendCommand}
        />

        <CircuitCard
          id={2}
          data={c2}
          connected={connected}
          sendCommand={sendCommand}
        />
      </section>

      <footer>
        ESP32 WROOM · Dual PZEM-004T · MQTT · Node-RED
      </footer>
    </main>
  );
}
