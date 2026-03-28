import asyncio
import os

from aiogram import Bot, Dispatcher, F
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.filters import CommandStart
from aiogram.types import Message, ReplyKeyboardMarkup, KeyboardButton, WebAppInfo
from dotenv import load_dotenv

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN", "")
WEBAPP_URL = os.getenv("WEBAPP_URL", "")

dp = Dispatcher()


def kb():
    return ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="🛍 Открыть магазин", web_app=WebAppInfo(url=WEBAPP_URL))],
            [KeyboardButton(text="📞 Менеджер")]
        ],
        resize_keyboard=True
    )


@dp.message(CommandStart())
async def start_cmd(message: Message):
    await message.answer(
        "<b>Добро пожаловать в магазин мебели</b>\n\nНажмите кнопку ниже, чтобы открыть Mini App.",
        reply_markup=kb()
    )


@dp.message(F.text == "📞 Менеджер")
async def manager(message: Message):
    await message.answer("Связь с менеджером: @your_manager")


@dp.message(F.web_app_data)
async def webapp_data(message: Message):
    await message.answer(f"Получены данные из Mini App:\n{message.web_app_data.data}")


async def main():
    if not BOT_TOKEN:
        raise RuntimeError("В .env не указан BOT_TOKEN")
    if not WEBAPP_URL:
        raise RuntimeError("В .env не указан WEBAPP_URL")

    bot = Bot(
        token=BOT_TOKEN,
        default=DefaultBotProperties(parse_mode=ParseMode.HTML)
    )
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
