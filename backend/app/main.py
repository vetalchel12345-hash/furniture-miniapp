from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db import database
from app.routes.products import router as products_router
from app.routes.orders import router as orders_router
from app.routes.custom import router as custom_router

app = FastAPI(title="Furniture Mini App API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    await database.init()


@app.get("/")
async def root():
    return {"ok": True, "service": "furniture-miniapp-api"}


app.include_router(products_router)
app.include_router(orders_router)
app.include_router(custom_router)
