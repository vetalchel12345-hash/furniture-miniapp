from pydantic import BaseModel
from typing import List


class ProductOut(BaseModel):
    id: int
    category: str
    name: str
    description: str
    price: int
    photos: List[str]


class CartItem(BaseModel):
    id: int
    qty: int


class OrderCreate(BaseModel):
    customer_name: str
    phone: str
    city: str
    comment: str = ""
    items: List[CartItem]
    total_price: int


class CustomOrderCreate(BaseModel):
    furniture_type: str
    dimensions: str
    material: str
    description: str
    contacts: str
