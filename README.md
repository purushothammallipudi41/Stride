# Stride

Stride is a modern, high-performance music and social streaming platform.

## Features

- Real-time server status and global events.
- Premium UI with smooth transitions and glassmorphism.
- Integrated feed and stories.
- Integrated music player with Audius and Giphy support.

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the backend:

   ```bash
   node server/index.cjs
   ```

3. Start the frontend:

   ```bash
   npm run dev
   ```

## BigInt Serialization

This project includes a global patch for `BigInt` serialization. If you encounter `TypeError: Do not know how to serialize a BigInt`, ensure that `patch-bigint.cjs` is imported at the top of your entry point.
