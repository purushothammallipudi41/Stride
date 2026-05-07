import { Helmet } from 'react-helmet-async';

const SEO = ({ title, description, image, url, type = 'website' }) => {
    const siteName = 'Vyx';
    const fullTitle = title ? `${title} | ${siteName}` : siteName;
    const defaultDescription = 'Vyx is a modern, high-performance music and social streaming platform. Discover your frequency today.';
    const defaultImage = '/vyx-logo.png'; // Replace with a specific OG image if available

    return (
        <Helmet>
            {/* Standard meta tags */}
            <title>{fullTitle}</title>
            <meta name="description" content={description || defaultDescription} />
            
            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description || defaultDescription} />
            <meta property="og:image" content={image || defaultImage} />
            <meta property="og:url" content={url || window.location.href} />
            
            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description || defaultDescription} />
            <meta name="twitter:image" content={image || defaultImage} />
        </Helmet>
    );
};

export default SEO;
