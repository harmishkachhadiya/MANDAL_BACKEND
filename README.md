# 🏛️ Mandal Financial Core — Backend API

Enterprise-grade REST API backend for the **Mandal Financial Core & Member Ledger System**. Built with **Node.js**, **Express**, and **Microsoft SQL Server (MSSQL)**, featuring role & form-based access control (RBAC), JWT authentication, financial transaction calculations, automated ledger generation, and full database SQL backup/export utilities.

---

## 🌟 Key Features

- **🔐 Robust Authentication & Security**:
  - JWT (JSON Web Token) authentication with bcrypt password hashing (`PASSMAST`).
  - Session verification middleware.
  
- **🛡️ Granular Form Permissions (RBAC)**:
  - Form-level access control with View (`VIW`), Save/Edit (`UPD`), and Delete (`DEL`) permission flags (`PERMAST`).
  - Real-time live synchronization and middleware gatekeeping on all mutation routes.

- **💳 Financial Transaction & Member Management**:
  - **Party Master (`PARMAST`)**: Member registration, address, contact, and committed monthly installments.
  - **Transaction Entry (`TRNMAST`)**: Installments, loan disbursements (`Upad`), loan repayments (`Jama`), interest (`1%`), fines, and expense tracking (`EXPENSE`).
  - Transaction edit & update workflows with stored procedure transactional integrity.

- **📖 Member Ledger & Passbook Engine (`SP_GetLedgerStatement`)**:
  - Real-time chronological running balance statements per member.
  - Automatic debit/credit reconciliation:
    $$\text{Balance} = \text{Opening Balance} + \sum [(\text{Upad} + \text{Interest} + \text{Fine} + \text{Expense}) - (\text{Jama} + \text{Installment})]$$

- **💾 Full Database Backup & Download Utility**:
  - Exports complete `.sql` snapshots of all database tables and rows on demand.
  - Unlimited archival with direct browser download streaming.
  - Protected under system utility permissions (`USER_UTILITY`).

---

## 🏗️ Architecture & Tech Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database Engine**: Microsoft SQL Server (MSSQL) via `mssql` driver
- **Authentication**: `jsonwebtoken`, `bcrypt`
- **Environment Management**: `dotenv`

---

## 📁 Project Structure

```text
MANDAL_BACKEND/
├── backups/                    # Generated SQL database snapshot archives
├── src/
│   ├── config/
│   │   └── db.js               # MSSQL connection pool & helper utilities
│   ├── controllers/
│   │   ├── auth.controller.js          # Login, user registration, change password
│   │   ├── backup.controller.js        # SQL database dumper & file manager
│   │   ├── ledger.controller.js        # Ledger statement SP executor
│   │   ├── party.controller.js         # Party master CRUD
│   │   ├── permission.controller.js    # Form permission matrix management
│   │   └── transaction.controller.js   # Installment & loan transaction handling
│   ├── middlewares/
│   │   ├── auth.middleware.js          # JWT verification middleware
│   │   └── permission.middleware.js    # Granular VIW/UPD/DEL permission checker
│   └── routes/
│       ├── auth.routes.js              # /api/auth
│       ├── backup.routes.js            # /api/backup
│       ├── ledger.routes.js            # /api/ledger
│       ├── party.routes.js             # /api/parties
│       ├── permission.routes.js        # /api/permissions
│       └── transaction.routes.js       # /api/transactions
├── .env.example                # Environment variables template
├── .gitignore                  # Git exclusions (.env, node_modules, backups/*.sql)
├── package.json
└── server.js                   # Application entry point
```

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- Microsoft SQL Server instance (Local or Cloud)

### 2. Clone the Repository
```bash
git clone https://github.com/Harmish77/MANDAL_BACKEND.git
cd MANDAL_BACKEND
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your MSSQL credentials:
```bash
cp .env.example .env
```

```env
PORT=3000
JWT_SECRET=your_jwt_secret_key_here

# SQL Server Configuration
SQL_SERVER="your_sql_server_host"
SQL_DATABASE="your_database_name"
SQL_USER="your_database_user"
SQL_PASSWORD="your_database_password"
SQL_PORT=1433
SQL_ENCRYPT=false
SQL_TRUST_SERVER_CERTIFICATE=true
```

### 5. Start the Server

#### Development Mode (with hot-reload):
```bash
npm run dev
```

#### Production Mode:
```bash
npm start
```

The API will be available at `http://localhost:3000`.

---

## 📡 API Endpoints Reference

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Description | Protected |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate user and receive JWT token | Public |
| `POST` | `/api/auth/register` | Register a new system operator | Yes (`USER_UTILITY: UPD`) |
| `POST` | `/api/auth/change-password` | Change password for logged-in operator | Yes |
| `GET` | `/api/auth/users` | List all registered system users | Yes (`USER_UTILITY: VIW`) |
| `DELETE`| `/api/auth/users/:userid` | Delete an operator account | Yes (`USER_UTILITY: DEL`) |

### 👥 Party Master (`/api/parties`)
| Method | Endpoint | Description | Protected |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/parties` | Fetch list of all active members | Yes |
| `POST` | `/api/parties` | Create or update member details | Yes (`PARMAST_ENTRY: UPD`) |
| `DELETE`| `/api/parties/:id` | Delete a member | Yes (`PARMAST_ENTRY: DEL`) |

### 💳 Transactions (`/api/transactions`)
| Method | Endpoint | Description | Protected |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/transactions?date=YYYY-MM-DD` | Get transactions for a given date | Yes (`TRNMAST_ENTRY: VIW`) |
| `POST` | `/api/transactions` | Save new transaction record | Yes (`TRNMAST_ENTRY: UPD`) |
| `PUT` | `/api/transactions/:id` | Update existing transaction record | Yes (`TRNMAST_ENTRY: UPD`) |
| `DELETE`| `/api/transactions/:id` | Delete a transaction | Yes (`TRNMAST_ENTRY: DEL`) |

### 📖 Member Ledger (`/api/ledger`)
| Method | Endpoint | Description | Protected |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/ledger?pcode=M001&from=...&to=...` | Get chronological running ledger statement | Yes (`LEDGER_VIEW: VIW`) |

### 🛡️ Permissions (`/api/permissions`)
| Method | Endpoint | Description | Protected |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/permissions/:userid` | Get permission matrix for a user | Yes |
| `POST` | `/api/permissions/save` | Update user form permissions | Yes (`PERMAST_ENTRY: UPD`) |

### 💾 Database Backup (`/api/backup`)
| Method | Endpoint | Description | Protected |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/backup/list` | List all available `.sql` backup files | Yes (`USER_UTILITY: VIW`) |
| `POST` | `/api/backup/create` | Generate a new complete SQL snapshot | Yes (`USER_UTILITY: VIW`) |
| `GET` | `/api/backup/download/:filename` | Stream and download `.sql` file | Yes (`USER_UTILITY: VIW`) |
| `DELETE`| `/api/backup/:filename` | Delete a backup file | Yes (`USER_UTILITY: DEL`) |

---

## 📜 License
This project is proprietary software for Mandal Financial Core Management. All rights reserved.
