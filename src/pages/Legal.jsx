import React from 'react';
import { ChevronLeft, Shield, Scale, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Legal.css';

const Legal = () => {
    const navigate = useNavigate();

    const legalSections = [
        {
            id: 'tos',
            title: 'Terms of Service',
            icon: <Scale size={20} />,
            effectiveDate: 'Effective: May 7, 2026',
            bullets: [
                'By accessing or using Vyx, you agree to be bound by these Terms. If you do not agree, you may not use the platform.',
                'You must be at least 13 years of age to create an account. Users under 18 require parental consent.',
                'You retain full ownership of all original content you upload. By posting, you grant Vyx a non-exclusive, royalty-free, worldwide license to display and distribute your content within the platform.',
                'You may not upload content that infringes intellectual property rights, contains harassment, hate speech, or illegal material.',
                'Vyx reserves the right to suspend or permanently terminate accounts that violate these Terms or engage in fraud, abuse, or manipulation of platform metrics.',
                'We may update these Terms at any time. Continued use of Vyx after changes constitutes your acceptance of the revised Terms.',
            ]
        },
        {
            id: 'privacy',
            title: 'Privacy Policy',
            icon: <Shield size={20} />,
            effectiveDate: 'Effective: May 7, 2026',
            bullets: [
                'We collect only the data necessary to provide the Vyx experience: account details, usage patterns, device type, and interaction data.',
                'Your private messages are end-to-end encrypted and are never read, sold, or shared with third parties.',
                'We do not sell your personal information to advertisers or data brokers.',
                'You may request a full export or deletion of your personal data at any time by contacting privacy@vyxapp.in.',
                'Cookies and local storage are used solely to maintain session state and improve performance. No cross-site tracking is performed.',
                'Data is stored on secure, geographically distributed servers with AES-256 encryption at rest.',
            ]
        },
        {
            id: 'monetization',
            title: 'Monetization Policy',
            icon: <Info size={20} />,
            effectiveDate: 'Effective: May 7, 2026',
            bullets: [
                'Vibe Tokens are earned through engagement, content quality scores, and ad-revenue shares (2x multiplier for Vyx Pro members).',
                'Tokens can be converted to real-world currency once you reach the minimum withdrawal threshold of 500 tokens.',
                'Vyx Pro memberships are billed as a one-time lifetime fee or recurring subscription as specified at checkout. All transactions are final.',
                'Payments are processed through secure global gateways (Google Play / RevenueCat). Vyx does not store full payment card details.',
                'Fraudulent manipulation of engagement metrics, token farming, or abuse of the referral system will result in immediate account termination and forfeiture of token balance.',
                'Vyx Sovereignty (Admin) reserves the right to audit transactions and withhold payouts pending review.',
            ]
        },
        {
            id: 'community',
            title: 'Community Standards',
            icon: <Shield size={20} />,
            effectiveDate: 'Effective: May 7, 2026',
            bullets: [
                'Vyx is a creative space. Treat all members with respect. Harassment, bullying, and targeted abuse are strictly prohibited.',
                'Hate speech based on race, religion, gender, sexual orientation, disability, or national origin is not tolerated and will result in immediate removal.',
                'Spam, unsolicited advertising, and coordinated inauthentic behavior undermine the platform and are prohibited.',
                'Sexual content involving minors is absolutely prohibited and will be reported to law enforcement.',
                'Report violations using the "Support Hub" in Settings. Our moderation team reviews all reports within 48 hours.',
                'Repeated violations result in escalating penalties: content removal → temporary suspension → permanent ban.',
            ]
        },
        {
            id: 'copyright',
            title: 'Copyright & DMCA',
            icon: <Scale size={20} />,
            effectiveDate: 'Effective: May 1, 2026',
            bullets: [
                'Vyx respects intellectual property rights and complies with the Digital Millennium Copyright Act (DMCA).',
                'If you believe your copyrighted work has been used without authorization, submit a DMCA notice to dmca@vyxapp.in.',
                'Your notice must include: identification of the copyrighted work, the infringing content URL, your contact information, and a statement of good faith.',
                'Upon receiving a valid DMCA notice, we will remove the infringing content and notify the uploader.',
                'Repeated copyright infringement will result in account termination under our repeat infringer policy.',
                'Counter-notices may be submitted if you believe content was removed in error.',
            ]
        },
        {
            id: 'disputes',
            title: 'Dispute Resolution',
            icon: <Info size={20} />,
            effectiveDate: 'Effective: May 1, 2026',
            bullets: [
                'These Terms are governed by the laws of India, without regard to conflict of law provisions.',
                'Any disputes arising from the use of Vyx shall first be attempted to be resolved through good faith negotiation.',
                'If negotiation fails, disputes will be submitted to binding arbitration in accordance with the Arbitration and Conciliation Act, 1996.',
                'Class action lawsuits against Vyx are waived to the fullest extent permitted by law.',
                'For all legal notices, contact: legal@vyxapp.in',
                'Nothing in these Terms limits your statutory rights as a consumer under applicable law.',
            ]
        }
    ];

    return (
        <div className="legal-page-v1 animate-fade-in">
            <div className="legal-header-glass">
                <button className="legal-back-btn" onClick={() => navigate(-1)}>
                    <ChevronLeft size={24} />
                </button>
                <h1>Legal Nexus</h1>
                <p>Vyx v1.0.0 | Production Release</p>
            </div>

            <div className="legal-content-container">
                <div className="legal-hero glass-panel">
                    <div className="legal-hero-glow" />
                    <h2>The Vyx Manifesto</h2>
                    <p>We believe in a world where music and connection are decentralized, premium, and respect the privacy of every creator.</p>
                </div>

                <div className="legal-sections">
                    {legalSections.map(section => (
                        <div key={section.id} className="legal-card glass-panel">
                            <div className="legal-card-header">
                                <div className="legal-icon-box">{section.icon}</div>
                                <div>
                                    <h3>{section.title}</h3>
                                    {section.effectiveDate && <span className="legal-effective">{section.effectiveDate}</span>}
                                </div>
                            </div>
                            <div className="legal-card-body">
                                <ul className="legal-bullets">
                                    {section.bullets.map((b, i) => (
                                        <li key={i}>{b}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="legal-footer">
                    <p>© 2026 VYX INC. ALL RIGHTS RESERVED.</p>
                    <p>hello@vyxapp.in</p>
                </div>
            </div>
        </div>
    );
};

export default Legal;
