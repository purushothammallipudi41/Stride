const express = require('express');
const app = express();
const path = require('path');

// Mock dependencies to avoid startup errors
const mockMiddleware = (req, res, next) => next();
const mockController = (req, res) => res.json({ ok: true });

// We need to bypass the actual database connection and other side effects
// by mocking the required route files or just reading them carefully.
// BUT, since we want to see how THEY are registered in server.js,
// let's look at server.js again but with a focus on WHERE it might be hiding them.

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

function print(path, layer) {
    if (layer.route) {
        layer.route.stack.forEach(print.bind(null, path.concat(split(layer.route.path))))
    } else if (layer.name === 'router' && layer.handle.stack) {
        layer.handle.stack.forEach(print.bind(null, path.concat(split(layer.regexp))))
    } else if (layer.method) {
        console.log('%s /%s',
            layer.method.toUpperCase(),
            path.concat(split(layer.regexp)).filter(Boolean).join('/'))
    }
}

function split(thing) {
    if (typeof thing === 'string') {
        return thing.split('/')
    } else if (thing.fast_slash) {
        return ''
    } else {
        var match = thing.toString()
            .replace('\\/?', '')
            .replace('(?=\\/|$)', '')
            .match(/^\/\^((?:\\[.*+?^${}()|[\]\\\/]|[^.*+?^${}()|[\]\\\/])*)\$\//)
        return match
            ? match[1].replace(/\\(.)/g, '$1').split('/')
            : '<complex:' + thing.toString() + '>'
    }
}

app._router.stack.forEach(print.bind(null, []))
