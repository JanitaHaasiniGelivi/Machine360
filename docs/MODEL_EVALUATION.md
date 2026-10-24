# MachineMind 360 — Model Evaluation & Validation Benchmark

## 1. Evaluation Methodology
- **Dataset Partitioning:** Stratified 80/20 train/test split (8,000 training observations, 2,000 held-out test observations).
- **Leakage Prevention:** Target columns (`Machine failure`, `TWF`, `HDF`, `PWF`, `OSF`, `RNF`) and identifiers (`UDI`, `Product ID`) strictly excluded from input predictors.
- **Cross-Validation:** 5-fold Stratified Cross-Validation on the training fold only.
- **Decision Threshold:** Optimized via precision-recall trade-off to **0.5139** to prevent excessive false alarms in continuous production.

## 2. Champion Model (Random Forest Classifier) Held-Out Results

Tested on 2,000 unseen operational observations:

| Metric | Score | Industrial Interpretation |
|---|---|---|
| **Accuracy** | **98.20%** | Overall correct operational classifications |
| **Precision** | **78.57%** | Low false positive alarm frequency |
| **Recall** | **64.71%** | True machine failure detection sensitivity |
| **F1 Score** | **0.7097** | Balanced performance on 3.4% imbalanced class |
| **ROC-AUC** | **0.9620** | High discrimination between safe and failing operations |
| **PR-AUC** | **0.7198** | Area under precision-recall curve on positive class |
| **5-Fold CV ROC-AUC**| **0.9706 ± 0.0104** | Cross-validation stability on training data |

### Held-Out Confusion Matrix (2,000 Samples)

| Actual State \ Predicted | Predicted Normal (0) | Predicted Failure (1) | Total |
|---|---|---|---|
| **Actual Normal (0)** | **1,920** (True Negative) | **12** (False Positive) | 1,932 |
| **Actual Failure (1)** | **24** (False Negative) | **44** (True Positive) | 68 |

## 3. Champion vs. Baseline Benchmark

| Model | ROC-AUC | F1 Score | Notes |
|---|---|---|---|
| **Logistic Regression (Baseline)** | 0.9070 | 0.2419 | Linear model; fails to capture non-linear power curve $P = \tau \times \omega$ |
| **Random Forest (Champion)** | **0.9620** | **0.7097** | 200 trees, balanced subsample, max depth 12; captures thermal/wear interactions |

## 4. Feature Importance Hierarchy

1. **Torque [Nm]:** 35.2%
2. **Tool wear [min]:** 23.4%
3. **Rotational speed [rpm]:** 18.9%
4. **Process temperature [K]:** 10.4%
5. **Air temperature [K]:** 8.8%
6. **Type (L/M/H):** 3.3%

## 5. Fault-Specific Independent Classifiers

| Fault Mode | Full Description | ROC-AUC | F1 Score | Test Positives |
|---|---|---|---|---|
| **TWF** | Tool Wear Failure | 0.9586 | 0.0968 | 9 |
| **HDF** | Heat Dissipation Failure | 0.9712 | 0.6897 | 23 |
| **PWF** | Power Failure | 0.9974 | 0.7234 | 19 |
| **OSF** | Overstrain Failure | 0.9875 | 0.4800 | 20 |
| **RNF** | Random Failure | 0.6349 | 0.0000 | 4 |

*(Note: Random Failure occurs stochastically without operational parameter correlation, reflected truthfully in its evaluation metric).*
