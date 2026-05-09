interface CoverCropResult {
  cropX: number;
  cropY: number;
  cropWidth: number;
  cropHeight: number;
}

function computeCoverCrop(
  imageWidth: number,
  imageHeight: number,
  cardWidth: number,
  cardHeight: number,
): CoverCropResult {
  const imageAspect = imageWidth / imageHeight;
  const cardAspect = cardWidth / cardHeight;

  let cropWidth: number;
  let cropHeight: number;

  if (imageAspect > cardAspect) {
    cropHeight = imageHeight;
    cropWidth = imageHeight * cardAspect;
  } else {
    cropWidth = imageWidth;
    cropHeight = imageWidth / cardAspect;
  }

  const cropX = (imageWidth - cropWidth) / 2;
  const cropY = (imageHeight - cropHeight) / 2;

  return { cropX, cropY, cropWidth, cropHeight };
}

export default computeCoverCrop;
export type { CoverCropResult };
