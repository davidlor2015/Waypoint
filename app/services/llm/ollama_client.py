import json
from typing import AsyncGenerator

import httpx
import logging

from app.core.config import settings


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

    async def stream_json(
        self, system_prompt: str, user_prompt: str
    ) -> AsyncGenerator[str, None]:
        """
        Calls Ollama with stream=True and yields raw token strings as they
        arrive.  Each yielded value is the 'content' field from one Ollama
        chunk; callers are responsible for assembling the full text.
        """
        url = f"{self.base_url}/api/chat"
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "stream": True,
            "format": "json",
            "options": {
                "temperature": 0.7,
                "num_predict": 2048,
            },
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                async with client.stream("POST", url, json=payload) as response:
                    response.raise_for_status()
                    async for line in response.aiter_lines():
                        if not line:
                            continue
                        try:
                            data = json.loads(line)
                        except json.JSONDecodeError:
                            continue
                        token = data.get("message", {}).get("content", "")
                        if token:
                            yield token
                        if data.get("done", False):
                            break

        except httpx.ConnectError:
            logger.error(f"Could not connect to Ollama at {self.base_url}")
            raise Exception("Could not connect to LLM")

        except httpx.ReadTimeout:
            logger.error("Ollama timed out during streaming")
            raise Exception("AI timeout: model took too long to generate a plan")

        except Exception as e:
            logger.error(f"Ollama streaming error: {e}")
            raise e
