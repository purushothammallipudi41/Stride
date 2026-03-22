import React from 'react';
import { ShoppingBag } from 'lucide-react';
import './Marketplace.css';

const Marketplace = () => {
    return (
        <div className="marketplace-page placeholder-page">
            <ShoppingBag size={64} className="mb-6 opacity-20" />
            <h1>Marketplace</h1>
            <p>The global Stride marketplace is under construction.</p>
        </div>
    );
};

export default Marketplace;
