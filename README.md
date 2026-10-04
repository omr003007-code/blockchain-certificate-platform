#  Blockchain Certificate Verification System

A full-stack web application that allows educational institutions to issue tamper-proof digital certificates and enables anyone to verify their authenticity using blockchain technology.

##  Features

- ** Secure Admin Portal:** JWT-based authentication for authorized university staff to issue certificates.
- ** Professional PDF Generation:** Automatically generates beautifully formatted PDF certificates with unique QR codes.
- ** Blockchain Integration:** Writes immutable certificate records to an Ethereum smart contract (via Hardhat) for undeniable proof of issuance.
- ** Public Verification:** A public-facing portal where employers or anyone can verify a certificate's validity instantly using its unique Certificate ID.

##  Technology Stack

- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Mongoose)
- **Blockchain:** Solidity, Hardhat (v2), Ethers.js (v6)
- **Utilities:** PDFKit (PDF generation), QRCode, Nodemailer
- **Frontend:** HTML5, Bootstrap 5, Vanilla JavaScript

##  Installation & Setup

Follow these steps to run the project locally:

### 1. Prerequisites
Make sure you have [Node.js](https://nodejs.org/) and [MongoDB](https://www.mongodb.com/) installed and running on your machine.

### 2. Clone and Install Dependencies
```bash
cd Backend
npm install
