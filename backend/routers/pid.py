from fastapi import APIRouter, UploadFile, File, status
from backend.models import APIResponse
from backend.services.pid import PIDParsingService
from backend.config import logger
from backend.models import OpsBrainException

router = APIRouter(tags=["P&ID Parsing"])
pid_service = PIDParsingService()

ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "application/pdf"]

@router.post("/pid/parse", response_model=APIResponse, status_code=status.HTTP_200_OK)
async def parse_pid_endpoint(file: UploadFile = File(...)):
    logger.info(f"Received P&ID upload request: {file.filename} ({file.content_type})")
    
    if file.content_type not in ALLOWED_MIME_TYPES:
        logger.error(f"Unsupported file type uploaded: {file.content_type}")
        raise OpsBrainException(
            f"Unsupported file type: {file.content_type}. Accepted formats are PNG, JPEG, WEBP, or PDF.", 
            code="UNSUPPORTED_MEDIA_TYPE",
            status_code=415
        )
        
    try:
        # Read file bytes
        image_bytes = await file.read()
        
        # Run parsing and DB topology population
        result = pid_service.parse_pid_image(image_bytes, file.content_type)
        
        return APIResponse(
            success=True,
            message="P&ID parsed and topology saved successfully",
            data=result
        )
    except OpsBrainException as oe:
        raise oe
    except Exception as e:
        logger.exception(f"Unexpected error in P&ID parse route: {e}")
        raise OpsBrainException(f"P&ID parse operation failed: {e}", code="PID_PARSE_FAILED")
