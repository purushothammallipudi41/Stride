import React, { useMemo } from 'react';
import '@rainbow-me/rainbowkit/styles.css';
import {
  getDefaultConfig,
  RainbowKitProvider,
  darkTheme,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider, http } from 'wagmi';
import { polygon, polygonAmoy } from 'wagmi/chains';
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";

// Solana
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { 
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import '@solana/wallet-adapter-react-ui/styles.css';

const queryClient = new QueryClient();

export const Web3Provider = ({ children }) => {
  const projectId = 'YOUR_PROJECT_ID_PLACEHOLDER';

  // Silent E2E mode or Production Fail-Safe to avoid 403 Config errors stalling the app
  const isE2E = typeof window !== 'undefined' && 
    (window.location.hostname === '127.0.0.1' || 
     projectId === 'YOUR_PROJECT_ID_PLACEHOLDER');
  
  // Safe config initialization inside component scope
  const config = useMemo(() => {
    if (isE2E) return null;
    
    try {
      return getDefaultConfig({
        appName: 'Stride',
        projectId: projectId,
        chains: [polygon, polygonAmoy],
        transports: {
          [polygon.id]: http(),
          [polygonAmoy.id]: http(),
        },
      });
    } catch (err) {
      console.error('[Web3Provider] Failed to initialize Wagmi config:', err);
      return null;
    }
  }, [isE2E, projectId]);

  // Solana config
  const network = 'devnet';
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  const wallets = useMemo(() => [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
  ], []);

  console.log('[Web3Provider] Initializing with isE2E:', isE2E);

  if (isE2E || !config) {
    return (
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            {children}
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    );
  }

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme({
          accentColor: '#8b5cf6',
          accentColorForeground: 'white',
          borderRadius: 'large',
        })}>
          <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
              <WalletModalProvider>
                {children}
              </WalletModalProvider>
            </WalletProvider>
          </ConnectionProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
