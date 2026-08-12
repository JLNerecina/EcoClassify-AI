export interface RoboflowPrediction {
  class?: string;
  confidence?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  [key: string]: any;
}

export interface RoboflowOutput {
  predictions?: RoboflowPrediction[];
  output_image?: string;
  image?: {
    width?: number;
    height?: number;
  };
  [key: string]: any;
}

export interface GeminiReport {
  primary_category?: string;
  item_name?: string;
  description?: string;
  confidence_assessment?: string;
  bin_color_recommendation?: string;
  step_by_step_disposal?: string[];
  environmental_impact?: string;
  material_composition?: string[];
  eco_tip?: string;
  text_report?: string;
}

export interface ClassificationResult {
  success: boolean;
  roboflow?: any;
  geminiReport?: GeminiReport;
  timestamp: string;
  error?: string;
}

export interface HistoryItem {
  id: string;
  timestamp: string;
  imageUrl: string;
  imageName: string;
  category: string;
  result: ClassificationResult;
}

export interface SampleGarbageImage {
  id: string;
  name: string;
  category: string;
  url: string;
  description: string;
}
