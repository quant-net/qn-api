# Quant-Net API

Web dashboard and REST API for the **Quant-Net** quantum networking platform. Provides real-time monitoring of network agents, experiment management, calibration tracking, and topology visualization through a browser-based interface backed by a FastAPI server.

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Python | ≥ 3.10 | API server runtime |
| Node.js | ≥ 18 | JavaScript bundling (development only) |
| MongoDB | ≥ 6.0 | Data persistence (via `quantnet-mq`) |
| MQTT Broker | Mosquitto or compatible | Real-time messaging with WebSocket support |

## Quick Start

```bash
# 1. Install Python dependencies
pip install -r requirements.txt

# 2. Install JS build tools and bundle the frontend
npm install
npm run build

# 3. Start the server
python main.py
```

The dashboard is available at **http://localhost:8081**.

## Configuration

The server reads its configuration from a `quantnet.cfg` INI file. It searches the following paths in order:

1. `${QUANTNET_HOME}/etc/quantnet.cfg`
2. `${VIRTUAL_ENV}/etc/quantnet.cfg`
3. `/opt/quantnet/etc/quantnet.cfg`

If no configuration file is found, the server starts with default values.

### Configuration File Format

```ini
[mq]
host = 127.0.0.1          # MQTT broker host
port = 1883                # MQTT broker port
ws_host = 127.0.0.1        # MQTT WebSocket host (for browser connections)
ws_port = 8080              # MQTT WebSocket port
mongo_host = 127.0.0.1     # MongoDB host
mongo_port = 27017          # MongoDB port
rpc_server_topic = ...     # RPC server topic (optional)
rpc_client_topic = ...     # RPC client topic (optional)
path = ...                 # MQTT path prefix (optional)

[main]
request_types = spgRequest,egpRequest,bsmRequest   # Known experiment request types

[schemas]
path = /path/to/schemas    # JSON schema directory (optional)
```

### Configuration Parameters

| Section | Key | Default | Description |
|---------|-----|---------|-------------|
| `mq` | `host` | `127.0.0.1` | MQTT broker hostname |
| `mq` | `port` | `1883` | MQTT broker port |
| `mq` | `ws_host` | `127.0.0.1` | WebSocket host for browser MQTT connections |
| `mq` | `ws_port` | `8080` | WebSocket port for browser MQTT connections |
| `mq` | `mongo_host` | `127.0.0.1` | MongoDB hostname |
| `mq` | `mongo_port` | `27017` | MongoDB port |
| `mq` | `rpc_server_topic` | — | AMQP/MQTT topic for RPC server |
| `mq` | `rpc_client_topic` | — | AMQP/MQTT topic for RPC client |
| `mq` | `path` | — | MQTT path prefix |
| `main` | `request_types` | `spgRequest, egpRequest, bsmRequest` | Comma-separated list of known experiment request types |
| `schemas` | `path` | — | Path to JSON schema files for validation |

## Server Options

```
python main.py [--host HOST] [--port PORT]
```

| Flag | Default | Description |
|------|---------|-------------|
| `--host` | `0.0.0.0` | Network interface to bind |
| `--port` | `8081` | HTTP port for the dashboard and API |

The server runs with **auto-reload** enabled by default (via uvicorn).

## JavaScript Build

The frontend is bundled with [esbuild](https://esbuild.github.io/) from ES module source files into a single minified bundle.

### Build Commands

```bash
npm run build    # Production build — minified with source map
npm run watch    # Development — auto-rebuild on file changes
```

### Build Output

```
static/js/dist/bundle.min.js        # Minified application bundle (~57kb)
static/js/dist/bundle.min.js.map    # Source map for debugging
```

> **Important:** The JS bundle must be built before starting the server. The `static/js/dist/` directory is git-ignored, so `npm run build` must be run after cloning the repository.

### Source Structure

```
static/js/
├── main.js                          # esbuild entry point
├── app.js                           # App bootstrap class
├── core/
│   ├── EventBus.js                  # Pub/sub event system
│   ├── ApiClient.js                 # REST API client
│   └── MqttClient.js               # MQTT WebSocket client
├── utils/
│   └── formatters.js                # UI helpers and HTML formatters
├── models/
│   ├── AgentStore.js                # Agent state management
│   ├── CalibrationStore.js          # Calibration data store
│   └── ExperimentStore.js           # Experiment data store
├── components/
│   ├── AgentTable.js                # Agent table with heartbeat tracking
│   ├── CalibrationTable.js          # Calibration results table
│   ├── ExperimentTable.js           # Experiment results table
│   ├── DebugPanel.js                # MQTT message debug panel
│   ├── TopologyGraph.js             # vis.js network topology
│   ├── modals/
│   │   ├── AgentModal.js            # Agent details and calibration viewer
│   │   ├── CalibrationDetailsModal.js
│   │   ├── CalibrationFormModal.js   # Calibration submission form
│   │   ├── EgpModal.js              # Entanglement generation form
│   │   ├── ExperimentModal.js       # Experiment details viewer
│   │   ├── PingModal.js             # Agent ping form
│   │   └── SpgModal.js              # Single photon / BSM experiment form
│   └── charts/
│       ├── BsmChart.js              # BSM tracking scatter chart
│       ├── CalibrationChart.js      # Per-task calibration charts
│       ├── DataChart.js             # Time-series data chart
│       ├── HistogramChart.js        # Normal distribution histogram
│       ├── HomChart.js              # HOM coincidence chart
│       ├── PolTrackingChart.js      # Polarization tracking chart
│       └── TimeTaggerChart.js       # Wavepacket and collection rate charts
└── (vendor libs)                    # bootstrap, chart.js, vis-network, paho-mqtt
```

## REST API

The API is mounted at `/api` and documented via OpenAPI. When the server is running, interactive docs are available at:

- **Swagger UI:** http://localhost:8081/docs
- **ReDoc:** http://localhost:8081/redoc

### Key Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/node` | List all agents or get a specific agent by ID |
| `GET` | `/api/topology` | Get the network topology graph |
| `POST` | `/api/pingpong` | Send ping requests to remote agents |
| `POST` | `/api/calibrate` | Start a calibration process |
| `GET` | `/api/calibration` | Get calibration results |
| `GET` | `/api/experiments` | List experiments with optional filters |
| `GET` | `/api/tasks` | Get agent task results |
| `POST` | `/api/bsm` | Start a BSM experiment |
| `POST` | `/api/spg` | Start single photon generation |
| `POST` | `/api/egp` | Start entanglement generation |

## Authentication

The dashboard supports optional cookie-based authentication via `fastapi-login`. Default credentials:

| Username | Password |
|----------|----------|
| `admin` | `admin` |

- **`/`** — Public dashboard (no login required)
- **`/private`** — Authenticated dashboard
- **`/login`** — POST login form
- **`/logout`** — Clear session

## Docker

```bash
DOCKER_BUILDKIT=1 docker build \
  --secret id=GH_TOKEN,src=<(echo $GH_TOKEN) \
  -f docker/Dockerfile .
```

The Docker image clones the required private repositories (`quant-net-mq`, `quant-net-plugins`, `quant-net-server`) during build using a GitHub token. The container runs `python main.py` as its entrypoint.

### Environment Variables

| Variable | Description |
|----------|-------------|
| `QUANTNET_HOME` | Base directory for configuration files |
| `QUANTNET_ENTRYPOINT_DELAY` | Seconds to wait before starting (for dependency readiness) |
| `QUANTNET_ENTRYPOINT_QUIET_LOGS` | Suppress entrypoint log messages |

## License

See [LICENSE](LICENSE) and [COPYRIGHT](COPYRIGHT).
