import os

import torch

from convex import ConvexClient
from dotenv import load_dotenv
from typing import Optional

load_dotenv()

CONVEX_CLOUD_URL = os.getenv("CONVEX_CLOUD_URL")

client: Optional[ConvexClient] = (
    ConvexClient(CONVEX_CLOUD_URL) if CONVEX_CLOUD_URL else None
)

def get_client() -> ConvexClient:
    if client is None:
        raise RuntimeError("ConvexClient not initialized")
    return client