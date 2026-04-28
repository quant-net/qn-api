from typing import List, Dict, Any, Optional, Type
from pydantic import BaseModel, create_model
from enum import Enum

class EndpointGenerator:
    def create_endpoint(self, path: str, http_method: str, method_name: str, parameters: dict,
                       mqtt_topic: str = None, tags: List[str] = None, 
                       summary: str = None, description: str = None, mqtt_client_call_type: str = None, mqtt_client_call_name: str = None, mqtt_client_param_name: str = None) -> str:
        
        # Generate fastapi endpoint code
        endpoint_code = f"""
@app.{http_method}("{path}", summary="{summary}", tags={tags})
async def {method_name.lower()}({self._generate_parameter_declarations(parameters)}):
    \"\"\"{description or ''}\"\"\"
    result = await mqtt_{method_name.lower()}(app, config, {parameters})
    return result
"""

        # Generate handler code
        handler_code = f"""

async def mqtt_{method_name.lower()}(app: FastAPI, config: Config, params: dict) -> dict:
    
    client = get_client(config)
    
    result = await client.run{method_name.lower()}(
        params
    )
    return result
"""

        # Generate mqtt client code
        client_code = f"""

async def run{method_name.lower()}(self, params):
    payload = {{
        "type": "{mqtt_client_call_type}",
        "parameters": {{
            "name":"{mqtt_client_param_name}",
            "params":params
        }}
    }}
    
    try:
        response = await self.client.call("{mqtt_client_call_name}", payload)
    except Exception as e:
        raise e
    ret = json.loads(response)

    return ret
"""

        # Append the content to files
        with open("fastapi_endpoint.py", "a") as f:
            f.write(endpoint_code)

        with open("handler.py", "a") as f:
            f.write(handler_code)

        with open("mqtt_client.py", "a") as f:
            f.write(client_code)     

        return "Code written to fastapi_endpoint.py, handler.py, and mqtt_client.py"

    def _generate_parameter_declarations(self, parameters: dict) -> str:
        return ", ".join([f"{k}='{v}'" for k, v in parameters.items()])

    @staticmethod
    def _type_to_str(type_: Type) -> str:
        if hasattr(type_, "__origin__"):
            origin = type_.__origin__.__name__
            args = ", ".join([arg.__name__ for arg in type_.__args__])
            return f"{origin}[{args}]"
        return type_.__name__

    # Example usage
if __name__ == "__main__":
    generator = EndpointGenerator()
    
    parameters = {"src":"Alice","dst":"Bob","protocol":"EGP","distance":2,"numQubits":3}

    result = generator.create_endpoint(
        path="/simplelink/",
        http_method='post',
        method_name="simplelink",
        parameters=parameters,
        mqtt_topic="simplelink",
        tags=["Entanglement"],
        summary="Run an entanglement simulation over a simple link",
        description="Simulates network conditions between two nodes",
        mqtt_client_call_type="simulate",
        mqtt_client_call_name="simulate",
        mqtt_client_param_name="simulate",
    )

    print(result)    