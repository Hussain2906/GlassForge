<img width="1680" height="972" alt="Screenshot 2025-10-19 at 3 50 46 AM" src="https://github.com/user-attachments/assets/94477a85-ddb6-4bdf-9ae3-9c0a5867dd59" />
<img width="1680" height="969" alt="Screenshot 2025-10-19 at 3 51 35 AM" src="https://github.com/user-attachments/assets/4f9b85c6-f2f9-4386-b039-eaa6e959ce5f" />
<img width="1680" height="968" alt="Screenshot 2025-10-19 at 3 51 56 AM" src="https://github.com/user-attachments/assets/6abe5973-e687-4dc6-91e2-e81a7e8bca3e" />
<img width="1680" height="971" alt="Screenshot 2025-10-19 at 3 52 13 AM" src="https://github.com/user-attachments/assets/91322a95-e9c7-4a05-b84e-05f170517f48" />
<img width="1680" height="972" alt="Screenshot 2025-10-19 at 3 52 26 AM" src="https://github.com/user-attachments/assets/50cfa246-4afc-4884-93f0-27b2f4337826" />
<img width="1680" height="972" alt="Screenshot 2025-10-19 at 3 52 45 AM" src="https://github.com/user-attachments/assets/c7303c11-d143-49b0-a9c7-bbc14bf968e5" />
<img width="1680" height="972" alt="Screenshot 2025-10-19 at 3 53 12 AM" src="https://github.com/user-attachments/assets/bad44e72-335f-4fd2-aebb-09be92c2eeb5" />
<img width="1680" height="783" alt="Screenshot 2025-10-19 at 3 53 50 AM" src="https://github.com/user-attachments/assets/3b632e15-865c-415f-99c1-c337df0b68d6" />
<img width="1680" height="819" alt="Screenshot 2025-10-19 at 3 54 08 AM" src="https://github.com/user-attachments/assets/05d82334-d31b-4052-a180-d2d7ccb8e7e5" />
<img width="1680" height="549" alt="Screenshot 2025-10-19 at 3 54 23 AM" src="https://github.com/user-attachments/assets/3c27cf10-661a-47ca-a098-4227f903dbe8" />
<img width="1680" height="776" alt="Screenshot 2025-10-19 at 3 54 38 AM" src="https://github.com/user-attachments/assets/7ee2fc00-5446-4f81-91f1-ff98b6cd6fdb" />
<img width="1680" height="974" alt="Screenshot 2025-10-19 at 3 55 29 AM" src="https://github.com/user-attachments/assets/843c10df-c393-4e68-9c5d-9018cdf017e6" />
<img width="1680" height="969" alt="Screenshot 2025-10-19 at 3 56 05 AM" src="https://github.com/user-attachments/assets/771bd7f6-982f-4931-b5d0-e406a5c4adba" />


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
