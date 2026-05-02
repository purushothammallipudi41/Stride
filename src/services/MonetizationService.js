import { Purchases } from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';

const REVENUECAT_API_KEY = import.meta.env.VITE_REVENUECAT_PUBLIC_KEY || 'goog_placeholder_key';

class MonetizationService {
    constructor() {
        this.initialized = false;
        this.currentOfferings = null;
    }

    async initialize() {
        if (this.initialized) return;
        
        try {
            if (Capacitor.getPlatform() === 'android' || Capacitor.getPlatform() === 'ios') {
                console.log('💎 MonetizationService: Initializing RevenueCat...');
                await Purchases.configure({ apiKey: REVENUECAT_API_KEY });
                this.initialized = true;
                
                // Prefetch offerings
                await this.getOfferings();
            } else {
                console.warn('💎 MonetizationService: Not on a mobile platform. Billing disabled.');
            }
        } catch (err) {
            console.error('💎 MonetizationService: Initialization failed', err);
        }
    }

    async getOfferings() {
        try {
            if (!this.initialized) await this.initialize();
            
            if (Capacitor.getPlatform() !== 'web') {
                const offerings = await Purchases.getOfferings();
                if (offerings.current !== null && offerings.current.availablePackages.length !== 0) {
                    this.currentOfferings = offerings.current;
                    return offerings.current;
                }
            }
            return null;
        } catch (err) {
            console.error('💎 MonetizationService: Failed to fetch offerings', err);
            return null;
        }
    }

    async purchasePackage(pkg) {
        try {
            const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
            return { success: true, customerInfo };
        } catch (err) {
            console.error('💎 MonetizationService: Purchase failed', err);
            return { success: false, error: err.message };
        }
    }

    async getCustomerInfo() {
        try {
            if (!this.initialized) await this.initialize();
            return await Purchases.getCustomerInfo();
        } catch (err) {
            console.error('💎 MonetizationService: Failed to get customer info', err);
            return null;
        }
    }

    async restorePurchases() {
        try {
            return await Purchases.restorePurchases();
        } catch (err) {
            console.error('💎 MonetizationService: Restore failed', err);
            return null;
        }
    }

    // Helper to check if a user has a specific entitlement (e.g. 'pro')
    async hasEntitlement(entitlementId) {
        const info = await this.getCustomerInfo();
        return info?.entitlements.active[entitlementId] !== undefined;
    }
}

export default new MonetizationService();
