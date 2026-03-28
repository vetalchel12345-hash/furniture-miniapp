from dataclasses import dataclass
import os
from dotenv import load_dotenv

load_dotenv()


@dataclass
class Settings:
    bot_token: str
    admin_id: int
    database_path: str


def get_settings() -> Settings:
    return Settings(
        bot_token=os.getenv("BOT_TOKEN", ""),
        admin_id=int(os.getenv("ADMIN_ID", "0")),
        database_path=os.getenv("DATABASE_PATH", "./app/data.db"),
    )
