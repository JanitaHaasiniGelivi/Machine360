# MachineMind 360 — Live Interactive Demonstration Walkthrough

This guide details the complete end-to-end user journey matching the **Final Acceptance Test Specification**.

---

## 1. Start the Application Locally

Run the macOS launcher:
```bash
./scripts/run_mac.sh
```
(Or on Windows: `.\scripts\run_windows.ps1`).

Open your browser to:
**http://localhost:5173**

---

## 2. Factory Command Center Dashboard
- When the application opens, observe the **Modern Industrial Command Center** visual styling.
- Review the KPI summary cards: Total Machinery (5 assets), Active Risk Alerts, Open Work Orders, and AI Diagnostic Accuracy (98.2% / 0.962 ROC-AUC).
- View the **Detected Fault Modes** bar chart and **Recent Machine Observations** table.

---

## 3. Register a New Machine Asset
1. In the sidebar, click **Machines**.
2. Click **+ Register Asset** in the top right.
3. Fill in:
   - **Machine Name:** `Automated 5-Axis Gantry Mill #6`
   - **Criticality:** `Critical`
   - **Department:** `Aerospace Milling Cell`
   - **Manufacturer:** `DMG MORI`
4. Click **Save Asset**.
5. Locate the newly registered asset card in the grid.
6. Click the **QR Code** icon to view the generated industrial inspection tag.

---

## 4. Execute Real-Time AI Prediction
1. In the sidebar, click **AI Prediction**.
2. Select your newly created machine from the **Target Machinery** dropdown.
3. In the quick presets bar at the top, click **TWF Wear** (or manually input: Air Temp `299 K`, Process Temp `309.2 K`, Speed `1390 RPM`, Torque `54 Nm`, Tool Wear `225 min`).
4. Click **Execute ML Inference**.
5. Observe the live results returned by the backend:
   - **Status:** `MACHINE FAILURE PREDICTED`
   - **Risk Level:** `CRITICAL` (Probability ~75% - 85%)
   - **Derived Spindle Power:** `7,862 W` (calculated via $\frac{\text{Torque} \times 2\pi \times \text{RPM}}{60}$)
   - **Temperature Delta:** `10.2 K`
   - **5 Fault Modes:** Observe `TWF` (Tool Wear Failure) is flagged with high probability.
   - **Explainability:** Feature importance attribution bars highlighting Tool Wear as risk-increasing.
   - **Technician Checklist:** Recommended action steps to replace cutter head.

---

## 5. Explore in What-If Simulator
1. From the prediction results card, click **Open in What-If Simulator**.
2. Notice the current telemetry is loaded as the baseline on the left.
3. Drag the **Tool Wear Time** slider down from `225 min` to `20 min` (simulating cutter insert replacement).
4. Watch the live debounced inference result on the right:
   - Failure probability drops dramatically from `>75%` down to `<5%` (`NORMAL`).
   - Probability Delta shows **-70% to -80% risk reduction**.

---

## 6. Inspect 2D Digital Twin
1. In the sidebar, click **Digital Twin**.
2. Observe the interactive 2D schematic of the CNC spindle assembly.
3. Notice the spindle rotation animation syncing with the RPM speed.
4. Click the **Cutter Tool** or **Drive Motor** to inspect subsystem telemetry.
5. Move the sliders to observe thermal and mechanical changes in real time.

---

## 7. Create a Database-Backed Maintenance Work Order
1. Return to **AI Prediction** and click **Create Maintenance Ticket**.
2. The work order is automatically linked to the machine and prediction record.
3. Go to **Maintenance** in the sidebar.
4. Locate the ticket in the table (e.g. `TCK-1002`).
5. Change its status dropdown from `Open` to `In Progress`.
6. Click **View Details** and submit an action note (e.g., *"Inspected spindle tool inserts; scheduled replacement."*).

---

## 8. Confirm Database Persistence (Browser Refresh Test)
1. Press `Cmd + R` (or `F5`) in your browser to hard-refresh the page.
2. Return to **Maintenance**.
3. Confirm your ticket and updated status (`In Progress`) are still fully preserved in the SQLite/PostgreSQL database!
4. Navigate to **Machines** and verify your registered machine remains in the registry.

---

## 9. Batch Process CSV Sensor Logs
1. Click **Batch Analysis** in the sidebar.
2. Click **Download CSV Template** to obtain a formatted AI4I telemetry CSV.
3. Drag and drop the downloaded CSV into the drop zone.
4. Click **Execute Batch Analysis**.
5. Review the row-by-row risk predictions and fault flags, and click **Export Results CSV**.

---

## 10. AI Maintenance Copilot & Audit Report Export
1. Click **AI Copilot** and ask: *"Explain HDF failure mode and give me the inspection checklist"*.
2. Review the physics-guided reply and step-by-step checklist.
3. Click **Reports** in the sidebar to view the formal plant audit document.
4. Click **Print / Save as PDF** to generate an executive inspection audit report.
