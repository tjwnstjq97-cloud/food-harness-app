"""api_exposure validator
클라이언트에서 직접 외부 API를 호출하는 구조를 탐지한다.
외부 API Key는 반드시 백엔드(Edge Function)을 경유해야 한다.
"""

BLOCKED_CLIENT_PATTERNS = [
    "maps.googleapis.com",
    "openapi.naver.com",
    "dapi.kakao.com",
    "api.yelp.com",
]


def validate(data: dict) -> dict:
    """클라이언트 코드에서 직접 외부 API URL을 호출하는지 검사한다."""
    client_urls = data.get("client_api_urls", [])
    for url in client_urls:
        for blocked in BLOCKED_CLIENT_PATTERNS:
            if blocked in url:
                return {
                    "valid": False,
                    "validator": "api_exposure",
                    "error": f"클라이언트에서 직접 외부 API 호출 금지: {url}. Edge Function 경유 필요.",
                }
    return {"valid": True, "validator": "api_exposure"}
