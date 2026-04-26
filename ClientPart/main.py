import fastapi
import uvicorn

from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from starlette.types import Scope


app = fastapi.FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def redirect_if_null():
    return fastapi.responses.RedirectResponse("/home.html")


@app.get("/admin")
async def redirect_with_dynamic_url(request: fastapi.Request):
    scheme = request.url.scheme
    host = request.url.hostname

    new_url = f"{scheme}://{host}:8080"

    return fastapi.responses.RedirectResponse(url=new_url)


app.mount("", StaticFiles(directory="static"), name="static")