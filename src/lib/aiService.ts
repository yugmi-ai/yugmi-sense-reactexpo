// Enhanced AI Service Integration for YugmiInspector
import { MediaUploadData, AiAnalysis } from '../types';
import * as FileSystem from 'expo-file-system';

// Multi-service AI integration supporting:
// - Google Vision AI
// - AWS Rekognition  
// - Azure Computer Vision
// - OpenAI Vision
// - Custom ML models

interface AIProvider {
  name: string;
  analyze: (imageUri: string) => Promise<any>;
}

class AIAnalysisService {
  private readonly GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_VISION_API_KEY;
  private readonly OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  private readonly AWS_ACCESS_KEY = process.env.EXPO_PUBLIC_AWS_ACCESS_KEY_ID;
  private readonly AWS_SECRET_KEY = process.env.EXPO_PUBLIC_AWS_SECRET_ACCESS_KEY;
  private readonly AWS_REGION = process.env.EXPO_PUBLIC_AWS_REGION || 'us-east-1';
  
  private providers: AIProvider[] = [];

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    // Google Vision AI
    if (this.GOOGLE_API_KEY) {
      this.providers.push({
        name: 'Google Vision',
        analyze: this.analyzeWithGoogle.bind(this)
      });
    }

    // OpenAI Vision
    if (this.OPENAI_API_KEY) {
      this.providers.push({
        name: 'OpenAI Vision',
        analyze: this.analyzeWithOpenAI.bind(this)
      });
    }

