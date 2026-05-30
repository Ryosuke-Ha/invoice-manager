import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from database import engine
import models
from domain.exceptions import DomainError
from routers import account_titles, freee, invoices, templates, transportation

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="INVOICE_MANAGER API")

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(DomainError)
async def domain_error_handler(request, exc: DomainError):
    return JSONResponse(
        status_code=400,
        content={"detail": str(exc)}
    )


@app.get("/health")
async def health_check():
    return {"status": "ok"}


app.include_router(account_titles.router)
app.include_router(invoices.router)
app.include_router(templates.router)
app.include_router(transportation.router)
app.include_router(freee.router)
