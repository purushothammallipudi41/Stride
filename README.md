# Stride

**Stride** is a modern social media platform designed for seamless connection, rich media sharing, and real-time interaction. Built with React, Vite, and Capacitor, it offers a native-like experience on both web and mobile.

## Features

-   **Social Feed**: Share posts, photos, and updates.
-   **Stories**: 24-hour temporary status updates with media.
-   **Real-time Chat**: Instant messaging with emoji support, translations, and media sharing.
-   **Video & Audio Calls**: High-quality peer-to-peer calling via WebRTC.
-   **Servers & Channels**: Discord-style communities with multiple channels.
-   **Music Integration**: Discover and stream music while browsing.
-   **Profile Customization**: extensive profile editing and settings.

## Tech Stack

-   **Frontend**: React, Vite, TailwindCSS (Conceptually), CSS Modules.
-   **Backend**: Node.js, Express, Socket.io, MongoDB.
-   **Mobile**: Capacitor (iOS & Android).
-   **Real-time**: Socket.io, WebRTC (PeerJS/Native).

## Getting Started

1.  **Clone the repository**
2.  **Install Dependencies**:
    ```bash
    npm install
    cd backend && npm install
    ```
3.  **Run the Server**:
    ```bash
    cd backend
    node server.js
    ```
4.  **Run the Client**:
    ```bash
    npm run dev
    ```

## Mobile Development

SYNC the web assets to native projects:
```bash
npm run build
npx cap sync
npx cap open android  # or ios
```

## License

MIT
