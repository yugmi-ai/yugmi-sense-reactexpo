// AI Service Integration for YugmiInspector
import { MediaUploadData, AiAnalysis } from '../types';

// You can integrate with services like:
// - Google Vision AI
// - AWS Rekognition  
// - Azure Computer Vision
// - Custom ML models

class AIAnalysisService {
  private readonly API_KEY = process.env.EXPO_PUBLIC_AI_API_KEY;
  
  async analyzeImage(imageUri: string, mediaType: 'image' | 'video'): Promise<AiAnalysis> {
    try {
      // Example integration with Google Vision AI
      const base64Image = await this.convertToBase64(imageUri);
      
      const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${this.API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              image: { content: base64Image },
              features: [
                { type: 'OBJECT_LOCALIZATION', maxResults: 10 },
                { type: 'LABEL_DETECTION', maxResults: 10 },
                { type: 'SAFE_SEARCH_DETECTION' }
              ]
            }
          ]
        })
      });

      const result = await response.json();
      return this.processAIResponse(result);
      
    } catch (error) {
      console.error('AI Analysis failed:', error);
      return this.generateFallbackAnalysis();
    }
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

  private processAIResponse(response: any): AiAnalysis {
    const objects = response.responses?.[0]?.localizedObjectAnnotations || [];
    const labels = response.responses?.[0]?.labelAnnotations || [];
    
    // Process detected objects
    const detectedObjects = objects.map((obj: any) => obj.name);
    
    // Analyze for construction/inspection issues
    const detectedIssues = this.detectConstructionIssues(labels, objects);
    
    return {
      id: Date.now(),
      mediaItemId: Date.now(),
      analysisText: this.generateAnalysisText(detectedObjects, detectedIssues),
      detectedObjects,
      detectedIssues,
      confidence: 0.85,
      createdAt: new Date().toISOString()
    };
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
