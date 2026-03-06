const express = require('express');
const app = express();

const postRoutes = require('./routes/postRoutes');
const messageRoutes = require('./routes/messageRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const aiRoutes = require('./routes/aiRoutes');
const audiusRoutes = require('./routes/audiusRoutes');

app.use('/api/posts', postRoutes);
app.use('/api', messageRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/audius', audiusRoutes);

console.log("--- EXPRESS ROUTES ---");

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
            .replace(/^\/\^/, '')
            .replace(/\$\/$/, '')
            .split('\\/')
        return match;
    }
}

app._router.stack.forEach(print.bind(null, []))
