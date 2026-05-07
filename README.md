# Vyx

Vyx is a modern, high-performance music and social streaming platform.

## Features

- **Artist Dashboard**: Real-time stats for tracks, likes, and followers.
- **Social Messaging**: Direct Messages with optimistic UI updates.
- **Direct Calls**: Integrated Audio and Video calling with global overlay management.
- **Premium UI** with smooth transitions and glassmorphism.
- **Integrated music player** with Audius and Giphy support.
- **Integrated feed and stories** with optimized asset delivery.
- **Real-time server status** and global events.

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
