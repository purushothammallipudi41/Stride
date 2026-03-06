const express = require('express');
const app = express();
const postRoutes = require('./backend/routes/postRoutes');
const messageRoutes = require('./backend/routes/messageRoutes');
const analyticsRoutes = require('./backend/routes/analyticsRoutes');
const aiRoutes = require('./backend/routes/aiRoutes');
const audiusRoutes = require('./backend/routes/audiusRoutes');

app.use('/api/posts', postRoutes);
app.use('/api', messageRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/audius', audiusRoutes);

function printRoutes(stack, prefix = '') {
    stack.forEach(r => {
        if (r.route) {
            const methods = Object.keys(r.route.methods).join(',').toUpperCase();
            console.log(`${methods} ${prefix}${r.route.path}`);
        } else if (r.name === 'router') {
            const newPrefix = prefix + (r.regexp.source.replace('^\\', '').replace('\\/?(?=\\/|$)', '').replace('\\/', '/').replace('\\', ''));
            printRoutes(r.handle.stack, newPrefix);
        }
    });
}

console.log("--- Registered Routes ---");
printRoutes(app._router.stack);
