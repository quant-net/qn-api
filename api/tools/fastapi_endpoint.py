from fastapi import FastAPI, HTTPException
from typing import Optional, Dict, Any
from pydantic import BaseModel
from common.config import Config
config = Config()

app = FastAPI()

