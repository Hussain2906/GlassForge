# 🏗️ GlassForge

> Modern ERP software designed specifically for the glass industry. Manage your entire workflow from quote to delivery with intelligent pricing, inventory tracking, and customer management.

## ✨ Features

### 📊 Sales & Quoting
- **Instant Quote Generation** - Create professional quotes in seconds
- **Automatic Pricing** - Dynamic calculations based on glass type, thickness, and dimensions
- **Process Costs** - Support for tempering, edging, lamination, and custom processes
- **Discount Management** - Flexible discount options with percentage or fixed amounts
- **GST Compliance** - Full support for CGST/SGST/IGST calculations

### 📦 Order Management
- **Quote to Order** - Convert quotes to orders with one click
- **Production Tracking** - Track orders through stages (New → Confirmed → In Production → Ready → Delivered)
- **Status Management** - Easy status updates with dropdown menus
- **Customer Management** - Complete customer information and history

### 💰 Invoicing & Payments
- **Professional Invoices** - Generate GST-compliant invoices from orders
- **Payment Tracking** - Track payments and outstanding balances
- **PDF Generation** - Download quotes, orders, and invoices as PDFs
- **Tax Breakdown** - Detailed tax calculations with CGST/SGST/IGST

### ⚙️ Administration
- **Glass Rate Management** - Configure rates for multiple glass types and thicknesses
- **Process Masters** - Define processes with flexible pricing (per piece, per area, per length)
- **Multi-User Support** - Role-based access control (Admin, Staff, Viewer)
- **Organization Settings** - Customize settings for your business

## 🚀 Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling with custom pastel theme
- **shadcn/ui** - Beautiful, accessible components
- **React Query** - Data fetching and caching
- **Zod** - Schema validation

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **TypeScript** - Type-safe development
- **Prisma** - Modern ORM
- **PostgreSQL** - Relational database
- **JWT** - Authentication
- **PDFKit** - PDF generation

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/Hussain2906/GlassForge.git
cd GlassForge
```

2. **Install dependencies**
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. **Configure environment variables**

Backend `.env`:
```env
DATABASE_URL_APP="postgresql://user:password@localhost:5432/glassforge"
SHADOW_DATABASE_URL_APP="postgresql://user:password@localhost:5432/glassforge_shadow"
JWT_SECRET="your-secret-key-here"
PORT=3001
```

Frontend `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

4. **Setup database**
```bash
cd backend
npx prisma migrate dev
npx prisma db seed
npx ts-node prisma/seed-glass-data.ts
npx ts-node prisma/seed-customers.ts
```

5. **Start development servers**

Backend:
```bash
cd backend
npm run dev
```

Frontend (in a new terminal):
```bash
cd frontend
npm run dev
```

6. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## 🎨 Design

GlassForge features a beautiful pastel color scheme:
- **Background**: Soft lavender
- **Primary**: Soft purple
- **Secondary**: Soft pink
- **Accent**: Soft peach
- **Destructive**: Soft coral

The design is calm, professional, and easy on the eyes for long work sessions.

## 📖 Usage

### First Time Setup
1. Register your organization at `/register-owner`
2. Login at `/login`
3. Configure glass rates at `/admin/glass-rates`
4. Add process masters at `/admin/process-master`
5. Add customers at `/customers`

### Creating a Quote
1. Go to `/quotes/new`
2. Select a customer
3. Add products with glass type, dimensions, and quantity
4. Add processes if needed
5. Set discount and tax options
6. Click "Create Quote"

### Converting to Order
1. Open a quote
2. Click "Convert to Order"
3. Track production status
4. Update status as work progresses

### Generating Invoice
1. Open an order
2. Click "Make Invoice"
3. Download PDF or send to customer

## 🔧 Development

### Project Structure
```
GlassForge/
├── backend/
│   ├── prisma/          # Database schema and migrations
│   ├── src/
│   │   ├── routes/      # API endpoints
│   │   ├── services/    # Business logic
│   │   └── index.ts     # Server entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/         # Next.js pages
│   │   ├── components/  # React components
│   │   └── lib/         # Utilities
│   └── package.json
└── README.md
```

### Available Scripts

Backend:
```bash
npm run dev      # Start development server
npm run studio   # Open Prisma Studio
npm run seed     # Seed database
```

Frontend:
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
```

## 🧪 Testing

```bash
# Type checking
cd frontend && npx tsc --noEmit
cd backend && npx tsc --noEmit
```

## 📝 License

MIT

## 👨‍💻 Author

**Hussain**
- GitHub: [@Hussain2906](https://github.com/Hussain2906)

## 🙏 Acknowledgments

Built with modern tools and best practices for the glass industry.

---

**GlassForge** - Streamline Your Glass Business 🚀
