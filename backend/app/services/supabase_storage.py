from __future__ import annotations

from dataclasses import dataclass
import logging
from typing import Any
from urllib.parse import urlparse

import requests
from fastapi import HTTPException, status

from app.core.config import settings

logger = logging.getLogger(__name__)


@dataclass
class StoredObject:
    bucket: str
    path: str
    public_url: str
    size: int | None = None
    updated_at: str | None = None


class SupabaseStorageService:
    def __init__(self) -> None:
        self._bucket_cache: set[str] = set()

    def is_enabled(self) -> bool:
        return settings.STORAGE_BACKEND == "supabase"

    def _require_config(self) -> tuple[str, str]:
        if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Supabase storage is enabled but SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing",
            )
        return settings.SUPABASE_URL.rstrip("/"), settings.SUPABASE_SERVICE_ROLE_KEY.strip()

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

    @staticmethod
    def _extract_error_detail(response: requests.Response) -> str:
        detail = response.text
        try:
            payload = response.json()
        except ValueError:
            return detail
        if isinstance(payload, dict):
            return (
                payload.get("message")
                or payload.get("error_description")
                or payload.get("error")
                or detail
            )
        return detail

    @classmethod
    def _is_bucket_missing_response(cls, response: requests.Response) -> bool:
        if response.status_code == status.HTTP_404_NOT_FOUND:
            return True
        detail = cls._extract_error_detail(response).lower()
        return "bucket" in detail and any(keyword in detail for keyword in ("not found", "does not exist", "missing"))

    def _request(self, method: str, url: str, **kwargs: Any) -> requests.Response:
        try:
            return requests.request(method, url, timeout=30, **kwargs)
        except requests.RequestException as exc:
            logger.exception("Supabase storage request failed", extra={"url": url, "method": method})
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Supabase storage request failed. Check SUPABASE_URL, service role key, and outbound network access.",
            ) from exc

    def ensure_bucket(self, bucket: str) -> None:
        if bucket in self._bucket_cache:
            return

        base_url, _ = self._require_config()
        detail = ""
        lookup_response = self._request(
            "GET",
            f"{base_url}/storage/v1/bucket/{bucket}",
            headers=self._headers(),
        )
        if lookup_response.status_code < 400:
            self._bucket_cache.add(bucket)
            return

        if lookup_response.status_code != status.HTTP_404_NOT_FOUND:
            detail = self._extract_error_detail(lookup_response)
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Supabase storage bucket check failed for '{bucket}': {detail}",
            )

        create_response = self._request(
            "POST",
            f"{base_url}/storage/v1/bucket",
            headers={**self._headers(), "Content-Type": "application/json"},
            json={"id": bucket, "name": bucket, "public": True},
        )
        if create_response.status_code >= 400:
            detail = self._extract_error_detail(create_response)
            if "already exists" not in detail.lower():
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"Supabase storage bucket creation failed for '{bucket}': {detail}",
                )

        self._bucket_cache.add(bucket)

    def upload_bytes(self, *, bucket: str, path: str, content: bytes, content_type: str) -> str:
        base_url, _ = self._require_config()
        upload_url = f"{base_url}/storage/v1/object/{bucket}/{path}"
        request_kwargs = {
            "headers": {**self._headers(content_type=content_type), "x-upsert": "false"},
            "data": content,
        }
        response = self._request("POST", upload_url, **request_kwargs)
        if self._is_bucket_missing_response(response):
            self.ensure_bucket(bucket)
            response = self._request("POST", upload_url, **request_kwargs)
        if response.status_code >= 400:
            detail = self._extract_error_detail(response)
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Supabase storage upload failed: {detail}")
        self._bucket_cache.add(bucket)
        return self.public_url(bucket, path)

    def list_objects(self, *, folder: str) -> list[StoredObject]:
        bucket = self.bucket_for_folder(folder)
        base_url, _ = self._require_config()
        list_url = f"{base_url}/storage/v1/object/list/{bucket}"
        request_kwargs = {
            "headers": {**self._headers(), "Content-Type": "application/json"},
            "json": {
                "prefix": "",
                "limit": 1000,
                "offset": 0,
                "sortBy": {"column": "updated_at", "order": "desc"},
            },
        }
        response = self._request("POST", list_url, **request_kwargs)
        if self._is_bucket_missing_response(response):
            self.ensure_bucket(bucket)
            response = self._request("POST", list_url, **request_kwargs)
        if response.status_code >= 400:
            detail = self._extract_error_detail(response)
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Supabase storage list failed: {detail}")

        payload = response.json()
        self._bucket_cache.add(bucket)
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

    def delete_object(self, *, bucket: str, path: str) -> None:
        base_url, _ = self._require_config()
        response = self._request(
            "DELETE",
            f"{base_url}/storage/v1/object/{bucket}/{path}",
            headers=self._headers(),
        )
        if response.status_code in {status.HTTP_200_OK, status.HTTP_204_NO_CONTENT, status.HTTP_404_NOT_FOUND}:
            return
        detail = self._extract_error_detail(response)
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Supabase storage delete failed: {detail}")

    def normalize_public_url(self, file_url: str | None) -> str | None:
        if not file_url:
            return None
        prefix = f"{settings.SUPABASE_URL.rstrip('/')}/storage/v1/object/public/"
        if not settings.SUPABASE_URL or not file_url.startswith(prefix):
            return None
        return file_url.removeprefix(prefix).strip("/")


supabase_storage = SupabaseStorageService()
