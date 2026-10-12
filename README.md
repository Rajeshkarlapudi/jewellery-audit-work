# Jewellery Sales & Ledger Audit System (HAA Enterprise Audit Suite)

An enterprise-grade, automated **Jewellery Sales & Ledger Audit System** designed to process large Excel ledger workbooks, perform real-time verification against product Rate Masters and Account-Product Mappings, enforce mathematical rate deviation and UOM rules, and generate multi-format audit reports (Excel, CSV, PDF).

---

## 1. BUSINESS PROBLEM & OBJECTIVE

Jewellery retailers and distributors process thousands of high-value ledger transactions daily involving gold, silver, diamonds, gemstones, and pearls. Manual ledger scrutiny is prone to human error, missed rate anomalies, and incorrect sales account entries.

This application automates ledger verification by:

1. **Verifying Sales Account vs Product Combinations** to detect ledger misclassifications.
2. **Validating Units of Measure (UOM)** (GRAMS vs CARATS) according to category guidelines.
3. **Calculating Rate Deviations** with category-specific mathematical formulas (Gold/Silver ±15%, Gemstones ±15%, Diamond +25% uplift and ±15% deviation).
4. **Aggregating Audit Intelligence Metrics** (Compliance %, Total Rows, Error Rows, Mismatches, Range Deviations, Invalid UOM).
5. **Exporting Dynamic Audit Reports** in Excel (`.xlsx`), CSV (`.csv`), and PDF formats.

---

## 2. KEY FEATURES & WORKFLOW

- **Excel & Ledger Processing Engine**: Accepts Excel files (`.xlsx`, `.xls`, `.xlsm`) and CSV files. The header row is auto-detected (title rows above it are ignored).
- **Dynamic Rule Book Ranges**: Configurable **Gold & Silver Rates** screen allowing auditors to set min/max benchmark rates per product.
- **Audit Intelligence Engine**: Multi-stage progress visualizer with step-by-step workbook loading, header detection, record parsing, rule execution, and report generation.
- **Interactive KPI Cards**: Clickable summary metrics (`Total Rows`, `Error Rows`, `Sales Ledger Mismatch`, `Range Deviations`, `Invalid UOM`, `Compliance %`) that filter the exception report table dynamically.
- **Multi-Format Export Service**: Real file generation for Excel, CSV, and PDF audit exception reports with executive summary tables.
- **Virtualized High-Performance Table**: Paginated 23-column exception report data table supporting search and sorting across tens of thousands of rows.

---

## 3. AUDIT VALIDATION RULES

### A. Sales Account vs Product Mapping Rules

- **Gold Account – G14**: Allowed for `Ornament G14`
- **Gold Account – G18**: Allowed for `Ornament G18`, `Cust Ornament G18`
- **Gold Account – G22**: Allowed for `Ornament G22`, `Cust Ornament G22`, `Beads B1`, `Dori D1`, `Lac L1`, `Wax W1`, `Kundan K1`, `Nail N1`
- **Gold Account – GJ**: Allowed for `Ornament GJ`
- **Gold Account – G24**: Allowed for `Std Gold G24`
- **Silver Account – S1**: Allowed for `Articles S1`
- **Jewel Account – D1**: Allowed for `Chakri C1`, `Cust Diamond D1`, `Cust Polki P1`, `DX.*`, `SDX.*`, `DL RA/RC...`
- **Jewel Account – CS**: Allowed for `Cust Stone S1`, `Stone PS*`, `Loose PS*`, `Semi SP*`, `Synth SY*`, `Synth S100/S300`
- **Jewel Account – EM**: Allowed for `Cust Emerald EM1`, `Emerald EM*`, `Emeralds JEM*`
- **Jewel Account – P1**: Allowed for `Cust Pearl P1`, `Pearls P*`
- **Jewel Account – RU**: Allowed for `Cust Ruby RU1`, `Ruby RU*`, `Loose RU*`

### B. UOM Classification Rules

- **GRAMS**: Applied to Gold Ornaments (`G14`, `G18`, `G22`, `GJ`, `Cust G18/G22`), `Std Gold G24`, `Articles S1`, `Beads B1`, `Kundan K1`, `Nail N1`, `Dori D1`, `Lac L1`, `Wax W1`, and products containing `Pearls P*`.
- **CARATS**: Default for all other products, including Diamonds and Gemstones (`Emerald EM*`, `Ruby RU*`, `Stones`).

### C. Rate Deviation Formulas

Base rates come from the **Rate Master** (`src/backend/rateMasterData.ts`, generated from `sales_rate_base_rates_all_products.xlsx`, ~450 products). Gold & Silver ranges are editable on the *Gold & Silver Rates* screen. Products not in the master fall back to the number embedded in the product code.


- **Gold & Silver**: Min Rate - 15%, Max Rate + 15%.
- **Gemstones**: Base Rate - 15%, Base Rate + 15%.
- **Diamonds**:
  $$\text{Uplifted Base Rate} = \text{Base Rate} \times 1.25$$
  $$\text{Allowed Min Rate} = \text{Uplifted Base Rate} \times 0.85$$
  $$\text{Allowed Max Rate} = \text{Uplifted Base Rate} \times 1.15$$

---

## 4. TECH STACK & ARCHITECTURE

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Recharts
- **Backend**: Express (Node.js, TypeScript, ESBuild), Multer (File Uploads), SheetJS (`xlsx`), ExcelJS, jsPDF (`jspdf-autotable`)
- **Dev Server**: Integrated Express + Vite middleware listening on `0.0.0.0:3000`

## 5. RUNNING THE PROJECT

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

---

## 6. API DOCUMENTATION

| Endpoint                       | Method | Description                                   |
| ------------------------------ | ------ | --------------------------------------------- |
| `/api/gold-silver-rates`       | `GET`  | Retrieves active Gold & Silver rate ranges    |
| `/api/gold-silver-rates`       | `POST` | Saves custom Gold & Silver rate ranges        |
| `/api/gold-silver-rates/reset` | `POST` | Resets rate ranges to default rule book       |
| `/api/audit/upload`            | `POST` | Uploads and parses Excel ledger workbook      |
| `/api/audit/run`               | `POST` | Executes audit validation engine              |
| `/api/audit/summary`           | `GET`  | Returns audit intelligence summary KPIs       |
| `/api/audit/results`           | `GET`  | Returns paginated and filtered exception rows |
| `/api/audit/export/excel`      | `GET`  | Downloads Excel audit report (`.xlsx`)        |
| `/api/audit/export/csv`        | `GET`  | Downloads CSV audit report (`.csv`)           |
| `/api/audit/export/pdf`        | `GET`  | Downloads PDF executive audit report (`.pdf`) |

---

## 7. UNIT TESTING

Run the audit validation unit test suite:

```bash
npm test
```

Tests cover:

1. Valid Gold transactions
2. Gold rate deviation detection
3. Valid Silver transactions
4. Invalid UOM detection
5. Invalid Sales Account / Product mismatch
6. Emerald rate validation
7. Ruby UOM classification
8. Diamond 25% uplift calculation
9. Multiple errors per transaction
10. Fixed-range products (Beads, Dori, Kundan… 0–1)
