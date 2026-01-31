# STN Loose Picking System

A MERN-based warehouse loose-piece picking system with real-time QR/barcode scanning.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

### Setup

1. **Fix npm authentication** (if you see token expired errors):

```bash
npm logout
# or delete the token from ~/.npmrc
```

2. **Install server dependencies**:

```bash
cd stn-picking-system/server
npm install
```

3. **Install client dependencies**:

```bash
cd stn-picking-system/client
npm install
```

4. **Configure MongoDB** (optional - demo mode works without):
   Edit `server/.env`:

```
MONGODB_URI=mongodb://localhost:27017/stn-picking
```

5. **Seed demo data** (requires MongoDB):

```bash
cd stn-picking-system/server
node scripts/seed.js
```

6. **Start the backend**:

```bash
cd stn-picking-system/server
npm run dev
```

7. **Start the frontend** (in a new terminal):

```bash
cd stn-picking-system/client
npm run dev
```

8. **Open in browser**:

```
http://localhost:5173
```

## 📁 Project Structure

```
stn-picking-system/
├── client/                 # React Frontend (Vite)
│   ├── src/
│   │   ├── components/     # ScanFeedback, CameraScanner
│   │   ├── pages/          # Dashboard, Picking, Products, etc.
│   │   ├── services/       # API client
│   │   └── App.jsx
│   └── package.json
│
└── server/                 # Node.js Backend (Express)
    ├── config/             # Database config
    ├── models/             # MongoDB schemas
    ├── routes/             # API routes
    ├── scripts/            # Seed script
    ├── server.js
    └── package.json
```

## 🔑 Key Features

### ✅ Barcode Scanner Module

- Camera-based QR/barcode scanning
- USB barcode scanner support (keyboard input)
- Auto-detect scan completion
- Green/red screen feedback with sounds

### ✅ Product Master

- Product CRUD with barcode mapping
- Rack ID and sequence for physical order
- Category and brand organization

### ✅ Manual Barcode Generator

- Generate QR/barcodes for products without physical barcodes
- Print-friendly output
- Auto-maps generated codes to products

### ✅ Pick List & Scan Validation

- Pick lists sorted by rack sequence
- Real-time scan validation
- Prevents wrong SKU and over-picking
- Visual progress tracking

### ✅ Analytics Dashboard

- Branch-wise statistics
- Product-wise movement
- Daily picking trends
- Error rate tracking

## 📡 API Endpoints

### Products

- `GET /api/products` - List products
- `GET /api/products/barcode/:barcode` - Get by barcode
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product

### Barcodes

- `POST /api/barcodes/generate` - Generate barcode
- `GET /api/barcodes/unassigned` - Products without barcodes

### Picking

- `POST /api/picklist` - Create pick list
- `GET /api/picklist/:id` - Get pick list
- `POST /api/picklist/scan/validate` - Validate scan

### Analytics

- `GET /api/analytics/summary` - Dashboard summary
- `GET /api/analytics/branch-wise` - Branch stats
- `GET /api/analytics/product-wise` - Product stats

## 🎨 Mobile-First Design

The UI is optimized for warehouse operators using mobile phones:

- Touch-friendly buttons
- Large scan input area
- Bottom navigation on mobile
- Visual feedback for scans

## 📦 Demo Data

After running the seed script, you'll have:

- 10 sample products (7 with barcodes, 3 without)
- 3 branches
- 6 racks
- 1 sample pick list

### Sample Barcodes for Testing

- `8901030504594` - Dove Beauty Bar
- `4902430901024` - Head & Shoulders
- `GEN-VAP001-001` - Vap Cleaner (generated)

## 🔧 Troubleshooting

### npm install fails with "Access token expired"

```bash
# Remove the expired token
npm logout
# Or edit ~/.npmrc and remove the token line
```

### MongoDB connection fails

The app runs in "demo mode" with in-memory data if MongoDB isn't available.

### Camera not working

- Grant camera permissions in your browser
- Use HTTPS in production (required for camera access)
