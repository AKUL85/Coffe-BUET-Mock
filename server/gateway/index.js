const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 8000;

app.use('/coffees', createProxyMiddleware({
    target: 'http://coffee-service:3001',
    changeOrigin: true
}));

app.use('/members', createProxyMiddleware({
    target: 'http://member-service:3002',
    changeOrigin: true
}));

app.use('/purchase', createProxyMiddleware({
    target: 'http://purchase-service:3003',
    changeOrigin: true
}));

app.listen(PORT, () => {
    console.log(`Gateway running on port ${PORT}`);
});