    // AWS Rekognition
    if (this.AWS_ACCESS_KEY && this.AWS_SECRET_KEY) {
      this.providers.push({
        name: 'AWS Rekognition',
        analyze: this.analyzeWithAWS.bind(this)
      });
    }
  }
  
  async analyzeImage(imageUri: string, mediaType: 'image' | 'video' = 'image'): Promise<AiAnalysis> {
    try {
      // Try multiple AI providers for better analysis
      let analysisResult = null;
      let usedProvider = 'Fallback';

      for (const provider of this.providers) {
        try {
          console.log(`Attempting analysis with ${provider.name}...`);
          analysisResult = await provider.analyze(imageUri);
          usedProvider = provider.name;
          break;
        } catch (error) {
          console.warn(`${provider.name} analysis failed:`, error);
          continue;
        }
      }

      if (analysisResult) {
        return this.processAIResponse(analysisResult, usedProvider);
      } else {
        return this.generateFallbackAnalysis();
      }
      
    } catch (error) {
      console.error('All AI Analysis providers failed:', error);
      return this.generateFallbackAnalysis();
    }
  }

  private async analyzeWithGoogle(imageUri: string): Promise<any> {
    const base64Image = await this.convertToBase64(imageUri);
    
    const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${this.GOOGLE_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            image: { content: base64Image },
            features: [
              { type: 'OBJECT_LOCALIZATION', maxResults: 20 },
              { type: 'LABEL_DETECTION', maxResults: 20 },
              { type: 'TEXT_DETECTION', maxResults: 10 },
              { type: 'SAFE_SEARCH_DETECTION' },
              { type: 'IMAGE_PROPERTIES' }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Google Vision API error: ${response.statusText}`);
    }

    return await response.json();
  }

  private async analyzeWithOpenAI(imageUri: string): Promise<any> {
    const base64Image = await this.convertToBase64(imageUri);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this construction/inspection image. Identify any structural issues, safety concerns, damage, cracks, corrosion, leaks, or maintenance needs. Provide detailed findings with severity levels (low, medium, high, critical)."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 500
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    return await response.json();
  }

  private async analyzeWithAWS(imageUri: string): Promise<any> {
    // AWS Rekognition implementation would go here
    // This requires AWS SDK setup which is more complex
    throw new Error('AWS Rekognition not implemented yet');
  }

  private async convertToBase64(uri: string): Promise<string> {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private processAIResponse(response: any, provider: string): AiAnalysis {
    let detectedObjects: string[] = [];
    let detectedIssues: any[] = [];
    let analysisText = '';
    let confidence = 0.5;

    if (provider === 'Google Vision') {
      const objects = response.responses?.[0]?.localizedObjectAnnotations || [];
      const labels = response.responses?.[0]?.labelAnnotations || [];
      const textAnnotations = response.responses?.[0]?.textAnnotations || [];
      
      detectedObjects = [...objects.map((obj: any) => obj.name), ...labels.map((label: any) => label.description)];
      detectedIssues = this.detectConstructionIssues(labels, objects);
      confidence = this.calculateAverageConfidence(labels);
      
    } else if (provider === 'OpenAI Vision') {
      const content = response.choices?.[0]?.message?.content || '';
      const analysis = this.parseOpenAIResponse(content);
      detectedObjects = analysis.objects;
      detectedIssues = analysis.issues;
      confidence = 0.8;
      analysisText = content;
    }

    if (!analysisText) {
      analysisText = this.generateAnalysisText(detectedObjects, detectedIssues, provider);
    }
    
    return {
      id: Date.now(),
      mediaItemId: Date.now(),
      analysisText,
      detectedObjects: [...new Set(detectedObjects)], // Remove duplicates
      detectedIssues,
      confidence,
      createdAt: new Date().toISOString()
    };
  }

  private parseOpenAIResponse(content: string): { objects: string[], issues: any[] } {
    const objects: string[] = [];
    const issues: any[] = [];

    // Extract objects and issues from OpenAI response
    const lines = content.toLowerCase().split('\n');
    
    lines.forEach(line => {
      // Look for severity indicators
      if (line.includes('critical') || line.includes('severe')) {
        issues.push({
          type: this.extractIssueType(line),
          severity: 'critical',
          description: line.trim(),
          confidence: 0.8
        });
      } else if (line.includes('high risk') || line.includes('urgent')) {
        issues.push({
          type: this.extractIssueType(line),
          severity: 'high',
          description: line.trim(),
          confidence: 0.75
        });
      } else if (line.includes('moderate') || line.includes('medium')) {
        issues.push({
          type: this.extractIssueType(line),
          severity: 'medium',
          description: line.trim(),
          confidence: 0.7
        });
      } else if (line.includes('minor') || line.includes('low')) {
        issues.push({
          type: this.extractIssueType(line),
          severity: 'low',
          description: line.trim(),
          confidence: 0.6
        });
      }

      // Extract common construction objects
      const constructionTerms = ['concrete', 'steel', 'rebar', 'beam', 'column', 'wall', 'foundation', 'pipe', 'joint', 'surface'];
      constructionTerms.forEach(term => {
        if (line.includes(term)) {
          objects.push(term);
        }
      });
    });

    return { objects, issues };
  }

  private extractIssueType(text: string): string {
    const issueTypes = ['crack', 'corrosion', 'damage', 'leak', 'wear', 'deterioration', 'defect', 'failure'];
    const foundType = issueTypes.find(type => text.includes(type));
    return foundType || 'general_issue';
  }

  private calculateAverageConfidence(labels: any[]): number {
    if (labels.length === 0) return 0.5;
    const total = labels.reduce((sum, label) => sum + (label.score || 0), 0);
    return Math.min(total / labels.length, 1.0);
  }

  private detectConstructionIssues(labels: any[], objects: any[]) {
    const issues = [];
    const constructionKeywords = {
      'crack': { severity: 'high' as const, description: 'Structural crack detected' },
      'damage': { severity: 'medium' as const, description: 'Surface damage identified' },
      'corrosion': { severity: 'high' as const, description: 'Corrosion signs detected' },
      'leak': { severity: 'critical' as const, description: 'Water leak detected' },
      'wear': { severity: 'low' as const, description: 'Normal wear and tear' }
    };

    labels.forEach(label => {
      const keyword = Object.keys(constructionKeywords).find(key => 
        label.description.toLowerCase().includes(key)
      );
      
      if (keyword) {
        const issue = constructionKeywords[keyword as keyof typeof constructionKeywords];
        issues.push({
          type: keyword,
          severity: issue.severity,
          description: issue.description,
          confidence: label.score || 0.5
        });
      }
    });

    return issues;
  }

  private generateAnalysisText(objects: string[], issues: any[]): string {
    if (issues.length === 0) {
      return `Analysis complete. Detected ${objects.length} objects. No significant issues found.`;
    }
    
    return `Analysis detected ${issues.length} potential issue(s). ${objects.length} objects identified. Recommend inspection by qualified personnel.`;
  }

  private generateFallbackAnalysis(): AiAnalysis {
    return {
      id: Date.now(),
      mediaItemId: Date.now(),
      analysisText: "AI analysis temporarily unavailable. Manual review recommended.",
      detectedObjects: [],
      detectedIssues: [],
      confidence: 0.5,
      createdAt: new Date().toISOString()
    };
  }
}

export const aiService = new AIAnalysisService();
