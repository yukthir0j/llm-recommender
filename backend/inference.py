# Modified inference.py for API-based approach
import requests
import os
from typing import Dict, List

class LLMRecommenderEngine:
    def __init__(self):
        self.model_database = self.load_model_database()
        self.criteria_weights = {
            'use_case_match': 0.3,
            'performance': 0.25,
            'cost': 0.2,
            'ease_of_use': 0.15,
            'license': 0.1
        }
    
    def load_model_database(self) -> Dict:
        """Load comprehensive model database with scoring"""
        return {
            'text_generation': {
                'gpt-4o': {'score': 9.5, 'cost': 'high', 'license': 'commercial', 'source': 'OpenAI'},
                'claude-3-sonnet': {'score': 9.2, 'cost': 'high', 'license': 'commercial', 'source': 'Anthropic'},
                'llama-3-70b': {'score': 8.8, 'cost': 'medium', 'license': 'open', 'source': 'Meta'},
                'mistral-7b': {'score': 8.5, 'cost': 'low', 'license': 'apache-2.0', 'source': 'Mistral'}
            },
            'code_generation': {
                'claude-3-sonnet': {'score': 9.8, 'cost': 'high', 'license': 'commercial', 'source': 'Anthropic'},
                'gpt-4o': {'score': 9.3, 'cost': 'high', 'license': 'commercial', 'source': 'OpenAI'},
                'codellama-34b': {'score': 8.9, 'cost': 'medium', 'license': 'open', 'source': 'Meta'}
            },
            'question_answering': {
                'gpt-4o': {'score': 9.4, 'cost': 'high', 'license': 'commercial', 'source': 'OpenAI'},
                'claude-3-haiku': {'score': 9.1, 'cost': 'medium', 'license': 'commercial', 'source': 'Anthropic'},
                'gemma-7b': {'score': 8.3, 'cost': 'low', 'license': 'apache-2.0', 'source': 'Google'}
            }
        }
    
    def analyze_use_case(self, user_input: str) -> str:
        """Analyze user input to determine use case category"""
        use_case_keywords = {
            'text_generation': ['generate', 'write', 'create', 'content', 'article', 'story'],
            'code_generation': ['code', 'program', 'develop', 'script', 'function', 'debug'],
            'question_answering': ['answer', 'explain', 'help', 'question', 'support', 'faq'],
            'summarization': ['summarize', 'summary', 'brief', 'overview', 'digest'],
            'translation': ['translate', 'language', 'convert', 'localize']
        }
        
        user_lower = user_input.lower()
        scores = {}
        
        for category, keywords in use_case_keywords.items():
            score = sum(1 for keyword in keywords if keyword in user_lower)
            scores[category] = score
        
        return max(scores, key=scores.get) if max(scores.values()) > 0 else 'text_generation'
    
    def recommend_models(self, user_input: str) -> List[Dict]:
        """Generate model recommendations based on user input"""
        use_case = self.analyze_use_case(user_input)
        
        # Get models for the identified use case
        models = self.model_database.get(use_case, self.model_database['text_generation'])
        
        # Sort by score and return top 3
        sorted_models = sorted(models.items(), key=lambda x: x[1]['score'], reverse=True)[:3]
        
        recommendations = []
        for model_name, details in sorted_models:
            recommendation = {
                'name': model_name,
                'score': details['score'],
                'cost': details['cost'],
                'license': details['license'],
                'source': details['source'],
                'use_case': use_case,
                'reasoning': self.generate_reasoning(model_name, details, use_case),
                'links': self.generate_links(model_name, details['source'])
            }
            recommendations.append(recommendation)
        
        return recommendations
    
    def generate_reasoning(self, model_name: str, details: Dict, use_case: str) -> str:
        """Generate reasoning for model recommendation"""
        reasoning_templates = {
            'text_generation': f"Recommended for {use_case} due to strong performance (score: {details['score']}/10) and {details['license']} license",
            'code_generation': f"Excellent for {use_case} with high accuracy (score: {details['score']}/10) and good documentation",
            'question_answering': f"Optimal for {use_case} with reliable responses (score: {details['score']}/10) and cost-effective pricing"
        }
        
        base_reason = reasoning_templates.get(use_case, f"Good fit for {use_case} with score {details['score']}/10")
        
        cost_reason = {
            'low': "Budget-friendly option",
            'medium': "Balanced cost-performance ratio",
            'high': "Premium option with advanced features"
        }.get(details['cost'], "")
        
        return f"{base_reason}. {cost_reason}. Source: {details['source']}"
    
    def generate_links(self, model_name: str, source: str) -> Dict:
        """Generate relevant links for the model"""
        link_mapping = {
            'OpenAI': f"https://platform.openai.com/docs/models/{model_name}",
            'Anthropic': f"https://docs.anthropic.com/claude/reference/{model_name}",
            'Meta': f"https://huggingface.co/meta-llama/{model_name}",
            'Mistral': f"https://huggingface.co/mistralai/{model_name}",
            'Google': f"https://huggingface.co/google/{model_name}"
        }
        
        return {
            'documentation': link_mapping.get(source, f"https://huggingface.co/models?search={model_name}"),
            'huggingface': f"https://huggingface.co/models?search={model_name}",
            'pricing': f"https://huggingface.co/pricing" if source not in ['OpenAI', 'Anthropic'] else f"https://{source.lower()}.com/pricing"
        }

# Modified generate_response function
def generate_response(prompt: str) -> str:
    """Generate response using the recommender engine"""
    recommender = LLMRecommenderEngine()
    recommendations = recommender.recommend_models(prompt)
    
    if not recommendations:
        return "I couldn't find suitable model recommendations for your use case. Please provide more specific requirements."
    
    # Format response for the frontend
    response_parts = []
    for i, rec in enumerate(recommendations, 1):
        response_parts.append(f"""
**{i}. {rec['name'].upper()}**
📊 **Score:** {rec['score']}/10
💰 **Cost:** {rec['cost'].title()}
📜 **License:** {rec['license']}
🏢 **Source:** {rec['source']}
💡 **Why:** {rec['reasoning']}
🔗 **Links:** [Documentation]({rec['links']['documentation']}) | [HuggingFace]({rec['links']['huggingface']}) | [Pricing]({rec['links']['pricing']})
""")
    
    return "\n".join(response_parts)
