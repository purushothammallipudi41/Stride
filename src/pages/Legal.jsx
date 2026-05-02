import React from 'react';
import { ChevronLeft, Shield, Scale, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Legal.css';

const Legal = () => {
    const navigate = useNavigate();

    const legalSections = [
        {
            id: 'tos',
            title: 'Terms of Rhythm',
            icon: <Scale size={20} />,
            content: `By accessing Stride, you agree to respect the rhythm of the community. You retain ownership of any original beats you upload, but grant Stride a non-exclusive license to stream and distribute your content across the Stride Nexus. Commercial use of Stride Pro features is subject to the Monetization Policy.`
        },
        {
            id: 'privacy',
            title: 'Privacy Nexus',
            icon: <Shield size={20} />,
            content: `Your data pulse is yours. We encrypt your messages and never sell your personal information to third-party entities. We collect minimal usage data to optimize the global vibe-sync experience and ensure the platform remains stable for all Striders.`
        },
        {
            id: 'monetization',
            title: 'Monetization Policy',
            icon: <Info size={20} />,
            content: `Striders earned through engagement and gifts can be withdrawn as real-world currency once the minimum threshold is met. All transactions are processed through secure global gateways and are subject to verification by the Stride Sovereignty (Admin) team.`
        }
    ];

    return (
        <div className="legal-page-v1 animate-fade-in">
            <div className="legal-header-glass">
                <button className="legal-back-btn" onClick={() => navigate(-1)}>
                    <ChevronLeft size={24} />
                </button>
                <h1>Legal Nexus</h1>
                <p>Stride v1.0.0 | Production Release</p>
            </div>

            <div className="legal-content-container">
                <div className="legal-hero glass-panel">
                    <div className="legal-hero-glow" />
                    <h2>The Stride Manifesto</h2>
                    <p>We believe in a world where music and connection are decentralized, premium, and respect the privacy of every creator.</p>
                </div>

                <div className="legal-sections">
                    {legalSections.map(section => (
                        <div key={section.id} className="legal-card glass-panel">
                            <div className="legal-card-header">
                                <div className="legal-icon-box">{section.icon}</div>
                                <h3>{section.title}</h3>
                            </div>
                            <div className="legal-card-body">
                                <p>{section.content}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="legal-footer">
                    <p>© 2026 STRIDE INC. ALL RIGHTS RESERVED.</p>
                    <p>contact@thestrideapp.in</p>
                </div>
            </div>
        </div>
    );
};

export default Legal;
