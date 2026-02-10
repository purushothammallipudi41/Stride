import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import './Legal.css';

const PrivacyPolicy = () => {
    const navigate = useNavigate();

    return (
        <div className="legal-page">
            <div className="legal-header">
                <button onClick={() => navigate(-1)} className="back-btn">
                    <ArrowLeft size={24} />
                </button>
                <h1>Privacy Policy</h1>
            </div>
            <div className="legal-content glass-card">
                <p>Last Updated: February 10, 2026</p>

                <section>
                    <h3>1. Information We Collect</h3>
                    <p>We collect information you provide directly to us, such as when you create an account, update your profile, or communicate with us. This may include your name, email address, username, and password.</p>
                </section>

                <section>
                    <h3>2. How We Use Your Information</h3>
                    <p>We use the information we collect to provide, maintain, and improve our services, including to:</p>
                    <ul>
                        <li>Create and maintain your account.</li>
                        <li>Process your transactions and requests.</li>
                        <li>Send you technical notices, updates, and support messages.</li>
                    </ul>
                </section>

                <section>
                    <h3>3. Content Visibility</h3>
                    <p>Any content you post to the Service (photos, comments, likes) is visible to other users. Please be mindful of what you share.</p>
                </section>

                <section>
                    <h3>4. Data Security</h3>
                    <p>We implement reasonable security measures to protect your information. However, no method of transmission over the Internet is 100% secure.</p>
                </section>

                <section>
                    <h3>5. Contact Us</h3>
                    <p>If you have any questions about this Privacy Policy, please contact us at thestrideapp@gmail.com.</p>
                </section>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
