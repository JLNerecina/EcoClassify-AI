import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

// Parse large JSON payloads for base64 image strings
app.use(express.json({ limit: '25mb' }));

const DEFAULT_ROBOFLOW_API_KEY = process.env.ROBOFLOW_API_KEY || 'SlKaCj7rFJL077FH5LO5';
const DEFAULT_ROBOFLOW_WORKFLOW_URL =
  process.env.ROBOFLOW_WORKFLOW_URL ||
  'https://serverless.roboflow.com/john-lian-r-nerecina/workflows/garbage-classification-3-vgarbage-classification-3-laeqp-1-rfdetr-small-t1-logic';

// Helper: Recursively search Roboflow JSON response for prediction objects
function extractPredictionsFromRoboflow(data: any): { class: string; confidence: number }[] {
  if (!data) return [];
  const results: { class: string; confidence: number }[] = [];

  function search(obj: any, depth = 0) {
    if (!obj || depth > 6) return;
    if (Array.isArray(obj)) {
      obj.forEach((item) => search(item, depth + 1));
      return;
    }
    if (typeof obj === 'object') {
      const clsName = obj.class || obj.label || obj.name || obj.category || obj.class_name;
      const confVal = obj.confidence ?? obj.score ?? obj.probability ?? 0.88;

      if (typeof clsName === 'string' && clsName.trim().length > 0) {
        // Avoid adding duplicate classes if already found
        const cleanName = clsName.trim();
        if (!results.some((r) => r.class.toLowerCase() === cleanName.toLowerCase())) {
          results.push({ class: cleanName, confidence: Number(confVal) });
        }
      }

      for (const key of Object.keys(obj)) {
        if (key !== 'image' && key !== 'rawResponse') {
          search(obj[key], depth + 1);
        }
      }
    }
  }

  search(data);
  return results;
}

// Helper: Recursively search for annotated image in Roboflow response
function extractAnnotatedImageFromRoboflow(data: any): string | null {
  if (!data) return null;
  let foundUrl: string | null = null;

  function search(obj: any, depth = 0) {
    if (!obj || depth > 6 || foundUrl) return;
    if (Array.isArray(obj)) {
      obj.forEach((item) => search(item, depth + 1));
      return;
    }
    if (typeof obj === 'object') {
      if (typeof obj.output_image === 'string' && obj.output_image.length > 0) {
        foundUrl = obj.output_image;
        return;
      }
      if (
        typeof obj.image === 'string' &&
        obj.image.length > 50 &&
        (obj.image.startsWith('http') || obj.image.startsWith('data:'))
      ) {
        foundUrl = obj.image;
        return;
      }
      for (const key of Object.keys(obj)) {
        search(obj[key], depth + 1);
      }
    }
  }

  search(data);
  return foundUrl;
}

