# EcoClassify AI Wiki

Welcome to the EcoClassify AI Wiki! This documentation covers the architecture, models, and design decisions behind the platform.

## Table of Contents
1. [System Architecture](#system-architecture)
2. [The RF-DETR Model](#the-rf-detr-model)
3. [Environmental Impact Metrics](#environmental-impact-metrics)
4. [Deployment](#deployment)

---

## System Architecture
EcoClassify AI is a full-stack web application designed for secure, fast inference:
* **Frontend**: Built with React 18, TypeScript, and Vite. Styled beautifully using Tailwind CSS and Lucide icons.
* **Backend**: Express + Node.js server. The backend securely proxies requests to Roboflow and Google Gemini to ensure API keys are never exposed to the client.
* **Storage**: Currently utilizes `localStorage` for offline-first, local history tracking and API key overrides.

## The RF-DETR Model
* **Trainer**: JLNerecina
* **Base Architecture**: RT-DETR (Real-Time DEtection TRansformer) optimized for serverless inference workflows.
* **Purpose**: Identifies the bounding boxes and primary classifications for waste materials (e.g., Plastic, Metal, Glass, Cardboard, Organic). The output of this model is chained dynamically with the Gemini API to formulate smart recycling recommendations.

## Environmental Impact Metrics
The Impact Dashboard estimates footprint metrics using standard EPA WARM and IPCC guidelines:
* **Plastic/Metal**: High CO₂ offset per unit due to energy-intensive raw manufacturing processes bypassed by recycling.
* **Paper/Glass**: Moderate offset, heavily impacting landfill volume diversion.
* **Organics**: High methane-prevention impact when successfully diverted to compost.

## Deployment
This app uses a Vite + Express architecture.
To deploy, run `npm run build` which bundles both the Vite client assets (to `dist/`) and the Express server (to `dist/server.cjs`).
Start the production server via `npm start`.

*For more details, see the main README or open an Issue on GitHub.*
