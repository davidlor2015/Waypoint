
from app.core.config import settings

import httpx
import logging


logger = logging.getLogger(__name__)
class OllamaClient:


    def __init__(self):

        self.base_url = settings.OLLAMA_BASE_URL

        self.model = settings.OLLAMA_MODEL

        self.timeout = settings.OLLAMA_TIMEOUT_SECONDS

    async def generate_json(self, system_prompt: str, user_prompt: str):
        url = f"{self.base_url}/api/chat"

        payload = {
            "model": self.model,

            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],

            "stream": False,
            
            "format": "json",

            "options": {
                "temperature": 0.7,
                "num_predict": 2048,
            }
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:

                response = await client.post(url, json=payload)

                response.raise_for_status()

                data = response.json()

                return data.get("message", {}).get("content", "")

        except httpx.ConnectError:
            logger.error(
                f"Could not connect  to Ollama at {self.base_url}"
            )
            raise Exception(
                "Could not connect to LLM"
            )
        
        except httpx.ReadTimeout:
            logger.error("Ollama timed out generating response")
            raise Exception(
                "Ai Timeout: model took too long to generate a plan"
            )
        
        except Exception as e:
            logger.error(f"Ollama Error: {str(e)}")
            raise e
            
