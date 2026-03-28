import json
from typing import Optional
from fastapi import APIRouter, Query
from app.db import database

router = APIRouter()


@router.get("/products")
async def get_products(
    category: Optional[str] = None,
    search: Optional[str] = None,
    min_price: Optional[int] = Query(default=None),
    max_price: Optional[int] = Query(default=None),
):
    query = "SELECT * FROM products WHERE 1=1"
    params = []

    if category:
        query += " AND category = ?"
        params.append(category)

    if search:
        query += " AND (LOWER(name) LIKE ? OR LOWER(description) LIKE ? OR LOWER(short_specs) LIKE ?)"
        term = f"%{search.lower()}%"
        params.extend([term, term, term])

    if min_price is not None:
        query += " AND price >= ?"
        params.append(min_price)

    if max_price is not None:
        query += " AND price <= ?"
        params.append(max_price)

    query += " ORDER BY id DESC"

    rows = await database.fetchall(query, tuple(params))

    return [
        {
            "id": row["id"],
            "category": row["category"],
            "name": row["name"],
            "description": row["description"],
            "price": row["price"],
            "old_price": row["old_price"],
            "badge": row["badge"],
            "short_specs": row["short_specs"],
            "photos": json.loads(row["photos"]),
            "specs": json.loads(row["specs"]),
        }
        for row in rows
    ]


@router.get("/products/{product_id}")
async def get_product(product_id: int):
    row = await database.fetchone("SELECT * FROM products WHERE id = ?", (product_id,))
    if not row:
        return {"error": "Товар не найден"}

    return {
        "id": row["id"],
        "category": row["category"],
        "name": row["name"],
        "description": row["description"],
        "price": row["price"],
        "old_price": row["old_price"],
        "badge": row["badge"],
        "short_specs": row["short_specs"],
        "photos": json.loads(row["photos"]),
        "specs": json.loads(row["specs"]),
    }