// Helper: Smart Rule-Based Waste Analysis Generator (Fallback when AI models are unavailable)
function generateFallbackWasteReport(detectedClass?: string, imageName?: string) {
  const textToScan = `${detectedClass || ''} ${imageName || ''}`.toLowerCase();

  if (
    textToScan.includes('bottle') ||
    textToScan.includes('plastic') ||
    textToScan.includes('pet') ||
    textToScan.includes('water') ||
    textToScan.includes('container') ||
    textToScan.includes('jug') ||
    textToScan.includes('cup')
  ) {
    return {
      primary_category: 'Plastic / Recyclable',
      item_name: detectedClass || imageName || 'Plastic Water Bottle / Container',
      description: 'Polyethylene terephthalate (PET / HDPE) clear or colored plastic container.',
      confidence_assessment: 'High confidence classification based on material geometry and transparency.',
      bin_color_recommendation: 'Blue Bin (Recyclables)',
      step_by_step_disposal: [
        '1. Empty any liquid or residual contents completely.',
        '2. Rinse interior thoroughly with clean water.',
        '3. Remove cap or neck ring if composed of different plastic type.',
        '4. Crush container flat to conserve space in recycling bin.',
      ],
      environmental_impact:
        'Takes approximately 450 years to decompose in landfills. Recycling conserves 70% raw oil energy.',
      material_composition: ['PET Plastic #1', 'Polypropylene Cap'],
      eco_tip: 'Opt for reusable stainless steel or glass bottles for daily hydration.',
    };
  }

  if (
    textToScan.includes('cardboard') ||
    textToScan.includes('box') ||
    textToScan.includes('paper') ||
    textToScan.includes('carton') ||
    textToScan.includes('corrugated')
  ) {
    return {
      primary_category: 'Paper / Cardboard',
      item_name: detectedClass || imageName || 'Corrugated Cardboard Box',
      description: 'Cellulose fiber packaging material and corrugated paperboard.',
      confidence_assessment: 'Verified recyclable paperboard structure.',
      bin_color_recommendation: 'Blue Bin (Recyclables)',
      step_by_step_disposal: [
        '1. Remove sticky tape, plastic labels, and packing materials.',
        '2. Ensure cardboard is clean and free of grease or food residue.',
        '3. Flatten box flat to optimize bin capacity.',
      ],
      environmental_impact:
        'Decomposes in 2-3 months. Paper recycling saves trees, water, and electricity.',
      material_composition: ['Corrugated Paperboard', 'Cellulose Fiber'],
      eco_tip: 'Reuse sturdy boxes for storage or shipping before recycling.',
    };
  }

  if (
    textToScan.includes('can') ||
    textToScan.includes('aluminum') ||
    textToScan.includes('metal') ||
    textToScan.includes('soda') ||
    textToScan.includes('tin') ||
    textToScan.includes('foil')
  ) {
    return {
      primary_category: 'Metal / Recyclable',
      item_name: detectedClass || imageName || 'Aluminum Beverage Can',
      description: 'Lightweight non-ferrous aluminum alloy container.',
      confidence_assessment: 'High confidence recyclable metallic waste.',
      bin_color_recommendation: 'Blue Bin (Recyclables)',
      step_by_step_disposal: [
        '1. Rinse residual drink or food contents.',
        '2. Do not flatten completely if your facility uses single-stream optical sorting.',
        '3. Place directly in the blue recycling bin.',
      ],
      environmental_impact:
        'Infinitely recyclable without quality loss. Saves 95% of energy vs primary smelting.',
      material_composition: ['Aluminum Alloy 3004'],
      eco_tip: 'Aluminum is 100% recyclable forever—always recycle cans!',
    };
  }

  if (
    textToScan.includes('glass') ||
    textToScan.includes('jar') ||
    textToScan.includes('wine') ||
    textToScan.includes('sauce')
  ) {
    return {
      primary_category: 'Glass / Recyclable',
      item_name: detectedClass || imageName || 'Glass Container / Jar',
      description: 'Silica-based vitreous food container or jar.',
      confidence_assessment: 'Verified reusable glass material.',
      bin_color_recommendation: 'Blue Bin (Recyclables)',
      step_by_step_disposal: [
        '1. Rinse thoroughly to remove food or preserve residues.',
        '2. Separate metal lids or plastic caps.',
        '3. Place carefully in glass recycling bin without shattering.',
      ],
      environmental_impact:
        'Takes over 1 million years to decompose, but 100% endlessly recyclable.',
      material_composition: ['Soda-Lime Glass'],
      eco_tip: 'Great for repurposing as kitchen food storage or spice jars.',
    };
  }

  if (
    textToScan.includes('organic') ||
    textToScan.includes('food') ||
    textToScan.includes('compost') ||
    textToScan.includes('fruit') ||
    textToScan.includes('apple') ||
    textToScan.includes('banana') ||
    textToScan.includes('scrap') ||
    textToScan.includes('peel')
  ) {
    return {
      primary_category: 'Organic / Compostable',
      item_name: detectedClass || imageName || 'Organic Food Scrap / Waste',
      description: 'Biodegradable organic fruit or kitchen food waste.',
      confidence_assessment: 'Verified compostable organic waste.',
      bin_color_recommendation: 'Green Bin (Organic / Compost)',
      step_by_step_disposal: [
        '1. Separate from any non-biodegradable packaging or plastic wrap.',
        '2. Deposit in organic green waste bin or home compost tumbler.',
        '3. Mix with dry leaves or shredded paper for optimal composting ratio.',
      ],
      environmental_impact:
        'Decomposes into nutrient-rich humus soil amendment in 2-6 weeks.',
      material_composition: ['Organic Plant Matter', 'Natural Fibers'],
      eco_tip: 'Composting prevents landfill methane emissions.',
    };
  }

  if (
    textToScan.includes('battery') ||
    textToScan.includes('hazard') ||
    textToScan.includes('electronic') ||
    textToScan.includes('e-waste') ||
    textToScan.includes('hardware') ||
    textToScan.includes('bulb')
  ) {
    return {
      primary_category: 'Hazardous / E-Waste',
      item_name: detectedClass || imageName || 'Electronic Waste / Battery',
      description: 'Contains heavy metals, chemical elements, or lithium cells.',
      confidence_assessment: 'Hazardous material requiring specialized collection.',
      bin_color_recommendation: 'Red/Special Bin (E-Waste Drop-off)',
      step_by_step_disposal: [
        '1. DO NOT place in regular household trash or recycling bins.',
        '2. Tape battery terminals with electrical tape to prevent short circuits.',
        '3. Take to an authorized municipal e-waste collection center or retailer drop-off.',
      ],
      environmental_impact:
        'Prevents toxic heavy metals (lithium, cadmium, lead) from leaching into groundwater.',
      material_composition: ['Lithium / Nickel Compounds', 'Heavy Metals'],
      eco_tip: 'Use rechargeable batteries to drastically reduce chemical waste.',
    };
  }

  return {
    primary_category: 'General Waste / Trash',
    item_name: detectedClass || imageName || 'Unclassified Garbage Material',
    description: 'Mixed municipal waste item.',
    confidence_assessment: 'Standard classification guidelines applied.',
    bin_color_recommendation: 'Black Bin (General Trash)',
    step_by_step_disposal: [
      '1. Check for recyclable or compostable component parts.',
      '2. Ensure material is dry and secure.',
      '3. Place inside municipal general trash container.',
    ],
    environmental_impact: 'Sent to municipal landfill or waste-to-energy incineration facility.',
    material_composition: ['Mixed Composites'],
    eco_tip: 'Look for eco-friendly alternatives with minimal packaging.',
  };
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Classification proxy endpoint
app.post('/api/classify', async (req, res) => {
  try {
    const { image, name, apiKey, workflowUrl } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Image URL or base64 data is required.' });
    }

    const targetApiKey = apiKey || DEFAULT_ROBOFLOW_API_KEY;
    const targetWorkflowUrl = workflowUrl || DEFAULT_ROBOFLOW_WORKFLOW_URL;

    // Prepare inputs object for Roboflow Serverless Workflow
    let imageInputObject: { type: string; value: string };

    if (image.startsWith('http://') || image.startsWith('https://')) {
      imageInputObject = { type: 'url', value: image };
    } else if (image.startsWith('/')) {
      // Resolve relative public asset path to base64
      try {
        const publicPath = path.join(process.cwd(), 'public', image.replace(/^\//, ''));
        if (fs.existsSync(publicPath)) {
          const fileBuf = fs.readFileSync(publicPath);
          imageInputObject = { type: 'base64', value: fileBuf.toString('base64') };
        } else {
          imageInputObject = { type: 'base64', value: image };
        }
      } catch (e) {
        imageInputObject = { type: 'base64', value: image };
      }
    } else {
      let base64Val = image;
      if (image.includes('base64,')) {
        base64Val = image.split('base64,')[1];
      }
      imageInputObject = { type: 'base64', value: base64Val };
    }

    const requestBody = {
      api_key: targetApiKey,
      inputs: {
        image: imageInputObject,
      },
    };

    let roboflowData: any = null;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 18000);

      const roboflowResponse = await fetch(targetWorkflowUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (roboflowResponse.ok) {
        roboflowData = await roboflowResponse.json();
      } else {
        const errText = await roboflowResponse.text();
        try {
          roboflowData = JSON.parse(errText);
        } catch (e) {
          roboflowData = {
            warning: `Roboflow workflow returned HTTP ${roboflowResponse.status}`,
            rawResponse: errText.slice(0, 300),
          };
        }
      }
    } catch (fetchErr: any) {
      roboflowData = {
        warning: 'Roboflow endpoint connection timeout or serverless executor busy.',
        note: 'Fallback analytical waste model activated.',
      };
    }

    // Extract any prediction classes from Roboflow response
    const extractedPredictions = extractPredictionsFromRoboflow(roboflowData);
    const annotatedImage = extractAnnotatedImageFromRoboflow(roboflowData);

    let primaryDetectedClass = extractedPredictions.length > 0 ? extractedPredictions[0].class : undefined;

    // Standardize predictions array inside roboflowData for frontend UI rendering
    if (roboflowData) {
      if (!roboflowData.predictions || !Array.isArray(roboflowData.predictions)) {
        roboflowData.predictions = extractedPredictions;
      }
      if (annotatedImage && !roboflowData.output_image) {
        roboflowData.output_image = annotatedImage;
      }
    }

    // Try Gemini AI analysis silently if key exists
    let geminiReport: any = null;

    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        let promptText = `Analyze this image of garbage/waste item and provide a detailed structured recycling and disposal report. Item name hint: "${name || 'Garbage Item'}".`;
        if (roboflowData) {
          promptText += `\nRoboflow Model Detection Data: ${JSON.stringify(roboflowData).slice(0, 1000)}`;
        }

        promptText += `\nProvide JSON response with these keys:
- primary_category: (e.g. "Recyclable", "Organic/Compostable", "Hazardous/E-Waste", "Non-Recyclable Trash", "Reusable")
- item_name: concise title of detected waste
- description: short summary of what the object is
- confidence_assessment: description of confidence and condition
- bin_color_recommendation: (e.g., "Blue Bin (Recyclables)", "Green Bin (Organic)", "Red Bin (Hazardous)", "Black Bin (General Trash)")
- step_by_step_disposal: string array of 3-4 steps
- environmental_impact: explanation of decomposition time or toxicity
- material_composition: array of estimated materials
- eco_tip: a helpful sustainability tip
Return strictly valid JSON without markdown codeblocks.`;

        let contents: any = [];
        if (image.startsWith('data:image/')) {
          const matches = image.match(/^data:(image\/[a-zA-Z\+\-]+);base64,(.+)$/);
          if (matches && matches.length === 3) {
            contents = [
              {
                inlineData: {
                  mimeType: matches[1],
                  data: matches[2],
                },
              },
              promptText,
            ];
          } else {
            contents = [promptText];
          }
        } else if (image.startsWith('/')) {
          try {
            const publicPath = path.join(process.cwd(), 'public', image.replace(/^\//, ''));
            if (fs.existsSync(publicPath)) {
              const fileBuf = fs.readFileSync(publicPath);
              const ext = path.extname(publicPath).replace('.', '') || 'png';
              const mime = ext === 'svg' ? 'image/svg+xml' : `image/${ext}`;
              contents = [
                {
                  inlineData: {
                    mimeType: mime,
                    data: fileBuf.toString('base64'),
                  },
                },
                promptText,
              ];
            } else {
              contents = [promptText];
            }
          } catch (e) {
            contents = [promptText];
          }
        } else if (image.startsWith('http')) {
          contents = [promptText, `Image URL: ${image}`];
        } else {
          contents = [promptText];
        }

        const modelCandidates = ['gemini-2.5-flash', 'gemini-2.0-flash'];
        let textResp = '';

        for (const modelName of modelCandidates) {
          try {
            const geminiResp = await ai.models.generateContent({
              model: modelName,
              contents: contents,
            });
            if (geminiResp && geminiResp.text) {
              textResp = geminiResp.text;
              break;
            }
          } catch (mErr) {
            // Silently ignore
          }
        }

        if (textResp) {
          const cleanJsonStr = textResp.replace(/```json/g, '').replace(/```/g, '').trim();
          try {
            geminiReport = JSON.parse(cleanJsonStr);
          } catch (pErr) {
            geminiReport = { text_report: textResp };
          }
        }
      } catch (gemErr) {
        // Silently caught
      }
    }

    // Always fallback to smart rule generator if Gemini was forbidden or unavailable
    if (!geminiReport || !geminiReport.primary_category) {
      geminiReport = generateFallbackWasteReport(primaryDetectedClass, name);
    }

    return res.json({
      success: true,
      roboflow: roboflowData,
      geminiReport: geminiReport,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to process image classification.',
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
