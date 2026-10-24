# AI4I 2020 Predictive Maintenance Dataset — Audit & Analysis Report

**Generated on:** 2026-10-24T09:45:13.698669+00:00
**Total Records:** 10000
**Total Columns:** 14
**Total Missing Values:** 0

## 1. Class Distribution (Binary Machine Failure)
- Normal Operations (0): 9661 (96.61%)
- Machine Failures (1): 339 (3.39%)
- Severe class imbalance present (~3.39% positive class prevalence).

## 2. Fault Mode Breakdown
| Fault Mode | Description | Occurrences | Rate |
|---|---|---|---|
| TWF | Tool Wear Failure | 46 | 0.46% |
| HDF | Heat Dissipation Failure | 115 | 1.15% |
| PWF | Power Failure | 95 | 0.95% |
| OSF | Overstrain Failure | 98 | 0.98% |
| RNF | Random Failure | 19 | 0.19% |

## 3. Predictor Feature Distributions
| Feature | Min | Max | Mean | Std Dev |
|---|---|---|---|---|
| Air temperature [K] | 295.3 | 304.5 | 300.0 | 2.0 |
| Process temperature [K] | 305.7 | 313.8 | 310.01 | 1.48 |
| Rotational speed [rpm] | 1168.0 | 2886.0 | 1538.78 | 179.28 |
| Torque [Nm] | 3.8 | 76.6 | 39.99 | 9.97 |
| Tool wear [min] | 0.0 | 253.0 | 107.95 | 63.65 |
