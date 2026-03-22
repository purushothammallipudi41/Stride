import React from 'react';
import { Trophy } from 'lucide-react';
import './Achievements.css';

const Achievements = () => {
    return (
        <div className="achievements-page placeholder-page">
            <Trophy size={64} className="mb-6 opacity-20" />
            <h1>Achievements</h1>
            <p>Your musical milestones will appear here soon.</p>
        </div>
    );
};

export default Achievements;
