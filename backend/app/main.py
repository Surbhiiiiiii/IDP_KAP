from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

from . import auth, routes, users, config
from . import chat

app = FastAPI(title="IDP Knowledge Assistant")

# ------------------------------------------------------
# CORS
# ------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # restrict in production
    allow_methods=["*"],
    allow_headers=["*"],
)


# ------------------------------------------------------
# FIX 1: Prevent favicon.ico from triggering 401
# ------------------------------------------------------
@app.get("/favicon.ico")
async def favicon_fix():
    """
    Prevent browser favicon request from hitting protected routes 
    and causing unwanted 401 redirects.
    """
    return Response(status_code=204)


# ------------------------------------------------------
# FIX 2: Allow OPTIONS requests (CORS preflight)
# ------------------------------------------------------
@app.options("/{path:path}")
async def options_handler(path: str):
    """
    Avoid OPTIONS preflight requests being authenticated.
    """
    return Response(status_code=204)


# ------------------------------------------------------
# Routers
# ------------------------------------------------------
app.include_router(auth.router)
app.include_router(routes.router, prefix="/api")
app.include_router(users.router)
app.include_router(chat.router, prefix="/api")
