# MachineMind 360 — Model Evaluation & Validation Report

**Model Version:** 1.0.0
**Trained At:** 2026-10-24T09:45:15.788684+00:00
**Primary Algorithm:** Random Forest Classifier (Champion) vs. Logistic Regression (Baseline)
**Selected Decision Threshold:** 0.5139

## 1. Held-Out Test Set Metrics (2,000 observations)
- **Accuracy:** 98.20%
- **Precision:** 78.57%
- **Recall:** 64.71%
- **F1 Score:** 0.7097
- **ROC-AUC:** 0.9620
- **PR-AUC:** 0.7198
- **5-Fold Cross-Validation ROC-AUC:** 0.9706 ± 0.0104

## 2. Confusion Matrix
| Metric | Predicted Normal (0) | Predicted Failure (1) |
|---|---|---|
| **Actual Normal (0)** | 1920 (TN) | 12 (FP) |
| **Actual Failure (1)** | 24 (FN) | 44 (TP) |

## 3. Baseline Model Comparison
| Model | ROC-AUC | F1 Score | Notes |
|---|---|---|---|
| Logistic Regression (Baseline) | 0.9070 | 0.2419 | Balanced class weighting |
| Random Forest Classifier (Champion) | 0.9620 | 0.7097 | Non-linear feature interactions |

## 4. Feature Importance Hierarchy
- **Rotational speed [rpm]:** 30.61%
- **Torque [Nm]:** 29.67%
- **Tool wear [min]:** 20.38%
- **Air temperature [K]:** 10.26%
- **Process temperature [K]:** 7.08%
- **Type_L:** 0.91%
- **Type_M:** 0.65%
- **Type_H:** 0.45%

## 5. Fault Mode Models Performance
| Fault Mode | ROC-AUC | F1 Score | Test Positives |
|---|---|---|---|
| TWF | 0.9586 | 0.0968 | 9 |
| HDF | 0.9712 | 0.6897 | 23 |
| PWF | 0.9974 | 0.7234 | 19 |
| OSF | 0.9875 | 0.48 | 20 |
| RNF | 0.6349 | 0.0 | 4 |
