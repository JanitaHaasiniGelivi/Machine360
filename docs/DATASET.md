# AI4I 2020 Predictive Maintenance Dataset — Specification & Validation

## 1. Official Dataset Reference
- **Dataset Name:** AI4I 2020 Predictive Maintenance Dataset
- **Repository:** UC Irvine Machine Learning Repository (Dataset ID: 601)
- **Official URL:** https://archive.ics.uci.edu/dataset/601/ai4i+2020+predictive+maintenance+dataset
- **Source File:** `ml/data/ai4i2020.csv`
- **Total Records:** 10,000 synthetic operational observations
- **Total Columns:** 14 columns

## 2. Verified Schema & Units

| Column Name | Type | Physical Unit | Description / Range | Predictor Role |
|---|---|---|---|---|
| `UDI` | Integer | — | Unique observation index (1 to 10,000) | **Excluded** (Identifier) |
| `Product ID` | String | — | Serial tag (e.g. L47181, M14860) | **Excluded** (Identifier) |
| `Type` | Categorical | — | Quality variant: L (50%), M (30%), H (20%) | **Model Predictor** |
| `Air temperature [K]` | Float | Kelvin [K] | Ambient air intake temp (295.3 – 304.5 K) | **Model Predictor** |
| `Process temperature [K]`| Float | Kelvin [K] | Spindle process temp (305.7 – 313.8 K) | **Model Predictor** |
| `Rotational speed [rpm]` | Integer | RPM | Spindle angular velocity (1,168 – 2,886 rpm) | **Model Predictor** |
| `Torque [Nm]` | Float | Newton-meters | Spindle resistance torque (3.8 – 76.6 Nm) | **Model Predictor** |
| `Tool wear [min]` | Integer | Minutes | Cumulative cutting insert wear (0 – 253 min) | **Model Predictor** |
| `Machine failure` | Binary (0/1) | — | Primary binary failure label (339 positive, 3.39%) | **Binary Target** |
| `TWF` | Binary (0/1) | — | Tool Wear Failure label (46 occurrences, 0.46%) | **Fault Target** |
| `HDF` | Binary (0/1) | — | Heat Dissipation Failure label (115 occurrences, 1.15%) | **Fault Target** |
| `PWF` | Binary (0/1) | — | Power Failure label (95 occurrences, 0.95%) | **Fault Target** |
| `OSF` | Binary (0/1) | — | Overstrain Failure label (98 occurrences, 0.98%) | **Fault Target** |
| `RNF` | Binary (0/1) | — | Random Failure label (19 occurrences, 0.19%) | **Fault Target** |

## 3. Strict Scientific Limitations Notice

The AI4I 2020 dataset does **not** contain:
- Measured high-frequency vibration signals (accelerometers)
- Acoustic emissions or audio recordings
- Infrared or optical thermal camera images
- Time-series timestamps or calendar maintenance histories
- Time-to-failure or Remaining Useful Life (RUL) regression targets

MachineMind 360 strictly adheres to these boundaries. It does not fabricate sensor streams or unsupported RUL timelines. All physical attributes (mechanical power and temperature delta) are derived transparently from genuine dataset variables.
