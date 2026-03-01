import requests
import os
from dotenv import load_dotenv

load_dotenv()
CONVEX_CLOUD_URL = os.getenv("CONVEX_CLOUD_URL")



def query(table_name: str) -> dict:
    response = requests.post(
        f"{CONVEX_CLOUD_URL}/api/query",
        json={"path": f"helpers:list",
              "args": {"table_name": table_name}},
    )
    return response.json()

def main():
    data = query("users")
    data2 = query("comments")
    print(data)
    print(data2)


if __name__ == "__main__":
    main()

