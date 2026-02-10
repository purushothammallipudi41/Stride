import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import './Legal.css';

const TermsOfService = () => {
    const navigate = useNavigate();

    return (
        <div className="legal-page">
            <div className="legal-header">
                <button onClick={() => navigate(-1)} className="back-btn">
                    <ArrowLeft size={24} />
                </button>
                <h1>Terms of Service</h1>
            </div>
            <div className="legal-content glass-card">
                <p>Last Updated: February 10, 2026</p>

                <section>
                    <h3>1. Acceptance of Terms</h3>
                    <p>By accessing or using Stride, you agree to be bound by these Terms. If you disagree with any part of the user agreement, do not access the application.</p>
                </section>

                <section>
                    <h3>2. User Content</h3>
                    <p>You are responsible for the photos, videos, audio, and other content ("User Content") that you post to the Service. You retain all rights in your User Content.</p>
                </section>

                <section>
                    <h3>3. Prohibited Conduct</h3>
                    <p>You agree not to use the Service to:</p>
                    <ul>
                        <li>Violate any laws or regulations.</li>
                        <li>Post content that is infringing, libelous, defamatory, obscene, pornographic, abusive, or offensive.</li>
                        <li>Harass, bully, or intimidate other users.</li>
                        <li>Spam or solicit users.</li>
                    </ul>
                    <p>We reserve the right to ban users who violate these rules.</p>
                </section>

                <section>
                    <h3>4. Termination</h3>
                    <p>We may terminate or suspend access to our Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.</p>
                </section>
            </div>
        </div>
    );
};

export default TermsOfService;
