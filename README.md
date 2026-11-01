Knowledge-Driven IoT-Based Fault Diagnosis System
Platform: macOS Apple Silicon Python: 3.10+ ESP32: PlatformIO Node-RED: Automation License: MIT

An enterprise-grade, cyber-physical industrial monitoring system for a 12V DC motor asset, built across six progressive engineering layers: from synthetic physics simulation, TLS cloud MQTT, and persistent SQLite database, through Node-RED automation, knowledge-driven AI/ML hybrid diagnosis, and non-blocking ESP32 edge firmware with physical alarm actuation.

# Run all 22 automated tests
./.venv/bin/pytest tests/ -v
📂 Repository Layout
knowledge-driven-iot/
├── README.md                      # Primary project overview and instructions
├── IMPLEMENTATION_PLAN.md         # Layer-by-layer architectural plan
├── PROJECT_STATUS.md              # Detailed verification status report
├── .env.example                   # Environment configuration template
├── requirements.txt               # Pinned Python package dependencies
├── pyproject.toml                 # Pytest configuration
├── docker-compose.yml             # Docker stack for Mosquitto, Node-RED, Backend, UI
│
├── config/
│   ├── settings.py                # Strongly-typed environment settings
│   ├── thresholds.yaml            # Operational engineering thresholds
│   ├── devices.yaml               # Motor asset hardware specification
│   └── knowledge_base.yaml        # Declarative physics rule hypotheses
│
├── simulation/
│   ├── synthetic_generator.py     # 7-scenario physics telemetry generator
│   ├── mqtt_publisher.py          # Standalone Paho MQTT publisher
│   └── scenarios.py               # Operational regime parameter profiles
│
├── ingestion/
│   ├── mqtt_subscriber.py         # Authoritative ingestion & diagnosis consumer
│   ├── mqtt_client.py             # Managed client with TLS & exponential backoff
│   ├── csv_logger.py              # Thread-safe Layer 1 CSV persistence
│   └── data_validator.py          # Schema validation & deduplication cache
│
├── database/
│   ├── models.py                  # SQLite DDL schema (WAL mode, indexes)
│   ├── connection.py              # Thread-safe SQLite connection context manager
│   ├── repository.py              # Authoritative persistence repository
│   └── migrations/                # Versioned SQL migrations & runner
│
├── backend/
│   ├── main.py                    # FastAPI REST application
│   └── auth/security.py           # Salted PBKDF2 authentication & sessions
│
├── diagnosis/
│   ├── rule_engine.py             # Declarative YAML physics rule evaluator
│   ├── hybrid_engine.py           # Consensus reconciler (Rules + ML)
│   ├── recommendations.py         # Prescriptive maintenance action mapper
│   └── knowledge_base.py          # Knowledge base query & inspection interface
│
├── ml/
│   ├── train.py                   # Model training pipeline (Random Forest)
│   ├── predict.py                 # Real-time inference engine with rolling features
│   ├── evaluate.py                # Detailed tabular metric & confusion matrix evaluator
│   ├── features.py                # Rolling temporal feature engineering
│   └── models/                    # Saved .joblib model bundle & metrics
│
├── dashboard/
│   ├── app.py                     # Multi-page Streamlit portal with authentication
│   ├── pages/                     # 7 functional monitoring & diagnostics pages
│   ├── components/charts.py       # High-performance Plotly time-series visualizers
│   └── styles/theme.css           # Industrial dark charcoal UI theme
│
├── nodered/
│   ├── flows.json                 # Importable Node-RED automation workflow
│   ├── package.json               # Node-RED dependencies
│   └── README.md                  # Node-RED setup & hysteresis guide
│
├── firmware/esp32_motor_monitor/
│   ├── platformio.ini             # PlatformIO build configuration for ESP32
│   ├── src/main.cpp               # C++ firmware (RMS vibe, temp, current, RPM, alerts)
│   ├── include/config.h           # Firmware constants, pins, and calibration
│   └── README.md                  # Build, flash & calibration guide
│
├── tests/                         # Pytest automated test suites
├── scripts/                       # Executable launch & verification scripts
└── docs/                          # In-depth technical & academic documentation
📄 Academic Documentation
System Architecture
Layer 1 Guide
Layer 2 Guide
Layer 3 Guide
Layer 4 Guide
Layer 5 Guide
Layer 6 Guide
Hardware Wiring & Electrical Safety
REST API Specifications
Testing Methodology
Troubleshooting & Recovery
Final Engineering Project Report
Dashboard:https://knowledge-driven-io-t-fault-diagons.vercel.app/
<img width="1845" height="812" alt="image" src="https://github.com/user-attachments/assets/bb1c1d73-8287-4a83-8d3e-5ba5a9bf3cdb" />
<img width="1910" height="754" alt="image" src="https://github.com/user-attachments/assets/f80e4b8e-0b27-42a0-83b0-fec9a89845b5" />
<img width="1910" height="813" alt="image" src="https://github.com/user-attachments/assets/89f6ea3e-0572-4a65-881b-9f83bba2952e" />

