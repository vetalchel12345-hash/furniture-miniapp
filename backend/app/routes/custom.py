from fastapi import APIRouter
from app.db import database
from app.models import CustomOrderCreate

router = APIRouter()


@router.post("/custom-order")
async def create_custom_order(payload: CustomOrderCreate):
    order_id = await database.execute(
        """
        INSERT INTO custom_orders(furniture_type, dimensions, material, description, contacts)
        VALUES (?, ?, ?, ?, ?)
        """,
        (
            payload.furniture_type,
            payload.dimensions,
            payload.material,
            payload.description,
            payload.contacts,
        ),
    )
    return {"ok": True, "custom_order_id": order_id}
