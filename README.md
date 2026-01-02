# BTCC API Proxy

A simple Express.js proxy server to forward requests to the BTCC API.

## Purpose

This proxy bypasses firewall restrictions by running on infrastructure that can reach `api.btcc.com`.

## Setup

1. Deploy to Railway/Render/Fly.io
2. Set environment variable:
   ```
   ALLOWED_ORIGINS=http://localhost:3000,https://btcc-trading-app-qnfona.abacusai.app
   ```
3. Get your deployment URL
4. Configure your trading app to use this proxy URL

## Endpoints

- `GET /health` - Health check
- `GET /` - API info
- `ALL /proxy/*` - Proxy to BTCC API

## Example Usage

```bash
curl https://your-proxy.railway.app/health
```
