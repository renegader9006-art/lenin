from pathlib import Path
from urllib.parse import unquote

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, RedirectResponse, Response
from fastapi.staticfiles import StaticFiles


ROOT = Path(__file__).parent
STATIC_DIR = ROOT / "ClientPart" / "static"
STORAGE_DIR = ROOT / "AdminPart" / "storage"

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def index():
    return RedirectResponse("/home.html")


@app.get("/api/v1/locale/{locale_name}")
def get_locale(locale_name: str):
    locale_path = STORAGE_DIR / "locales" / f"{unquote(locale_name)}.json"
    if locale_path.exists():
        return FileResponse(locale_path, media_type="application/json")
    return JSONResponse({})


@app.get("/api/v1/block/{block_name}/order")
def get_block_order(block_name: str):
    order_path = STORAGE_DIR / "blocks" / unquote(block_name) / "order.json"
    if order_path.exists():
        return FileResponse(order_path, media_type="application/json")
    return JSONResponse([])


@app.get("/api/v1/block/{block_name}/content")
def get_block_content(block_name: str, name: str = Query("")):
    content_path = STORAGE_DIR / "blocks" / unquote(block_name) / unquote(name) / "content.json"
    if content_path.exists():
        return FileResponse(content_path, media_type="application/json")
    return JSONResponse({"status": "content aint exists"})


@app.get("/api/v1/block/{block_name}/attachment")
def get_block_attachment(block_name: str, name: str = Query(""), attachment: str = Query("")):
    folder = STORAGE_DIR / "blocks" / unquote(block_name) / unquote(name)
    if folder.exists():
        for file_path in folder.iterdir():
            if file_path.is_file() and file_path.stem == attachment:
                return FileResponse(file_path)
    return Response(status_code=404)


app.mount("", StaticFiles(directory=STATIC_DIR, html=True), name="static")
