import requests
import json
import os
import uuid
from pathlib import Path
from urllib3.util.retry import Retry
from requests.adapters import HTTPAdapter
from typing import Optional, Dict, Any, List

class BaseCommerceClient:
    """
    通用电商 API 基础客户端，支持无状态身份验证、购物车管理、产品查询等。
    可轻松迁移至任何遵循通用 Agent 协议的电商平台。
    """
    def __init__(self, base_url: str, brand_id: str):
        self.base_url = base_url.rstrip('/')
        self.brand_id = brand_id
        self.creds_file = Path.home() / f".{brand_id}_creds.json"
        self.visitor_file = Path.home() / f".{brand_id}_visitor.json"
        self.session = self._setup_session()

    def _setup_session(self):
        s = requests.Session()
        retry = Retry(total=3, backoff_factor=0.5, status_forcelist=[500, 502, 503, 504])
        adapter = HTTPAdapter(max_retries=retry)
        s.mount("http://", adapter)
        s.mount("https://", adapter)
        
        # 注入 Visitor ID
        visitor_id = self._get_visitor_id()
        s.headers.update({"x-visitor-id": visitor_id})
        
        # 注入身份信息（如果存在）
        creds = self.load_credentials()
        if creds:
            s.headers.update({
                "x-user-account": str(creds.get("account", "")),
                "x-user-password": str(creds.get("password", ""))
            })
        return s

    def _get_visitor_id(self) -> str:
        if not self.visitor_file.exists():
            visitor_id = str(uuid.uuid4())
            with open(self.visitor_file, "w") as f:
                json.dump({"visitor_id": visitor_id}, f)
            return visitor_id
        try:
            with open(self.visitor_file, "r") as f:
                return json.load(f).get("visitor_id")
        except:
            return str(uuid.uuid4())

    def save_credentials(self, account, password):
        with open(self.creds_file, "w") as f:
            json.dump({"account": account, "password": password}, f)
        os.chmod(self.creds_file, 0o600)
        # 更新当前会话
        self.session.headers.update({
            "x-user-account": account,
            "x-user-password": password
        })

    def load_credentials(self) -> Optional[Dict]:
        if self.creds_file.exists():
            try:
                with open(self.creds_file, "r") as f:
                    return json.load(f)
            except:
                return None
        return None

    def delete_credentials(self):
        if self.creds_file.exists():
            self.creds_file.unlink()
        self.session.headers.pop("x-user-account", None)
        self.session.headers.pop("x-user-password", None)

    def request(self, method: str, path: str, **kwargs) -> Dict[str, Any]:
        url = f"{self.base_url}{path}"
        try:
            response = self.session.request(method, url, timeout=10, **kwargs)
            return self._handle_response(response)
        except Exception as e:
            return {"success": False, "error": f"Connection error: {str(e)}"}

    def _handle_response(self, response: requests.Response) -> Dict[str, Any]:
        try:
            data = response.json()
            if not isinstance(data, dict):
                data = {"result": data}
            if response.status_code >= 400 and "status_code" not in data:
                data["status_code"] = response.status_code
            return data
        except:
            return {
                "success": False,
                "error": f"Invalid API response (HTTP {response.status_code})",
                "status_code": response.status_code
            }

    # --- 核心业务接口 ---
    
    def search_products(self, query: str):
        return self.request("GET", "/products", params={"q": query})

    def list_products(self):
        return self.request("GET", "/products")

    def get_product(self, slug: str):
        return self.request("GET", f"/products/{slug}")

    def get_profile(self):
        return self.request("GET", "/user/profile")

    def update_profile(self, data: Dict):
        return self.request("PUT", "/user/profile", json=data)

    def get_cart(self):
        return self.request("GET", "/cart")

    def modify_cart(self, action: str, product_slug: str, gram: int, quantity: int = 1):
        # action: "add" (increment) or "update" (set)
        method = "POST" if action == "add" else "PUT"
        return self.request(method, "/cart", json={
            "product_slug": product_slug,
            "gram": gram,
            "quantity": quantity
        })

    def remove_from_cart(self, product_slug: str, gram: int):
        return self.request("DELETE", "/cart", json={
            "product_slug": product_slug,
            "gram": gram
        })

    def clear_cart(self):
        return self.request("DELETE", "/cart", json={"clear_all": True})

    def get_promotions(self):
        return self.request("GET", "/promotions")

    def get_brand_info(self, category: str):
        return self.request("GET", "/brand", params={"category": category})

    def list_orders(self):
        # 兼容性处理：Lafeitu 目前 orders 在 /api/orders
        return self.request("GET", "/orders" if "/v1" not in self.base_url else "/../orders")
