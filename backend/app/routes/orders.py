import json
from fastapi import APIRouter
from app.db import database
from app.models import OrderCreate

router = APIRouter()


@router.post("/order")
async def create_order(payload: OrderCreate):
    order_id = await database.execute(
        """
        INSERT INTO orders(customer_name, phone, city, comment, items, total_price)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (
            payload.customer_name,
            payload.phone,
            payload.city,
            payload.comment,
            json.dumps([item.model_dump() for item in payload.items], ensure_ascii=False),
            payload.total_price,
        ),
    )
    return {"ok": True, "order_id": order_id}
