from __future__ import annotations

from dataclasses import dataclass
from typing import Any
from urllib.parse import urlparse

import requests
from fastapi import HTTPException, status

from app.core.config import settings


@dataclass
class StoredObject:
    bucket: str
    path: str
    public_url: str
    size: int | None = None
    updated_at: str | None = None


class SupabaseStorageService:
    def is_enabled(self) -> bool:
        return settings.STORAGE_BACKEND == "supabase"

    def _require_config(self) -> tuple[str, str]:
        if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Supabase storage is enabled but SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing",
            )
        return settings.SUPABASE_URL.rstrip("/"), settings.SUPABASE_SERVICE_ROLE_KEY

    def _headers(self, *, content_type: str | None = None) -> dict[str, str]:
        _, service_key = self._require_config()
        headers = {
            "Authorization": f"Bearer {service_key}",
            "apikey": service_key,
        }
        if content_type:
            headers["Content-Type"] = content_type
        return headers

    def bucket_for_folder(self, folder: str) -> str:
        if folder == "images":
            return settings.SUPABASE_IMAGES_BUCKET
        if folder == "subtitles":
            return settings.SUPABASE_SUBTITLES_BUCKET
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported upload folder")

    def public_url(self, bucket: str, path: str) -> str:
        base_url, _ = self._require_config()
        return f"{base_url}/storage/v1/object/public/{bucket}/{path}"

    def upload_bytes(self, *, bucket: str, path: str, content: bytes, content_type: str) -> str:
        base_url, _ = self._require_config()
        response = requests.post(
            f"{base_url}/storage/v1/object/{bucket}/{path}",
            headers={**self._headers(content_type=content_type), "x-upsert": "false"},
            data=content,
            timeout=30,
        )
        if response.status_code >= 400:
            detail = response.text
            try:
                detail = response.json().get("message") or response.json().get("error") or detail
            except ValueError:
                pass
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Supabase storage upload failed: {detail}")
        return self.public_url(bucket, path)

    def list_objects(self, *, folder: str) -> list[StoredObject]:
        bucket = self.bucket_for_folder(folder)
        base_url, _ = self._require_config()
        response = requests.post(
            f"{base_url}/storage/v1/object/list/{bucket}",
            headers={**self._headers(), "Content-Type": "application/json"},
            json={"limit": 1000, "offset": 0, "sortBy": {"column": "updated_at", "order": "desc"}},
            timeout=30,
        )
        if response.status_code >= 400:
            detail = response.text
            try:
                detail = response.json().get("message") or response.json().get("error") or detail
            except ValueError:
                pass
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Supabase storage list failed: {detail}")

        payload = response.json()
        items: list[StoredObject] = []
        for item in payload:
            name = item.get("name")
            if not name:
                continue
            items.append(
                StoredObject(
                    bucket=bucket,
                    path=name,
                    public_url=self.public_url(bucket, name),
                    size=item.get("metadata", {}).get("size"),
                    updated_at=item.get("updated_at"),
                )
            )
        return items

    def normalize_public_url(self, file_url: str | None) -> str | None:
        if not file_url:
            return None
        prefix = f"{settings.SUPABASE_URL.rstrip('/')}/storage/v1/object/public/"
        if not settings.SUPABASE_URL or not file_url.startswith(prefix):
            return None
        return file_url.removeprefix(prefix).strip("/")


supabase_storage = SupabaseStorageService()
