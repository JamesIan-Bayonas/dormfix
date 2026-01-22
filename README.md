# DormFix

 **A centralized web platform for seamless dormitory management, maintenance tracking, and payment verification.**


## About The Project

**DormFix** is a full-stack web application designed to digitize the interactions between Dormitory Landlords and Tenants. It replaces manual logbooks and unverified text messages with a centralized dashboard for managing room assignments, tracking rent payments, and filing maintenance requests.

Built to address the specific needs of local boarding houses, DormFix ensures transparency, accountability, and ease of use for both property managers and boarders.

## Key Features

### For Landlords (Admin)
* **Dashboard Overview:** View real-time occupancy rates and pending tasks.
* **Payment Verification:** Review proof-of-payment receipts (GCash/Bank) and approve or reject them with remarks.
* **Room Management:** Manage room inventory, set capacity limits, and assign tenants.
* **Maintenance Tracking:** Triage reported issues (Plumbing, Electrical) and update repair status.

![Landlord Dashboard](./client/public/landlord.png)

## For Tenants
* **Housing Profile:** View assigned room details, landlord contact info, and move-in dates.
* **Digital Payments:** Securely upload payment receipts and track verification status.
* **Issue Reporting:** File maintenance requests with urgency levels and descriptions.
* **History Log:** Access a permanent record of past payments and maintenance tickets.

![Tenant Dashboard](./client/public/tenant.png)

## Tech Stack

* **Frontend:** React (Vite) + TypeScript + Tailwind CSS
* **Backend:** Node.js + Express.js
* **Database:** Microsoft SQL Server (MSSQL)
* **State Management:** React Context API
* **File Storage:** Local Multer Storage (for receipts)

---

## Getting Started

Follow these instructions to run the project locally on your machine.

### 1. Prerequisites
Ensure you have the following installed:
* **Node.js** (v18 or higher)
* **Microsoft SQL Server Express** (2019 or later)
* **Git**

### 2. Database Setup
1.  Open **SQL Server Management Studio (SSMS)**.
2.  Create a new database named `dormfix`.
3.  Create a Login/User named `sa` with the password `sharingan`.
    * *Note: Ensure TCP/IP is enabled in SQL Server Configuration Manager.*
4.  **Initialize the Database Schema**
    * Navigate to the `database/` folder in the project source.
    * Open the file named `schema.sql` (or `setup.sql`) inside **SQL Server Management Studio (SSMS)**.
    * **CRITICAL:** In the SSMS toolbar, ensure the target database dropdown is set to `dormfix` (it defaults to `master`).
    * Click the **Execute** button (or press `F5`) to run the script.
    * *Verification:* Refresh the "Tables" folder in the Object Explorer. You should see `dbo.users`, `dbo.rooms`, `dbo.payments`, etc.

### 3. Backend Installation
This project uses environment variables for configuration. You must create a `.env` file in the `server` directory before running the application.

* Navigate to the server directory:
```bash
cd server
```

* Create a file named `.env`:

```bash
touch .env
```

* Add this exact database credentials to `.env` to run the application:

```env
DB_USER=sa
DB_PASSWORD=your_secure_password
DB_SERVER=localhost
DB_NAME=dormfix
```

* Start the backend server:

```bash
npm install
npm run dev
```
##### You should see: Server running on http://localhost:5000

---

### 4. Frontend Installation

Open a terminal window and navigate to the client directory:

```bash
cd client
npm install
```

##### Start the React application:

```bash
npm run dev
```
##### Click the link provided (usually http://localhost:5173) to launch the application.
