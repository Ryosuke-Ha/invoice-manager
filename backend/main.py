import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from database import engine
import models
from domain.exceptions import DomainError
from routers import account_titles, batch, freee, invoices, templates, transportation

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="INVOICE_MANAGER API", debug=False)

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(DomainError)
async def domain_error_handler(request: Request, exc: DomainError) -> JSONResponse:
    return JSONResponse(
        status_code=400,
        content={"detail": str(exc)}
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    if os.getenv("ENVIRONMENT") == "production":
        return JSONResponse(
            status_code=500,
            content={"detail": "内部エラーが発生しました。"},
        )
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
    )


@app.get("/health")
async def health_check():
    return {"status": "ok"}


app.include_router(account_titles.router)
app.include_router(invoices.router)
app.include_router(templates.router)
app.include_router(transportation.router)
app.include_router(freee.router)
app.include_router(batch.router)
