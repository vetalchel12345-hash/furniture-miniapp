import json
import aiosqlite
from app.config import get_settings


class Database:
    def __init__(self, path: str):
        self.path = path

    async def connect(self):
        db = await aiosqlite.connect(self.path)
        db.row_factory = aiosqlite.Row
        return db

    async def init(self):
        db = await self.connect()
        try:
            await db.executescript(
                """
                CREATE TABLE IF NOT EXISTS products (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    category TEXT NOT NULL,
                    name TEXT NOT NULL,
                    description TEXT NOT NULL,
                    price INTEGER NOT NULL,
                    old_price INTEGER NOT NULL DEFAULT 0,
                    badge TEXT NOT NULL DEFAULT '',
                    short_specs TEXT NOT NULL DEFAULT '',
                    photos TEXT NOT NULL DEFAULT '[]',
                    specs TEXT NOT NULL DEFAULT '[]'
                );

                CREATE TABLE IF NOT EXISTS orders (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    customer_name TEXT NOT NULL,
                    phone TEXT NOT NULL,
                    city TEXT NOT NULL,
                    comment TEXT,
                    items TEXT NOT NULL,
                    total_price INTEGER NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS custom_orders (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    furniture_type TEXT NOT NULL,
                    dimensions TEXT NOT NULL,
                    material TEXT NOT NULL,
                    description TEXT NOT NULL,
                    contacts TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                """
            )
            await db.commit()

            cursor = await db.execute("SELECT COUNT(*) FROM products")
            count_row = await cursor.fetchone()
            count = count_row[0] if count_row else 0

            if count == 0:
                demo_products = [
                    (
                        "divany-3",
                        "Диван Лофт, 220x95x90",
                        "Прямой диван в современном стиле с мягкой посадкой и лаконичной геометрией.",
                        21262,
                        75400,
                        "ХОРОШАЯ ЦЕНА",
                        "бежевый · еврокнижка · 220 см",
                        json.dumps([
                            "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200&auto=format&fit=crop",
                            "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?q=80&w=1200&auto=format&fit=crop",
                            "https://images.unsplash.com/photo-1484101403633-562f891dc89a?q=80&w=1200&auto=format&fit=crop"
                        ], ensure_ascii=False),
                        json.dumps([
                            ["Ширина предмета", "220 см"],
                            ["Высота сиденья", "45 см"],
                            ["Материал обивки", "Велюр"],
                            ["Механизм", "Еврокнижка"],
                            ["Стиль дизайна", "Лофт / Современный"],
                            ["Ящик для белья", "Есть"]
                        ], ensure_ascii=False)
                    ),
                    (
                        "divany-3",
                        "Диван Milano 3M",
                        "Трёхместный диван для просторной гостиной с акцентом на мягкость и премиальную ткань.",
                        119000,
                        138000,
                        "НОВИНКА",
                        "серый · прямой · 245 см",
                        json.dumps([
                            "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=1200&auto=format&fit=crop",
                            "https://images.unsplash.com/photo-1501045661006-fcebe0257c3f?q=80&w=1200&auto=format&fit=crop",
                            "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1200&auto=format&fit=crop"
                        ], ensure_ascii=False),
                        json.dumps([
                            ["Ширина предмета", "245 см"],
                            ["Высота сиденья", "44 см"],
                            ["Материал обивки", "Букле"],
                            ["Механизм", "Нераскладной"],
                            ["Стиль дизайна", "Минимализм"],
                            ["Ящик для белья", "Нет"]
                        ], ensure_ascii=False)
                    ),
                    (
                        "divany-2",
                        "Диван Loft 2M",
                        "Компактный двухместный диван для квартиры, кабинета и зоны ожидания.",
                        89000,
                        104000,
                        "СКИДКА",
                        "графит · компактный · 180 см",
                        json.dumps([
                            "https://images.unsplash.com/photo-1549187774-b4e9b0445b41?q=80&w=1200&auto=format&fit=crop",
                            "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200&auto=format&fit=crop",
                            "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?q=80&w=1200&auto=format&fit=crop"
                        ], ensure_ascii=False),
                        json.dumps([
                            ["Ширина предмета", "180 см"],
                            ["Высота сиденья", "44 см"],
                            ["Материал обивки", "Велюр"],
                            ["Механизм", "Нераскладной"],
                            ["Стиль дизайна", "Современный"],
                            ["Ящик для белья", "Нет"]
                        ], ensure_ascii=False)
                    ),
                    (
                        "divany-corner",
                        "Угловой диван Grand",
                        "Премиальный угловой диван для большого пространства и семейной гостиной.",
                        165000,
                        189000,
                        "ПРЕМИУМ",
                        "светло-бежевый · угловой · 310 см",
                        json.dumps([
                            "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=1200&auto=format&fit=crop",
                            "https://images.unsplash.com/photo-1484101403633-562f891dc89a?q=80&w=1200&auto=format&fit=crop",
                            "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1200&auto=format&fit=crop"
                        ], ensure_ascii=False),
                        json.dumps([
                            ["Ширина предмета", "310 см"],
                            ["Высота сиденья", "43 см"],
                            ["Материал обивки", "Шенилл"],
                            ["Механизм", "Пума"],
                            ["Стиль дизайна", "Современный"],
                            ["Ящик для белья", "Есть"]
                        ], ensure_ascii=False)
                    ),
                    (
                        "armchairs",
                        "Кресло Soft Lounge",
                        "Акцентное кресло с мягкой посадкой для спальни и гостиной.",
                        54000,
                        62000,
                        "ХИТ",
                        "молочный · мягкое · 95 см",
                        json.dumps([
                            "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200&auto=format&fit=crop",
                            "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1200&auto=format&fit=crop",
                            "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?q=80&w=1200&auto=format&fit=crop"
                        ], ensure_ascii=False),
                        json.dumps([
                            ["Ширина предмета", "95 см"],
                            ["Высота сиденья", "42 см"],
                            ["Материал обивки", "Букле"],
                            ["Стиль дизайна", "Современный"],
                            ["Каркас", "Дерево / металл"]
                        ], ensure_ascii=False)
                    ),
                    (
                        "poufs",
                        "Пуф Elegance",
                        "Премиальный пуф для спальни, гардеробной и lounge-зоны.",
                        24000,
                        29000,
                        "АКЦИЯ",
                        "песочный · круглый · 55 см",
                        json.dumps([
                            "https://images.unsplash.com/photo-1501045661006-fcebe0257c3f?q=80&w=1200&auto=format&fit=crop",
                            "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?q=80&w=1200&auto=format&fit=crop",
                            "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1200&auto=format&fit=crop"
                        ], ensure_ascii=False),
                        json.dumps([
                            ["Диаметр", "55 см"],
                            ["Высота", "42 см"],
                            ["Материал обивки", "Велюр"],
                            ["Стиль дизайна", "Современный"]
                        ], ensure_ascii=False)
                    ),
                    (
                        "beds",
                        "Кровать Premium Line",
                        "Большая мягкая кровать с высоким изголовьем и эффектным силуэтом.",
                        128000,
                        149000,
                        "ПРЕМИУМ",
                        "графит · высокая спинка · 200x180",
                        json.dumps([
                            "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200&auto=format&fit=crop",
                            "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200&auto=format&fit=crop",
                            "https://images.unsplash.com/photo-1484101403633-562f891dc89a?q=80&w=1200&auto=format&fit=crop"
                        ], ensure_ascii=False),
                        json.dumps([
                            ["Размер спального места", "200x180 см"],
                            ["Материал обивки", "Велюр"],
                            ["Подъёмный механизм", "Есть"],
                            ["Ящик для хранения", "Есть"],
                            ["Стиль дизайна", "Современный"]
                        ], ensure_ascii=False)
                    )
                ]

                await db.executemany(
                    """
                    INSERT INTO products(category, name, description, price, old_price, badge, short_specs, photos, specs)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    demo_products
                )
                await db.commit()
        finally:
            await db.close()

    async def fetchall(self, query: str, params: tuple = ()):
        db = await self.connect()
        try:
            cursor = await db.execute(query, params)
            rows = await cursor.fetchall()
            return rows
        finally:
            await db.close()

    async def fetchone(self, query: str, params: tuple = ()):
        db = await self.connect()
        try:
            cursor = await db.execute(query, params)
            row = await cursor.fetchone()
            return row
        finally:
            await db.close()

    async def execute(self, query: str, params: tuple = ()):
        db = await self.connect()
        try:
            cursor = await db.execute(query, params)
            await db.commit()
            return cursor.lastrowid
        finally:
            await db.close()


settings = get_settings()
database = Database(settings.database_path)
