import React from 'react';
import { BarChart3 } from 'lucide-react';
import './Insights.css';

const Insights = () => {
    return (
        <div className="insights-page placeholder-page">
            <BarChart3 size={64} className="mb-6 opacity-20" />
            <h1>Insights</h1>
            <p>Deep analytics for your music performance are coming soon.</p>
        </div>
    );
};

export default Insights;
